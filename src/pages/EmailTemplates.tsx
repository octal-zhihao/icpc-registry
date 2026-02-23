import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { EmailTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('获取邮件模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, field: keyof EmailTemplate, value: string) => {
    setTemplates(prev => 
      prev.map(t => t.id === id ? { ...t, [field]: value } : t)
    );
  };

  const handleSave = async (template: EmailTemplate) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: template.subject,
          content: template.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id);

      if (error) throw error;
      toast.success('模板保存成功');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">邮件模板设置</h1>
      </div>

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {template.template_type === 'approved' ? '审核通过通知' : '审核拒绝通知'}
                </span>
                <Button 
                  onClick={() => handleSave(template)} 
                  disabled={saving}
                  size="sm"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  保存
                </Button>
              </CardTitle>
              <CardDescription>
                配置当报名{template.template_type === 'approved' ? '通过' : '被拒绝'}时发送的邮件内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>邮件标题</Label>
                <Input 
                  value={template.subject}
                  onChange={(e) => handleUpdate(template.id, 'subject', e.target.value)}
                  placeholder="请输入邮件标题"
                />
              </div>
              <div className="space-y-2">
                <Label>邮件正文</Label>
                <Textarea 
                  value={template.content}
                  onChange={(e) => handleUpdate(template.id, 'content', e.target.value)}
                  placeholder="请输入邮件正文"
                  className="h-32"
                />
                <p className="text-xs text-gray-500">
                  注：系统会自动在邮件中附带学生的姓名和报名信息。
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
            未找到邮件模板配置，请检查数据库初始化是否完成。
          </div>
        )}
      </div>
    </div>
  );
}
