import { useState } from 'react';
import { Link2, Settings, Search, Plus, LogOut, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
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

interface HeaderProps {
  onNewBoard?: () => void;
}

export const Header = ({ onNewBoard }: HeaderProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { invites } = usePendingInvites();
  const [invitesModalOpen, setInvitesModalOpen] = useState(false);
  
  const navItems = [
    { label: 'Boards', href: '/' },
    { label: 'Dependencies', href: '/dependencies' },
  ];

  const userInitials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-primary/20">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">TaskLink</span>
          </Link>
          
          <div className="hidden md:flex items-center ml-8 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'px-4 py-2 text-sm rounded-lg transition-colors',
                  location.pathname === item.href
                    ? 'text-foreground bg-foreground/10'
                    : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 border border-border/30">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-48"
            />
          </div>

          {/* Pending Invites Button */}
          {invites.length > 0 && (
            <button 
              onClick={() => setInvitesModalOpen(true)}
              className="relative p-2 rounded-lg hover:bg-foreground/5 transition-colors"
            >
              <Mail className="w-5 h-5 text-foreground/70" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {invites.length}
              </span>
            </button>
          )}
          
          <NotificationsDropdown />
          
          <button className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
            <Settings className="w-5 h-5 text-foreground/70" />
          </button>

          {onNewBoard && (
            <button 
              onClick={onNewBoard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Board</span>
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-foreground hover:ring-2 hover:ring-primary/50 transition-all">
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
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <PendingInvitesModal
        open={invitesModalOpen}
        onOpenChange={setInvitesModalOpen}
      />
    </>
  );
};
