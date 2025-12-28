import { Link2, Bell, Settings, Search, Plus } from 'lucide-react';

export const Header = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <div className="p-2 rounded-lg bg-primary/20">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">TaskLink</span>
        </div>
        
        <div className="hidden md:flex items-center ml-8 gap-1">
          <button className="px-4 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors">
            Boards
          </button>
          <button className="px-4 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors">
            Timeline
          </button>
          <button className="px-4 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors">
            Dependencies
          </button>
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
        
        <button className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
          <Bell className="w-5 h-5 text-foreground/70" />
        </button>
        
        <button className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
          <Settings className="w-5 h-5 text-foreground/70" />
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Board</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-foreground">
          JD
        </div>
      </div>
    </header>
  );
};
