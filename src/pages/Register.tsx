import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, X, LogIn, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Registration, Attachment } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  major: z.string().min(2, '专业至少2个字符'),
  college: z.string().min(2, '学院至少2个字符'),
  enrollment_year: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 2000, {
    message: '请输入有效的入学年份',
  }),
  // email: z.string().email('请输入有效的邮箱地址'), // Email is now handled by Auth
  qq: z.string().min(5, '请输入有效的QQ号'),
  resume: z.string().min(10, '简历内容至少10个字符，请详细描述您的经历'),
});

type FormValues = z.infer<typeof formSchema>;

export function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const { user, loading: authLoading } = useAuthStore();
  
  // Login/Signup state
  const [email, setEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authSent, setAuthSent] = useState(false);

  // Existing registration data
  const [registrationData, setRegistrationData] = useState<Registration | null>(null);
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // Pre-fill email if user is logged in (though we don't display it in form anymore, we might need it)
  useEffect(() => {
      // Check if user has already registered
      const checkRegistration = async () => {
          if (!user) return;
          
          const { data } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (data) {
              setSubmitted(true);
              setRegistrationData(data as Registration);

              const { data: att } = await supabase
                .from('attachments')
                .select('*')
                .eq('registration_id', data.id);
              setUploadedAttachments(att || []);
          }
      }
      checkRegistration();
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/register',
        },
      });
      if (error) throw error;
      setAuthSent(true);
      toast.success('验证邮件已发送，请查收邮箱并点击链接登录');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || '发送验证邮件失败');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== newFiles.length) {
        toast.error('仅支持上传图片文件');
      }
      
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
        toast.error('请先登录');
        return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create registration record
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id, // Link to authenticated user
          name: data.name,
          major: data.major,
          college: data.college,
          enrollment_year: parseInt(data.enrollment_year),
          email: user.email!, // Use authenticated email
          qq: data.qq,
          resume: data.resume,
          status: 'pending',
        })
        .select()
        .single();

      if (regError) throw regError;

      // 2. Upload files if any
      if (files.length > 0 && registration) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${registration.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('registration-attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('registration-attachments')
            .getPublicUrl(filePath);

          return supabase.from('attachments').insert({
            registration_id: registration.id,
            file_name: file.name,
            file_path: filePath,
            file_url: publicUrl,
          });
        });

        await Promise.all(uploadPromises);
      }

      setSubmitted(true);
      toast.success('报名提交成功！');
      // Reload page or re-fetch to get the full view
      window.location.reload(); 
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
      return <div className="text-center py-12">加载中...</div>;
  }

  // Auth Flow
  if (!user) {
    return (
        <div className="max-w-md mx-auto mt-8">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle>登录/注册以报名</CardTitle>
                    <CardDescription>
                        为了确保信息准确并方便后续通知，请先验证您的邮箱。
                        <br/>
                        我们将向您的邮箱发送一个登录链接。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {authSent ? (
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 text-green-700 p-4 rounded-md">
                                验证邮件已发送至 <strong>{email}</strong>
                            </div>
                            <p className="text-sm text-gray-500">
                                请查收邮件并点击其中的链接完成登录。
                                <br/>
                                (如果没有收到，请检查垃圾邮件箱)
                            </p>
                            <Button variant="outline" onClick={() => setAuthSent(false)}>
                                更换邮箱 / 重试
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleAuth} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="auth-email">邮箱地址</Label>
                                <Input 
                                    id="auth-email" 
                                    type="email" 
                                    placeholder="your@email.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isAuthLoading}>
                                {isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                发送登录链接
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
  }

  if (submitted && registrationData) {
    return (
      <Card className="max-w-3xl mx-auto mt-8">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-4 border-b pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">您已成功报名！</h2>
            <p className="text-gray-600">
              您的报名信息已收到，我们将尽快进行审核。
            </p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                registrationData.status === 'approved' ? 'bg-green-100 text-green-800' :
                registrationData.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
            }`}>
                当前状态：
                {registrationData.status === 'approved' ? '已通过' :
                 registrationData.status === 'rejected' ? '已拒绝' : '待审核'}
            </div>
            {registrationData.review_note && (
                <div className="mt-4 p-4 bg-gray-50 rounded text-left">
                    <span className="font-semibold text-gray-700">审核备注：</span>
                    <p className="mt-1 text-gray-600">{registrationData.review_note}</p>
                </div>
            )}
          </div>

          <div className="space-y-4">
              <h3 className="text-lg font-semibold">提交的详细信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                      <span className="text-gray-500 block">姓名</span>
                      <span className="font-medium">{registrationData.name}</span>
                  </div>
                  <div>
                      <span className="text-gray-500 block">学院</span>
                      <span className="font-medium">{registrationData.college}</span>
                  </div>
                  <div>
                      <span className="text-gray-500 block">专业</span>
                      <span className="font-medium">{registrationData.major}</span>
                  </div>
                  <div>
                      <span className="text-gray-500 block">入学年份</span>
                      <span className="font-medium">{registrationData.enrollment_year}</span>
                  </div>
                  <div>
                      <span className="text-gray-500 block">邮箱</span>
                      <span className="font-medium">{registrationData.email}</span>
                  </div>
                  <div>
                      <span className="text-gray-500 block">QQ</span>
                      <span className="font-medium">{registrationData.qq}</span>
                  </div>
              </div>
              
              <div>
                  <span className="text-gray-500 block mb-2">个人简历 / 竞赛经历</span>
                  <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                      {registrationData.resume}
                  </div>
              </div>

              {uploadedAttachments.length > 0 && (
                  <div>
                      <span className="text-gray-500 block mb-2">已上传附件</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {uploadedAttachments.map(file => (
                              <a 
                                key={file.id}
                                href={file.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="block border rounded p-2 hover:bg-gray-50 transition-colors text-center"
                              >
                                  <div className="aspect-square bg-gray-200 mb-2 flex items-center justify-center rounded overflow-hidden">
                                     <img src={file.file_url} alt={file.file_name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="text-xs truncate">{file.file_name}</div>
                              </a>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          <div className="flex justify-center gap-4 pt-4 border-t">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                返回首页
              </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                <CardTitle>云南大学 ICPC 校赛报名</CardTitle>
                <CardDescription>请准确填写以下信息，带 * 为必填项</CardDescription>
              </div>
              <div className="text-sm text-gray-500 text-right">
                  当前账号<br/>
                  <span className="font-medium text-gray-900">{user.email}</span>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input id="name" {...register('name')} placeholder="请输入姓名" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="enrollment_year">入学年份 *</Label>
                <Input id="enrollment_year" type="number" {...register('enrollment_year')} placeholder="例如：2023" />
                {errors.enrollment_year && <p className="text-sm text-red-500">{errors.enrollment_year.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="college">学院 *</Label>
                <Input id="college" {...register('college')} placeholder="请输入所在学院" />
                {errors.college && <p className="text-sm text-red-500">{errors.college.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">专业 *</Label>
                <Input id="major" {...register('major')} placeholder="请输入专业班级" />
                {errors.major && <p className="text-sm text-red-500">{errors.major.message}</p>}
              </div>

              {/* Email is automatically handled */}
              
              <div className="space-y-2">
                <Label htmlFor="qq">QQ号 *</Label>
                <Input id="qq" {...register('qq')} placeholder="方便联系" />
                {errors.qq && <p className="text-sm text-red-500">{errors.qq.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">个人简历 / 竞赛经历 *</Label>
              <Textarea 
                id="resume" 
                {...register('resume')} 
                placeholder="请简要介绍您的算法竞赛经历、获奖情况、CSP/CCPC/ICPC 参赛经验等..."
                className="h-32"
              />
              {errors.resume && <p className="text-sm text-red-500">{errors.resume.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>附件上传 (仅支持图片)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Upload className="h-8 w-8 mb-2" />
                  <p className="text-sm">点击或拖拽上传图片</p>
                  <p className="text-xs mt-1">支持多图上传</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group border rounded-md overflow-hidden aspect-square">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`preview-${index}`} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交报名'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
