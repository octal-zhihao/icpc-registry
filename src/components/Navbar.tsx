import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Trophy, LogOut, UserCog } from 'lucide-react';

export function Navbar() {
  const { user, isAdmin, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Trophy className="h-6 w-6" />
            <span>云南大学 ICPC</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium hover:text-blue-600 transition-colors">
            首页
          </Link>
          <Link to="/register" className="text-sm font-medium hover:text-blue-600 transition-colors">
            {user ? '我的报名' : '立即报名'}
          </Link>

          {user ? (
            <div className="flex items-center gap-2 ml-4 border-l pl-4">
              {isAdmin && (
                <Link to="/admin/dashboard">
                    <Button variant="ghost" size="sm">
                    <UserCog className="mr-2 h-4 w-4" />
                    管理后台
                    </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                退出
              </Button>
            </div>
          ) : (
            <Link to="/admin/login" className="ml-4 border-l pl-4">
              <Button variant="ghost" size="sm">
                管理员登录
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
