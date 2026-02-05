import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth0 } from '@auth0/auth0-react';
import { LogOut } from 'lucide-react';

export const TopNavBar = () => {
  const { user, logout } = useAuth0();

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin + '/login',
      },
    });
  };

  const getInitials = () => {
    if (!user?.name) return '?';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 w-full backdrop-blur-glass border-b-2 z-50"
      style={{
        background: 'rgba(255, 249, 245, 0.8)',
        borderColor: 'rgba(255, 140, 66, 0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo/Title */}
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="gradient-text text-lg sm:text-xl lg:text-2xl font-bold">
              Goal Tracker
            </span>
          </div>

          {/* Right Side - User Section */}
          <div className="flex items-center">
            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 hover:bg-white/50 rounded-full transition-all outline-none">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white">
                  <AvatarImage
                    src={user?.picture}
                    alt={user?.name || 'User'}
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <span
                  className="hidden md:inline font-semibold text-sm"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  {user?.name || 'User'}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64 mr-2 sm:mr-0">
                <DropdownMenuLabel className="px-3 sm:px-4 py-2 sm:py-3">
                  <p
                    className="font-semibold text-sm sm:text-base"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    {user?.name || 'User'}
                  </p>
                  <p
                    className="text-xs sm:text-sm mt-1 font-normal truncate"
                    style={{ color: 'var(--warm-gray)' }}
                  >
                    {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-2 sm:py-3 cursor-pointer"
                >
                  <LogOut
                    size={16}
                    className="sm:w-[18px] sm:h-[18px]"
                    style={{ color: 'var(--energizing-orange)' }}
                  />
                  <span className="font-medium text-sm sm:text-base">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
