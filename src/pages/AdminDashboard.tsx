import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Registration, Attachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RegistrationDetailModal } from '@/components/RegistrationDetailModal';
import { Search, Filter, RefreshCcw, Mail, Loader2, Check, AlertTriangle, ChevronLeft, ChevronRight, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Email sending state
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0, failed: 0 });

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset page on search
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]); // Clear selection on filter change
  }, [statusFilter]);

  const fetchStats = async () => {
      const { data, error } = await supabase.from('registrations').select('status, deleted_at');
      if (!error && data) {
          const active = data.filter(r => !r.deleted_at);
          setStats({
              total: active.length,
              pending: active.filter(r => r.status === 'pending').length,
              approved: active.filter(r => r.status === 'approved').length,
              rejected: active.filter(r => r.status === 'rejected').length,
          });
      }
  };

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('registrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

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

      const { data, error, count } = await query;

      if (error) throw error;
      
      setRegistrations(data || []);
      setHasMore(count ? (page * PAGE_SIZE < count) : false);
      
      // Update stats as well
      fetchStats();

    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('加载报名数据失败');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, page]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleViewDetails = async (registration: Registration) => {
    try {
      setSelectedRegistration(registration);
      setSelectedAttachments([]); 
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

  // Batch Operations
  const toggleSelectAll = () => {
      if (selectedIds.length === registrations.length && registrations.length > 0) {
          setSelectedIds([]);
      } else {
          setSelectedIds(registrations.map(r => r.id));
      }
  };

  const toggleSelect = (id: string) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const handleBatchReview = async (status: 'approved' | 'rejected') => {
      if (!selectedIds.length) return;
      if (!confirm(`确定要将选中的 ${selectedIds.length} 条记录标记为 ${status === 'approved' ? '已通过' : '已拒绝'} 吗？`)) return;

      setIsBatchProcessing(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          const { error } = await supabase
            .from('registrations')
            .update({
                status,
                reviewed_by: user?.id,
                updated_at: new Date().toISOString()
            })
            .in('id', selectedIds);

          if (error) throw error;

          toast.success('批量操作成功');
          setSelectedIds([]);
          fetchRegistrations();
      } catch (error: any) {
          toast.error('批量操作失败: ' + error.message);
      } finally {
          setIsBatchProcessing(false);
      }
  };

  const handleSendEmails = async () => {
    // Note: This only processes currently fetched records. 
    // For production with pagination, this logic should likely be moved to a backend function 
    // or we need to fetch ALL pending emails first.
    // For now, let's fetch all pending emails explicitly for this action.
    
    setIsSendingEmails(true);
    try {
        // 1. Fetch ALL pending emails (ignoring pagination)
        const { data: allPending, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .in('status', ['approved', 'rejected'])
            .neq('email_sent_status', 'sent')
            .is('deleted_at', null);
            
        if (fetchError) throw fetchError;

        const pendingEmails = allPending || [];

        if (pendingEmails.length === 0) {
            toast.info('没有待发送邮件的记录');
            setIsSendingEmails(false);
            return;
        }

        if (!confirm(`准备给 ${pendingEmails.length} 位用户发送审核结果邮件，确定继续吗？`)) {
            setIsSendingEmails(false);
            return;
        }

        let successCount = 0;
        let failCount = 0;
        setEmailProgress({ sent: 0, total: pendingEmails.length, failed: 0 });

        // Fetch templates
        const { data: templates, error: templatesError } = await supabase.from('email_templates').select('*');
        if (templatesError) throw templatesError;

        const approvedTemplate = templates?.find(t => t.template_type === 'approved');
        const rejectedTemplate = templates?.find(t => t.template_type === 'rejected');

        if (!approvedTemplate || !rejectedTemplate) {
            throw new Error('邮件模板未配置');
        }

        const { data: { user } } = await supabase.auth.getUser();

        for (const reg of pendingEmails) {
            const template = reg.status === 'approved' ? approvedTemplate : rejectedTemplate;
            const personalizedContent = template.content.replace('{{name}}', reg.name);

            try {
                const apiUrl = import.meta.env.PROD 
                    ? '/api/send-email'
                    : 'http://localhost:3000/api/send-email';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: reg.email,
                        subject: template.subject,
                        html: personalizedContent,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
                }
                
                await supabase.from('email_logs').insert({
                    registration_id: reg.id,
                    template_type: reg.status,
                    recipient_email: reg.email,
                    sent_success: true,
                    sent_at: new Date().toISOString(),
                    operator_id: user?.id
                });

                await supabase.from('registrations').update({
                    email_sent_status: 'sent',
                    email_sent_at: new Date().toISOString()
                }).eq('id', reg.id);

                successCount++;
                setEmailProgress(prev => ({ ...prev, sent: prev.sent + 1 }));

            } catch (error: any) {
                console.error(`Failed to send to ${reg.email}`, error);
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
            toast.warning(`发送完成：${successCount} 成功，${failCount} 失败。`);
        } else {
            toast.success(`所有 ${successCount} 封邮件发送成功`);
        }
        
        fetchRegistrations(); // Refresh list

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
        <div>
            <h1 className="text-3xl font-bold tracking-tight">报名管理</h1>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 总数: {stats.total}</span>
                <span className="flex items-center gap-1 text-yellow-600"><Clock className="w-4 h-4" /> 待审核: {stats.pending}</span>
                <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> 已通过: {stats.approved}</span>
                <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> 已拒绝: {stats.rejected}</span>
            </div>
        </div>
        <div className="flex gap-2">
            <Link to="/admin/email-templates">
                <Button variant="outline">邮件模板设置</Button>
            </Link>
            <Button onClick={fetchRegistrations} variant="outline" size="icon" disabled={loading}>
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
            
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-md animate-in fade-in">
                    <span className="text-sm font-medium text-blue-700">已选 {selectedIds.length} 项</span>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 bg-white text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        onClick={() => handleBatchReview('approved')}
                        disabled={isBatchProcessing}
                    >
                        {isBatchProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                        通过
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleBatchReview('rejected')}
                        disabled={isBatchProcessing}
                    >
                        {isBatchProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                        拒绝
                    </Button>
                </div>
            )}

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
                    <th className="h-12 px-4 w-10 text-center align-middle">
                        <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={registrations.length > 0 && selectedIds.length === registrations.length}
                            onChange={toggleSelectAll}
                        />
                    </th>
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
                      <td colSpan={8} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            加载中...
                        </div>
                      </td>
                    </tr>
                  ) : registrations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="h-24 text-center text-gray-500">
                        暂无报名记录
                      </td>
                    </tr>
                  ) : (
                    registrations.map((reg) => (
                      <tr key={reg.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 w-10 text-center align-middle">
                            <input 
                                type="checkbox" 
                                className="rounded border-gray-300"
                                checked={selectedIds.includes(reg.id)}
                                onChange={() => toggleSelect(reg.id)}
                            />
                        </td>
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
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-gray-500">
                    第 {page} 页
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        上一页
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMore || loading}
                    >
                        下一页
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
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
