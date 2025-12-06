import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Video, 
  PenTool, 
  StickyNote, 
  ListTodo, 
  LayoutDashboard,
  Settings,
  LogOut,
  Users,
  Mail,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { StorageQuotaIndicator } from '@/components/subscription/StorageQuotaIndicator';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Mail, label: 'Email', path: '/email' },
  { icon: Video, label: 'Video', path: '/video' },
  { icon: PenTool, label: 'Collaborate', path: '/collaborate' },
  { icon: Users, label: 'Contacts', path: '/contacts' },
  { icon: StickyNote, label: 'Notes', path: '/notes' },
  { icon: ListTodo, label: 'Tasks', path: '/tasks' },
  { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { state } = useSidebar();

  return (
    <SidebarPrimitive className="border-r bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60">
      <SidebarHeader>
        <div className="px-2 py-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent hover-scale cursor-pointer">
            Syncora
          </h1>
          <p className="text-xs text-sidebar-foreground/60">Collaborate Better</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2 space-y-2">
          <StorageQuotaIndicator />
          <div className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent/30 backdrop-blur-sm border border-sidebar-border/30 hover:border-sidebar-border/60 transition-all cursor-pointer group">
            <Avatar className="w-8 h-8 border-2 border-primary/30 group-hover:border-primary transition-all">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-gradient-primary text-white text-xs">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-medium truncate">{user?.name || 'Guest User'}</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">{user?.email || 'guest@syncora.com'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-6 w-6 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:rotate-12 transition-all group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
            >
              <LogOut className="w-3 h-3 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
};
