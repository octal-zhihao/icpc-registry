import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Registration, Attachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, X, Check, FileText, Trash2, RotateCcw, AlertTriangle, Mail, Pencil, Save } from 'lucide-react';
import { withTimeout } from '@/lib/api-helpers';

interface RegistrationDetailModalProps {
  registration: Registration;
  attachments: Attachment[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function RegistrationDetailModal({
  registration,
  attachments,
  isOpen,
  onClose,
  onUpdate,
}: RegistrationDetailModalProps) {
  const [reviewNote, setReviewNote] = useState(registration.review_note || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
      name: registration.name,
      student_id: registration.student_id,
      college: registration.college,
      major: registration.major,
      enrollment_year: registration.enrollment_year.toString(),
      email: registration.email,
      qq: registration.qq,
      resume: registration.resume,
  });

  // Sync state when registration changes
  useEffect(() => {
      setEditForm({
          name: registration.name,
          student_id: registration.student_id,
          college: registration.college,
          major: registration.major,
          enrollment_year: registration.enrollment_year.toString(),
          email: registration.email,
          qq: registration.qq,
          resume: registration.resume,
      });
      setReviewNote(registration.review_note || '');
      setIsEditing(false);
  }, [registration]);

  if (!isOpen) return null;

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await withTimeout(
        supabase
          .from('registrations')
          .update({
            status,
            review_note: reviewNote,
            reviewed_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', registration.id),
        10000
      );

      if (error) throw error;

      toast.success(status === 'approved' ? '已审核通过' : '已拒绝报名');

      onClose();
      onUpdate();
    } catch (error: any) {
      console.error('Review error:', error);
      toast.error('审核操作失败: ' + (error.message || '未知错误'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetEmail = async () => {
      if (!confirm('确定要重置邮件状态吗？这允许您再次向该用户发送通知邮件。')) return;
      setIsProcessing(true);
      try {
          const { error } = await withTimeout(
              supabase
                  .from('registrations')
                  .update({
                      email_sent_status: 'pending',
                      email_sent_at: null
                  })
                  .eq('id', registration.id),
              10000
          );

          if (error) throw error;
          toast.success('邮件状态已重置');
          onClose();
          onUpdate();
      } catch (error: any) {
          toast.error('重置失败: ' + (error.message || '未知错误'));
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSaveChanges = async () => {
      setIsProcessing(true);
      try {
          const { error } = await withTimeout(
              supabase
                  .from('registrations')
                  .update({
                      name: editForm.name,
                      student_id: editForm.student_id,
                      college: editForm.college,
                      major: editForm.major,
                      enrollment_year: parseInt(editForm.enrollment_year),
                      email: editForm.email,
                      qq: editForm.qq,
                      resume: editForm.resume,
                      updated_at: new Date().toISOString()
                  })
                  .eq('id', registration.id),
              10000
          );

          if (error) throw error;
          toast.success('信息修改成功');
          setIsEditing(false);
          onUpdate();
      } catch (error: any) {
          toast.error('保存失败: ' + (error.message || '未知错误'));
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDelete = async () => {
    if (!confirm('确定要将此报名移入垃圾箱吗？')) return;
    setIsProcessing(true);
    try {
        const { error } = await withTimeout(
            supabase
                .from('registrations')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', registration.id),
            10000
        );

        if (error) throw error;
        toast.success('已移入垃圾箱');
        onClose();
        onUpdate();
    } catch (error: any) {
        toast.error('操作失败: ' + (error.message || '未知错误'));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
        const { error } = await withTimeout(
            supabase
                .from('registrations')
                .update({ deleted_at: null })
                .eq('id', registration.id),
            10000
        );

        if (error) throw error;
        toast.success('已恢复');
        onClose();
        onUpdate();
    } catch (error: any) {
        toast.error('操作失败: ' + (error.message || '未知错误'));
    } finally {
        setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
      if (!confirm('警告：此操作不可恢复！确定要永久删除该记录吗？')) return;
      setIsProcessing(true);
      try {
          const { error } = await withTimeout(
              supabase
                  .from('registrations')
                  .delete()
                  .eq('id', registration.id),
              10000
          );

          if (error) throw error;
          toast.success('已永久删除');
          onClose();
          onUpdate();
      } catch (error: any) {
          toast.error('删除失败: ' + (error.message || '未知错误'));
      } finally {
          setIsProcessing(false);
      }
  }

  const isDeleted = !!registration.deleted_at;
  const isEmailSent = registration.email_sent_status === 'sent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">报名详情 {isDeleted && <span className="text-red-500 text-sm ml-2">(已删除)</span>}</h2>
              {!isDeleted && !isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4 mr-1" /> 编辑
                  </Button>
              )}
              {isEditing && (
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isProcessing}>
                          取消
                      </Button>
                      <Button size="sm" onClick={handleSaveChanges} disabled={isProcessing}>
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                          保存
                      </Button>
                  </div>
              )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isProcessing}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Info Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-500">姓名</Label>
              {isEditing ? (
                  <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              ) : (
                  <div className="font-medium text-lg">{registration.name}</div>
              )}
            </div>
            <div>
              <Label className="text-gray-500">学号</Label>
              {isEditing ? (
                  <Input value={editForm.student_id} onChange={e => setEditForm({...editForm, student_id: e.target.value})} />
              ) : (
                  <div className="font-medium">{registration.student_id}</div>
              )}
            </div>
            <div>
              <Label className="text-gray-500">状态</Label>
              <div className="mt-1">
                <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                    registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                    registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                    {registration.status === 'approved' ? '已通过' :
                    registration.status === 'rejected' ? '已拒绝' : '待审核'}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-gray-500">学院</Label>
              {isEditing ? (
                  <Input value={editForm.college} onChange={e => setEditForm({...editForm, college: e.target.value})} />
              ) : (
                  <div className="font-medium">{registration.college}</div>
              )}
            </div>
            <div>
              <Label className="text-gray-500">专业</Label>
              {isEditing ? (
                  <Input value={editForm.major} onChange={e => setEditForm({...editForm, major: e.target.value})} />
              ) : (
                  <div className="font-medium">{registration.major}</div>
              )}
            </div>
            <div>
              <Label className="text-gray-500">入学年份</Label>
              {isEditing ? (
                  <Input type="number" value={editForm.enrollment_year} onChange={e => setEditForm({...editForm, enrollment_year: e.target.value})} />
              ) : (
                  <div className="font-medium">{registration.enrollment_year}</div>
              )}
            </div>
            <div>
              <Label className="text-gray-500">邮箱</Label>
              {isEditing ? (
                  <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
              ) : (
                  <div className="font-medium">{registration.email}</div>
              )}
            </div>
            <div>
              <Label className="text-gray-500">QQ</Label>
              {isEditing ? (
                  <Input value={editForm.qq} onChange={e => setEditForm({...editForm, qq: e.target.value})} />
              ) : (
                  <div className="font-medium">{registration.qq}</div>
              )}
            </div>
            <div>
              <Label className="text-gray-500">提交时间</Label>
              <div className="font-medium">{new Date(registration.created_at).toLocaleString()}</div>
            </div>
            {isDeleted && (
                <div>
                    <Label className="text-gray-500">删除时间</Label>
                    <div className="font-medium text-red-500">{new Date(registration.deleted_at!).toLocaleString()}</div>
                </div>
            )}
            {!isDeleted && (
                <div>
                    <Label className="text-gray-500">邮件通知状态</Label>
                    <div className="font-medium flex items-center gap-2 mt-1">
                        {registration.email_sent_status === 'sent' ? (
                            <>
                                <span className="text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> 已发送 ({new Date(registration.email_sent_at!).toLocaleString()})</span>
                                <Button variant="outline" size="sm" className="h-6 text-xs ml-2" onClick={handleResetEmail} disabled={isProcessing}>
                                    <RotateCcw className="w-3 h-3 mr-1" /> 重置状态
                                </Button>
                            </>
                        ) : registration.email_sent_status === 'failed' ? (
                            <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> 发送失败</span>
                        ) : (
                            <span className="text-gray-500">未发送</span>
                        )}
                    </div>
                </div>
            )}
          </div>

          {/* Resume */}
          <div>
            <Label className="text-gray-500 mb-2 block">个人简历 / 竞赛经历</Label>
            {isEditing ? (
                <Textarea 
                    className="min-h-[150px]" 
                    value={editForm.resume} 
                    onChange={e => setEditForm({...editForm, resume: e.target.value})} 
                />
            ) : (
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm leading-relaxed border">
                    {registration.resume}
                </div>
            )}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <Label className="text-gray-500 mb-2 block">附件 ({attachments.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {attachments.map((file) => (
                  <a 
                    key={file.id} 
                    href={file.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block border rounded-md overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative group">
                        <img 
                            src={file.file_url} 
                            alt={file.file_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
                            }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <FileText className="text-white opacity-0 group-hover:opacity-100" />
                        </div>
                    </div>
                    <div className="p-2 text-xs truncate bg-white" title={file.file_name}>
                      {file.file_name}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Review Action */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-lg">操作</h3>
            
            {isDeleted ? (
                <div className="flex gap-4">
                    <Button onClick={handleRestore} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                        恢复
                    </Button>
                    <Button onClick={handlePermanentDelete} disabled={isProcessing} variant="destructive">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                        永久删除
                    </Button>
                </div>
            ) : (
                <>
                    {isEmailSent ? (
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            <div>
                                邮件已发送，审核状态已锁定。如需修改结果，请先点击上方的“重置状态”按钮。
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                            <Label htmlFor="reviewNote">审核备注 (可选)</Label>
                            <Textarea
                                id="reviewNote"
                                placeholder="填写拒绝理由或通过备注..."
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                            />
                            </div>
                            <div className="flex flex-wrap gap-4 justify-between">
                                <div className="flex gap-4">
                                    <Button 
                                        onClick={() => handleReview('approved')} 
                                        disabled={isProcessing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        通过审核
                                    </Button>
                                    <Button 
                                        onClick={() => handleReview('rejected')} 
                                        disabled={isProcessing}
                                        variant="destructive"
                                    >
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                                        拒绝报名
                                    </Button>
                                </div>
                                <Button onClick={handleDelete} disabled={isProcessing} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    移入垃圾箱
                                </Button>
                            </div>
                        </>
                    )}
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
