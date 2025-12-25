import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Video, 
  PenTool, 
  StickyNote, 
  ListTodo, 
  LayoutDashboard,
  Settings,
  Users,
  Mail,
  CreditCard,
  ChevronUp
} from 'lucide-react';
import { 
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/dashboard',
    description: 'Overview and analytics'
  },
  { 
    icon: MessageSquare, 
    label: 'Chat', 
    path: '/chat',
    description: 'Team conversations'
  },
  { 
    icon: Mail, 
    label: 'Email', 
    path: '/email',
    description: 'Email management'
  },
  { 
    icon: Video, 
    label: 'Video', 
    path: '/video',
    description: 'Video calls & meetings'
  },
  { 
    icon: PenTool, 
    label: 'Collaborate', 
    path: '/collaborate',
    description: 'Shared workspaces'
  },
  { 
    icon: Users, 
    label: 'Contacts', 
    path: '/contacts',
    description: 'Manage contacts'
  },
  { 
    icon: StickyNote, 
    label: 'Notes', 
    path: '/notes',
    description: 'Personal notes'
  },
  { 
    icon: ListTodo, 
    label: 'Tasks', 
    path: '/tasks',
    description: 'Task management'
  },
];

const settingsItems = [
  { 
    icon: CreditCard, 
    label: 'Subscription', 
    path: '/subscription',
    description: 'Plan & billing'
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    path: '/settings',
    description: 'App preferences'
  },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { state } = useSidebar();

  return (
    <SidebarPrimitive className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-sidebar-primary-foreground">
            <span className="text-sm font-bold">S</span>
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="text-sm font-semibold text-sidebar-foreground">Syncora</span>
            <span className="text-xs text-sidebar-foreground/60">Collaborate Better</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-sidebar-foreground/70 px-2 py-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.description}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-sidebar-foreground/70 px-2 py-2">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.description}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg border-2 border-sidebar-border">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="rounded-lg bg-gradient-primary text-white">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">
                      {user?.name || 'Guest User'}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user?.email || 'guest@syncora.com'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <span className="mr-2 h-4 w-4">→</span>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
};
