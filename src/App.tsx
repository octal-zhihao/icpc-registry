import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Eager load critical routes for better initial experience
import { Home } from '@/pages/Home';
import { Register } from '@/pages/Register';

// Lazy load admin routes (heavy components, not needed for most users)
const AdminLogin = lazy(() => import('@/pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const EmailTemplates = lazy(() => import('@/pages/EmailTemplates').then(m => ({ default: m.EmailTemplates })));
const StorageDiagnostic = lazy(() => import('@/pages/StorageDiagnostic').then(m => ({ default: m.StorageDiagnostic })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-gray-600">加载中...</div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="register" element={<Register />} />
          <Route path="admin/login" element={<AdminLogin />} />

          <Route element={<ProtectedRoute />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/email-templates" element={<EmailTemplates />} />
            <Route path="admin/storage-diagnostic" element={<StorageDiagnostic />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
