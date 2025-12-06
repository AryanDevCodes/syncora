import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const Navbar = () => {
  return (
    <header className="flex-1 flex items-center justify-between gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Search anything..."
            className="w-full h-10 pl-10 pr-4 rounded-lg glass-card border border-border/50 focus:border-primary focus:shadow-glow transition-all outline-none text-sm hover:border-primary/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative hover-scale h-10 w-10 rounded-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full animate-pulse shadow-glow" />
        </Button>
      </div>
    </header>
  );
};
