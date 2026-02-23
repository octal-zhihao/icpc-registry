import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Registration, Attachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RegistrationDetailModal } from '@/components/RegistrationDetailModal';
import { Search, Filter, RefreshCcw, Mail, Loader2, Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Email sending state
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0, failed: 0 });

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === 'trash') {
        query = query.not('deleted_at', 'is', null);
      } else {
        query = query.is('deleted_at', null);
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
      }

      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,college.ilike.%${debouncedSearchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('加载报名数据失败');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleViewDetails = async (registration: Registration) => {
    try {
      // Don't set loading here to avoid full page re-render flicker
      // Just open modal and let it load or pass empty first
      setSelectedRegistration(registration);
      setSelectedAttachments([]); // Clear previous
      setIsModalOpen(true);

      const { data: attachments, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('registration_id', registration.id);
      
      if (error) throw error;
      
      setSelectedAttachments(attachments || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast.error('加载附件失败');
    }
  };

  const handleSendEmails = async () => {
    // 1. Get all registrations that need emails (approved or rejected, and not yet sent)
    const pendingEmails = registrations.filter(r => 
        (r.status === 'approved' || r.status === 'rejected') && 
        r.email_sent_status !== 'sent' &&
        !r.deleted_at
    );

    if (pendingEmails.length === 0) {
        toast.info('没有待发送邮件的记录');
        return;
    }

    if (!confirm(`准备给 ${pendingEmails.length} 位用户发送审核结果邮件，确定继续吗？`)) {
        return;
    }

    setIsSendingEmails(true);
    // Initialize progress counters locally to track this batch
    let successCount = 0;
    let failCount = 0;
    setEmailProgress({ sent: 0, total: pendingEmails.length, failed: 0 });

    try {
        // Fetch templates
        const { data: templates, error: templatesError } = await supabase.from('email_templates').select('*');
        if (templatesError) throw templatesError;

        const approvedTemplate = templates?.find(t => t.template_type === 'approved');
        const rejectedTemplate = templates?.find(t => t.template_type === 'rejected');

        if (!approvedTemplate || !rejectedTemplate) {
            throw new Error('邮件模板未配置');
        }

        // Get current operator ID
        const { data: { user } } = await supabase.auth.getUser();

        for (const reg of pendingEmails) {
            const template = reg.status === 'approved' ? approvedTemplate : rejectedTemplate;
            
            // Replace placeholders
            const personalizedContent = template.content.replace('{{name}}', reg.name);

            try {
                // Determine API URL based on environment
                const apiUrl = import.meta.env.PROD 
                    ? '/api/send-email' // Vercel production
                    : 'http://localhost:3000/api/send-email'; // Local Vercel Dev

                // Call Vercel API Route (Proxy to Resend)
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: reg.email,
                        subject: template.subject,
                        html: personalizedContent,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Email API Error:', errorData);
                    throw new Error(errorData.error?.message || errorData.error || `HTTP ${response.status}`);
                }
                
                // Update log and status
                await supabase.from('email_logs').insert({
                    registration_id: reg.id,
                    template_type: reg.status,
                    recipient_email: reg.email,
                    sent_success: true,
                    sent_at: new Date().toISOString(),
                    operator_id: user?.id // Record operator ID
                });

                await supabase.from('registrations').update({
                    email_sent_status: 'sent',
                    email_sent_at: new Date().toISOString()
                }).eq('id', reg.id);

                successCount++;
                setEmailProgress(prev => ({ ...prev, sent: prev.sent + 1 }));

            } catch (error: any) {
                console.error(`Failed to send to ${reg.email}`, error);
                
                // Record failure in logs too
                await supabase.from('email_logs').insert({
                    registration_id: reg.id,
                    template_type: reg.status,
                    recipient_email: reg.email,
                    sent_success: false,
                    error_message: error.message || 'Unknown error',
                    sent_at: new Date().toISOString(),
                    operator_id: user?.id
                });

                await supabase.from('registrations').update({
                    email_sent_status: 'failed'
                }).eq('id', reg.id);
                
                failCount++;
                setEmailProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
            }
        }
        
        if (failCount > 0) {
            toast.warning(`发送完成：${successCount} 成功，${failCount} 失败。请检查控制台了解详情。`);
        } else {
            toast.success(`所有 ${successCount} 封邮件发送成功`);
        }
        
        fetchRegistrations();

    } catch (error: any) {
        console.error('Batch send error:', error);
        toast.error('邮件发送中断: ' + error.message);
    } finally {
        setIsSendingEmails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">报名管理</h1>
        <div className="flex gap-2">
            <Link to="/admin/email-templates">
                <Button variant="outline">邮件模板设置</Button>
            </Link>
            <Button onClick={fetchRegistrations} variant="outline" size="icon">
                <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button 
                onClick={handleSendEmails} 
                disabled={isSendingEmails}
                className="bg-blue-600 hover:bg-blue-700"
            >
                {isSendingEmails ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Mail className="mr-2 h-4 w-4" />
                )}
                {isSendingEmails ? `发送中 (${emailProgress.sent}/${emailProgress.total})` : '一键发送结果邮件'}
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="搜索姓名、学院..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">所有状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
                <option value="trash">垃圾箱</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">姓名</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">学院 / 专业</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">入学年份</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">联系方式</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">状态</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">邮件状态</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="h-24 text-center">
                        加载中...
                      </td>
                    </tr>
                  ) : registrations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-24 text-center text-gray-500">
                        暂无报名记录
                      </td>
                    </tr>
                  ) : (
                    registrations.map((reg) => (
                      <tr key={reg.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{reg.name}</td>
                        <td className="p-4 align-middle">
                          <div>{reg.college}</div>
                          <div className="text-xs text-gray-500">{reg.major}</div>
                        </td>
                        <td className="p-4 align-middle">{reg.enrollment_year}</td>
                        <td className="p-4 align-middle">
                          <div>{reg.email}</div>
                          <div className="text-xs text-gray-500">QQ: {reg.qq}</div>
                        </td>
                        <td className="p-4 align-middle">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                            reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {reg.status === 'approved' ? '已通过' :
                             reg.status === 'rejected' ? '已拒绝' : '待审核'}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                            {reg.email_sent_status === 'sent' ? (
                                <span className="text-green-600 text-xs flex items-center">
                                    <Check className="w-3 h-3 mr-1" /> 已发送
                                </span>
                            ) : reg.email_sent_status === 'failed' ? (
                                <span className="text-red-600 text-xs flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> 发送失败
                                </span>
                            ) : (
                                <span className="text-gray-400 text-xs">未发送</span>
                            )}
                        </td>
                        <td className="p-4 align-middle">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(reg)}>
                            查看详情
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRegistration && (
        <RegistrationDetailModal
          registration={selectedRegistration}
          attachments={selectedAttachments}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={fetchRegistrations}
        />
      )}
    </div>
  );
}
