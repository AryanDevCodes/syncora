import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const Navbar = () => {
  const { user, logout } = useAuth();
  
  return (
    <header className="sticky top-0 w-full flex items-center justify-between gap-4 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      {/* Left: Sidebar trigger */}
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="hidden md:flex items-center gap-2 max-w-sm flex-1">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 pr-4 h-9 bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        </Button>

        {/* User Profile */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-card hover:bg-accent/10 transition-colors cursor-pointer group">
          <Avatar className="w-8 h-8 border-2 border-primary/30 group-hover:border-primary transition-all">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-gradient-primary text-white text-xs">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.name || 'Guest User'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'guest@syncora.com'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:rotate-12 transition-all"
          >
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </header>
  );
};
