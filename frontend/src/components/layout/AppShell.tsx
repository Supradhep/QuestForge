import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Plus, LogOut } from 'lucide-react';

interface AppShellProps {
  user: { id: number; username: string } | null;
  setUser: (user: { id: number; username: string } | null) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ user, setUser, children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-[#EDEDEF] flex flex-col">
      {/* Minimalist Top Bar */}
      <header className="sticky top-0 z-30 h-16 bg-[#0B0B0E]/85 backdrop-blur-md border-b border-white/[0.06]">
        <div className="w-full max-w-[1680px] mx-auto h-full px-6 sm:px-10 lg:px-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Compass className="w-4 h-4 text-[#E5A93C] transition-transform duration-500 group-hover:rotate-45" />
            <span className="font-serif-display text-2xl tracking-wide text-white">
              QuestForge
            </span>
          </Link>

          <div className="flex items-center gap-5 text-xs">
            {location.pathname !== '/create' && location.pathname !== '/' && (
              <button
                onClick={() => navigate('/create')}
                className="inline-flex items-center gap-1.5 text-[#8E8E99] hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span>New Expedition</span>
              </button>
            )}

            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-white/[0.08]">
                <span className="text-[#8E8E99]">
                  <strong className="text-[#EDEDEF] font-medium">{user.username}</strong>
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem('questforge_user');
                    setUser(null);
                    navigate('/');
                  }}
                  title="Switch player"
                  className="text-[#8E8E99] hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};
