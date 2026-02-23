import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export function ProtectedRoute() {
  const { user, isAdmin, loading } = useAuthStore();

  if (loading) {
    return <div className="flex justify-center p-8">加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    // If logged in but not admin, redirect to home or show unauthorized
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <h1 className="text-2xl font-bold text-red-600">无权访问</h1>
            <p className="text-gray-600">该页面仅限管理员访问。</p>
            <a href="/" className="text-blue-600 hover:underline">返回首页</a>
        </div>
    );
  }

  return <Outlet />;
}
