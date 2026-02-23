import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Registration, Attachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegistrationDetailModal } from '@/components/RegistrationDetailModal';
import { Search, Filter, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,college.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleViewDetails = async (registration: Registration) => {
    try {
      const { data: attachments, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('registration_id', registration.id);
      
      if (error) throw error;
      
      setSelectedRegistration(registration);
      setSelectedAttachments(attachments || []);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching attachments:', error);
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
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center">
                        加载中...
                      </td>
                    </tr>
                  ) : registrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center text-gray-500">
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
