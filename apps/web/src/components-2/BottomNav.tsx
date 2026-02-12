import { Calendar, CheckSquare, Home, Target } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BottomNavProps {
  onAddClick: () => void;
}

export const BottomNav = ({ onAddClick }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 backdrop-blur-md z-40 border-t"
        style={{
          background: 'rgba(255, 249, 245, 0.95)',
          borderColor: 'rgba(255, 140, 66, 0.1)',
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-4 relative">
          {/* Floating Action Button - Popping out from center */}
          <button
            onClick={onAddClick}
            className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 active:scale-95"
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: '0 4px 20px rgba(255, 140, 66, 0.4)',
            }}
            aria-label="Add new task"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          <div className="flex items-center justify-around h-full">
            {/* Home */}
            <button
              className="flex flex-col items-center gap-1 px-4 py-2 transition-colors hover:opacity-80"
              onClick={() => navigate('/')}
            >
              <Home
                size={24}
                style={{ color: isActive('/') ? 'var(--energizing-orange)' : 'var(--warm-gray)' }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: isActive('/') ? 'var(--deep-charcoal)' : 'var(--warm-gray)' }}
              >
                Home
              </span>
            </button>

            {/* Planner */}
            <button
              className="flex flex-col items-center gap-1 px-4 py-2 transition-colors hover:opacity-80"
              onClick={() => navigate('/planner')}
            >
              <Calendar
                size={24}
                style={{
                  color: isActive('/planner') ? 'var(--energizing-orange)' : 'var(--warm-gray)',
                }}
              />
              <span
                className="text-xs font-medium"
                style={{
                  color: isActive('/planner') ? 'var(--deep-charcoal)' : 'var(--warm-gray)',
                }}
              >
                Planner
              </span>
            </button>

            {/* Spacer for FAB */}
            <div className="w-14"></div>

            {/* Tasks */}
            <button
              className="flex flex-col items-center gap-1 px-4 py-2 transition-colors hover:opacity-80"
              onClick={() => navigate('/tasks')}
            >
              <CheckSquare
                size={24}
                style={{
                  color: isActive('/tasks') ? 'var(--energizing-orange)' : 'var(--warm-gray)',
                }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: isActive('/tasks') ? 'var(--deep-charcoal)' : 'var(--warm-gray)' }}
              >
                Tasks
              </span>
            </button>

            {/* Goals */}
            <button
              className="flex flex-col items-center gap-1 px-4 py-2 transition-colors hover:opacity-80"
              onClick={() => navigate('/goals')}
            >
              <Target
                size={24}
                style={{
                  color: isActive('/goals') ? 'var(--energizing-orange)' : 'var(--warm-gray)',
                }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: isActive('/goals') ? 'var(--deep-charcoal)' : 'var(--warm-gray)' }}
              >
                Goals
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom padding spacer for page content */}
      <div className="h-16"></div>
    </>
  );
};
