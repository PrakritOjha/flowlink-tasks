import { useState } from 'react';
import { Link2, Search, LogOut, Mail, User, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useBoardOptional } from '@/hooks/useBoard';
import { usePendingInvites } from '@/hooks/usePendingInvites';
import { NotificationsDropdown } from './NotificationsDropdown';
import { PendingInvitesModal } from './PendingInvitesModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const boardCtx = useBoardOptional();
  const currentBoard = boardCtx?.currentBoard ?? null;
  const { invites } = usePendingInvites();
  const [invitesModalOpen, setInvitesModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const boardBase = currentBoard ? `/board/${currentBoard.id}` : '/';

  const navItems = [
    { label: 'Board', href: boardBase },
    { label: 'Dependencies', href: `${boardBase}/dependencies` },
    { label: 'Team', href: `${boardBase}/team` },
  ];

  const isActive = (href: string) => {
    if (href === boardBase) {
      return location.pathname === boardBase || location.pathname === '/';
    }
    return location.pathname === href;
  };

  const userInitials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to={boardBase} className="flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-primary text-white">
                <Link2 className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight hidden sm:inline">TaskLink</span>
            </Link>

            <div className="hidden md:flex items-center ml-8 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive(item.href)
                      ? 'text-primary bg-primary/8'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={boardCtx?.searchQuery ?? ''}
                onChange={(e) => boardCtx?.setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-44"
              />
            </div>

            {invites.length > 0 && (
              <button
                onClick={() => setInvitesModalOpen(true)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {invites.length}
                </span>
              </button>
            )}

            <NotificationsDropdown />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold hover:ring-2 hover:ring-primary/30 transition-all">
                  {userInitials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.user_metadata?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile search */}
            <div className="lg:hidden flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-muted border border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={boardCtx?.searchQuery ?? ''}
                onChange={(e) => boardCtx?.setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
              />
            </div>
          </div>
        )}
      </header>

      <PendingInvitesModal
        open={invitesModalOpen}
        onOpenChange={setInvitesModalOpen}
      />
    </>
  );
};
