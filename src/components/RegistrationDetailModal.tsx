import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Registration, Attachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, X, Check, FileText, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('registrations')
        .update({
          status,
          review_note: reviewNote,
          reviewed_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', registration.id);

      if (error) throw error;

      toast.success(status === 'approved' ? '已审核通过' : '已拒绝报名');
      
      // Close first to prevent UI lock-up, then update list in background
      onClose();
      onUpdate();
    } catch (error: any) {
      console.error('Review error:', error);
      toast.error('审核操作失败: ' + error.message);
    } finally {
      // If we didn't close (error case), stop loading
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要将此报名移入垃圾箱吗？')) return;
    setIsProcessing(true);
    try {
        const { error } = await supabase
            .from('registrations')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', registration.id);
        
        if (error) throw error;
        toast.success('已移入垃圾箱');
        onClose();
        onUpdate();
    } catch (error: any) {
        toast.error('操作失败: ' + error.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
        const { error } = await supabase
            .from('registrations')
            .update({ deleted_at: null })
            .eq('id', registration.id);
        
        if (error) throw error;
        toast.success('已恢复');
        onClose();
        onUpdate();
    } catch (error: any) {
        toast.error('操作失败: ' + error.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
      if (!confirm('警告：此操作不可恢复！确定要永久删除该记录吗？')) return;
      setIsProcessing(true);
      try {
          const { error } = await supabase
              .from('registrations')
              .delete()
              .eq('id', registration.id);
          
          if (error) throw error;
          toast.success('已永久删除');
          onClose();
          onUpdate();
      } catch (error: any) {
          toast.error('删除失败: ' + error.message);
      } finally {
          setIsProcessing(false);
      }
  }

  const isDeleted = !!registration.deleted_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">报名详情 {isDeleted && <span className="text-red-500 text-sm ml-2">(已删除)</span>}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isProcessing}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-500">姓名</Label>
              <div className="font-medium text-lg">{registration.name}</div>
            </div>
            <div>
              <Label className="text-gray-500">状态</Label>
              <div className={`font-medium inline-block px-2 py-1 rounded text-sm ${
                registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {registration.status === 'approved' ? '已通过' :
                 registration.status === 'rejected' ? '已拒绝' : '待审核'}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">学院</Label>
              <div className="font-medium">{registration.college}</div>
            </div>
            <div>
              <Label className="text-gray-500">专业</Label>
              <div className="font-medium">{registration.major}</div>
            </div>
            <div>
              <Label className="text-gray-500">入学年份</Label>
              <div className="font-medium">{registration.enrollment_year}</div>
            </div>
            <div>
              <Label className="text-gray-500">邮箱</Label>
              <div className="font-medium">{registration.email}</div>
            </div>
            <div>
              <Label className="text-gray-500">QQ</Label>
              <div className="font-medium">{registration.qq}</div>
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
                    <div className="font-medium">
                        {registration.email_sent_status === 'sent' ? (
                            <span className="text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> 已发送 ({new Date(registration.email_sent_at!).toLocaleString()})</span>
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
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm leading-relaxed border">
              {registration.resume}
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
