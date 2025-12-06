import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/api/userApi';
import { chatApi } from '@/api/chatApi';
import { contactApi } from '@/api/contactApi';
import { notesApi } from '@/api/notesApi';
import { taskApi } from '@/api/taskApi';
import { MessageSquare, Video, PenTool, StickyNote, ListTodo, Zap, Sparkles, Users, Clock, PlusCircle, UserPlus, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import AnalyticsChart from '@/components/ui/AnalyticsChart';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';

type StatItem = {
  icon: any;
  label: string;
  value: number; 
  valueText: string; 
  change: string;
  color: string; 
  path: string;
};

const StatCard = ({ stat }: { stat: StatItem }) => (
  <Link to={stat.path} className="group">
    <Card className="glass-card hover-lift hover-glow cursor-pointer border-border/60 overflow-hidden animate-slide-up">
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-medium group-hover:scale-110 transition-transform`}>
          <stat.icon className="w-4 h-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold">{stat.valueText}</div>
          <div className="flex items-center text-sm text-accent font-medium">
            {stat.change}
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const StatCardSkeleton = () => (
  <div className="glass-card p-4 animate-pulse">
    <div className="w-12 h-12 rounded-lg bg-muted/30 mb-3" />
    <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
    <div className="h-3 bg-muted/20 rounded w-1/2" />
  </div>
);

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([
    { icon: MessageSquare, label: "Messages", value: 0, valueText: "-", change: "Get started", color: "from-blue-500 to-cyan-500", path: "/chat" },
    { icon: Video, label: "Video Calls", value: 0, valueText: "-", change: "Start a call", color: "from-purple-500 to-pink-500", path: "/video" },
    { icon: StickyNote, label: "Notes", value: 0, valueText: "-", change: "Create first", color: "from-green-500 to-emerald-500", path: "/notes" },
    { icon: ListTodo, label: "Tasks", value: 0, valueText: "-", change: "Add tasks", color: "from-orange-500 to-red-500", path: "/tasks" },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [teamStatus, setTeamStatus] = useState([]);
  const [chatSummary, setChatSummary] = useState<{ total: number; contacts: number; nonContacts: number; groups: number; contactPeers: string[]; nonContactPeers: string[] }>({ total: 0, contacts: 0, nonContacts: 0, groups: 0, contactPeers: [], nonContactPeers: [] });
  const [manageTab, setManageTab] = useState<'contacts' | 'notes' | 'tasks'>('contacts');
  const [manageNotes, setManageNotes] = useState<any[]>([]);
  const [manageTasks, setManageTasks] = useState<any[]>([]);
  const [onboardingTips] = useState([
    { label: 'Start a chat', path: '/chat', icon: MessageSquare },
    { label: 'Create your first note', path: '/notes', icon: StickyNote },
    { label: 'Add a task', path: '/tasks', icon: ListTodo },
    { label: 'Invite your team', path: '/contacts', icon: Users },
  ]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [rooms, contacts, notesCount, tasksCount] = await Promise.all([
        chatApi.getAllRooms(),
        contactApi.getAllContacts(),
        notesApi.getNotesCount().catch(() => 0),
        taskApi.getTasksCount().catch(() => 0),
      ]);
      const roomsCount = Array.isArray(rooms) ? rooms.length : 0;
      const callsCount = 0;
      // Compute chat breakdown
      const contactsSet = new Set((contacts || []).map((c: any) => (c.email || '').toLowerCase()));
      const groups = (rooms || []).filter((r: any) => r.isGroup);
      const directs = (rooms || []).filter((r: any) => !r.isGroup);
      const contactPeers: string[] = [];
      const nonContactPeers: string[] = [];
      let contactDirects = 0;
      let nonContactDirects = 0;
      const selfEmail = (user?.email || '').toLowerCase();
      for (const r of directs) {
        const peers = (r.memberEmails || []).map((e: string) => (e || '').toLowerCase()).filter((e: string) => e && e !== selfEmail);
        const isContactRoom = peers.some((e: string) => contactsSet.has(e));
        if (isContactRoom) {
          contactDirects += 1;
          if (contactPeers.length < 5) contactPeers.push(peers[0] || '');
        } else {
          nonContactDirects += 1;
          if (nonContactPeers.length < 5) nonContactPeers.push(peers[0] || '');
        }
      }
      setChatSummary({
        total: roomsCount,
        contacts: contactDirects,
        nonContacts: nonContactDirects,
        groups: groups.length,
        contactPeers: contactPeers.filter(Boolean),
        nonContactPeers: nonContactPeers.filter(Boolean),
      });

      // Robust notes count: fallback to list length if count missing
      let notesCountResolved = Number(notesCount) || 0;
      if (!notesCountResolved) {
        try {
          const allNotes = await notesApi.getAllNotes();
          notesCountResolved = Array.isArray(allNotes) ? allNotes.length : 0;
        } catch {}
      }
      setStats([
        { icon: MessageSquare, label: "Messages", value: roomsCount, valueText: String(roomsCount), change: roomsCount ? `+${roomsCount}` : 'Get started', color: "from-blue-500 to-cyan-500", path: "/chat" },
        { icon: Video, label: "Video Calls", value: callsCount, valueText: callsCount ? String(callsCount) : '-', change: callsCount ? `+${callsCount}` : 'Start a call', color: "from-purple-500 to-pink-500", path: "/video" },
        { icon: StickyNote, label: "Notes", value: notesCountResolved, valueText: String(notesCountResolved), change: notesCountResolved ? `+${notesCountResolved}` : 'Create first', color: "from-green-500 to-emerald-500", path: "/notes" },
        { icon: ListTodo, label: "Tasks", value: Number(tasksCount) || 0, valueText: String(Number(tasksCount) || 0), change: tasksCount ? `+${tasksCount}` : 'Add tasks', color: "from-orange-500 to-red-500", path: "/tasks" },
      ]);
      setTeamStatus(contacts);
    } catch (err) {
      // fallback to default
    }
    setLoading(false);
  }, [user?.email]);

  const fetchActivity = useCallback(async () => {
    try {
      const [notes, tasks, rooms, contacts] = await Promise.all([
        notesApi.getAllNotes().catch(() => []),
        taskApi.getAllTasks().catch(() => []),
        chatApi.getAllRooms().catch(() => []),
        contactApi.getAllContacts().catch(() => []),
      ]);

      const noteActivities = (notes || []).map((n: any) => {
        const ts = Date.parse(n.updatedAt || n.createdAt || '');
        return {
          type: 'note',
          user: n.ownerName || 'You',
          action: (n.updatedAt && n.updatedAt !== n.createdAt) ? 'updated a note' : 'created a note',
          target: n.title || 'Untitled',
          timeTs: isNaN(ts) ? 0 : ts,
          timeText: new Date(ts || Date.now()).toLocaleString(),
          color: 'from-green-500 to-emerald-500',
          avatar: undefined,
        };
      });
      const taskActivities = (tasks || []).map((t: any) => {
        const ts = Date.parse(t.updatedAt || t.createdAt || '');
        return {
          type: 'task',
          user: t.ownerName || 'You',
          action: `task ${t.status ?? 'TODO'}`,
          target: t.title || 'Untitled',
          timeTs: isNaN(ts) ? 0 : ts,
          timeText: new Date(ts || Date.now()).toLocaleString(),
          color: 'from-orange-500 to-red-500',
          avatar: undefined,
        };
      });
      const contactActivities = (contacts || []).map((c: any) => {
        const ts = Date.parse(c.updatedAt || c.createdAt || '');
        return {
          type: 'contact',
          user: c.name || c.email || 'Contact',
          action: (c.updatedAt && c.updatedAt !== c.createdAt) ? 'contact updated' : 'contact added',
          target: c.email || '',
          timeTs: isNaN(ts) ? 0 : ts,
          timeText: new Date(ts || Date.now()).toLocaleString(),
          color: 'from-blue-500 to-cyan-500',
          avatar: c.avatarUrl,
        };
      });
      const chatActivities = (rooms || []).map((r: any) => {
        const ts = Date.parse(r.lastMessageTime || r.createdAt || '');
        return {
          type: 'chat',
          user: r.isGroup ? 'Group' : 'Direct',
          action: r.isGroup ? 'group chat activity' : 'direct chat activity',
          target: r.name || (r.memberEmails || []).join(', '),
          timeTs: isNaN(ts) ? 0 : ts,
          timeText: new Date(ts || Date.now()).toLocaleString(),
          color: 'from-purple-500 to-pink-500',
          avatar: undefined,
        };
      });

      const merged = [...noteActivities, ...taskActivities, ...contactActivities, ...chatActivities]
        .sort((a, b) => b.timeTs - a.timeTs);
      setRecentActivity(merged);
    } catch (e) {
      setRecentActivity([]);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchActivity();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchActivity();
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const interval = window.setInterval(() => {
      fetchActivity();
    }, 30000);

    // Listen to local notes REST change events
    const onNotesChanged = () => {
      fetchActivity();
      fetchStats();
    };
    window.addEventListener('notes:changed', onNotesChanged as EventListener);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
      window.removeEventListener('notes:changed', onNotesChanged as EventListener);
    };
  }, [fetchStats, fetchActivity, user?.email]);

  // Lazy-load lists for Manage Center
  useEffect(() => {
    const load = async () => {
      try {
        if (manageTab === 'notes' && manageNotes.length === 0) {
          const list = await notesApi.getAllNotes();
          setManageNotes(Array.isArray(list) ? list.slice(0, 5) : []);
        } else if (manageTab === 'tasks' && manageTasks.length === 0) {
          const list = await taskApi.getAllTasks();
          setManageTasks(Array.isArray(list) ? list.slice(0, 5) : []);
        }
      } catch {}
    };
    load();
  }, [manageTab]);

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="min-h-full gradient-mesh" aria-label="Dashboard">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border/50">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative p-8 space-y-6 animate-fade-in">
              <div className="flex items-start justify-between flex-wrap">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent" tabIndex={0}>
                    {user ? `Welcome back, ${user.firstName}! 👋` : 'Welcome back! 👋'}
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-2xl" tabIndex={0}>
                    Your collaborative workspace is ready. Connect, create, and accomplish together.
                  </p>
                  {user && (
                    <div className="flex items-center gap-3 mt-2">
                      <Avatar className="w-12 h-12 border-2 border-primary/30">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-lg">{user.name}</span>
                      <Badge className="ml-2" variant="secondary">{user.status}</Badge>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Button className="gradient-primary border-0 shadow-glow hover-lift" aria-label="Quick Start">
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Start
                  </Button>
                  <div className="mt-2">
                    <ul className="list-disc pl-4 text-sm text-muted-foreground" aria-label="Onboarding Tips">
                      {onboardingTips.map(tip => (
                        <li key={tip.label}>
                          <Link to={tip.path} className="hover:underline flex items-center gap-1">
                            <tip.icon className="w-3 h-3" /> {tip.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Stats Grid removed as requested */}
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8 pb-20 space-y-8">
            {/* Analytics Section (compact) */}
            <SubscriptionGuard feature="analytics_reporting" requiredPlan="Professional">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Workspace Analytics</h2>
                <AnalyticsChart
                  title="User Activity Overview"
                  labels={["Messages", "Video Calls", "Notes", "Tasks"]}
                  data={stats.map(s => s.value)}
                  color="rgba(59,130,246,0.7)"
                  compact
                  height={150}
                  type="line"
                />
              </div>
            </SubscriptionGuard>
            
            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Quick Actions above Recent Activity */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <Card className="glass-card border-border/60 hover-lift" aria-label="Quick Actions">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Jump into your workflow</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { to: '/video', icon: Video, label: 'Start Video Call', color: 'from-purple-500 to-pink-500' },
                      { to: '/collab', icon: PenTool, label: 'Open Whiteboard', color: 'from-blue-500 to-cyan-500' },
                      { to: '/notes', icon: StickyNote, label: 'Create Note', color: 'from-green-500 to-emerald-500' },
                      { to: '/tasks', icon: ListTodo, label: 'Add Task', color: 'from-orange-500 to-red-500' },
                    ].map((action, index) => (
                      <Link key={action.label} to={action.to}>
                        <Button 
                          className="w-full justify-start glass-card hover-lift group border-border/60" 
                          variant="outline"
                          style={{ animationDelay: `${index * 50}ms` }}
                          aria-label={action.label}
                        >
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${action.color} mr-3 group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-4 h-4 text-white" />
                          </div>
                          {action.label}
                        </Button>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="glass-card border-border/60 self-start h-auto" aria-label="Recent Activity">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Clock className="w-5 h-5 text-primary" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription className="text-xs">Latest updates across chats, notes, tasks, contacts</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchActivity}>
                          <RotateCcw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl">View All</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recentActivity.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 animate-fade-in">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center animate-float shadow-glow">
                          <Sparkles className="w-12 h-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">No Activity Yet</h3>
                          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Start collaborating with your team to see activity updates here
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <Button variant="outline" size="sm" className="glass-card hover-scale" aria-label="Start Chat">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Start Chat
                          </Button>
                          <Button variant="outline" size="sm" className="glass-card hover-scale" aria-label="Create Task">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Create Task
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto scrollbar-hide pr-2">
                        {recentActivity.map((activity, index) => (
                          <div 
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/60 mb-2 last:mb-0"
                            tabIndex={0}
                          >
                            <Avatar className="w-8 h-8 border border-border/60">
                              <AvatarImage src={activity.avatar} alt={activity.user} />
                              <AvatarFallback className={`bg-gradient-to-br ${activity.color} text-white`}>
                                {activity.user.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs">
                                <span className="font-medium text-foreground">{activity.user}</span>
                                <span className="text-muted-foreground"> {activity.action} </span>
                                <span className="text-primary font-medium truncate inline-block max-w-[180px] align-bottom">{activity.target}</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {activity.timeText}
                              </p>
                            </div>
                            <div className={`p-1.5 rounded-md bg-gradient-to-br ${activity.color} opacity-15`}>
                              {activity.type === 'chat' && <MessageSquare className="w-3.5 h-3.5 text-primary" />}
                              {activity.type === 'video' && <Video className="w-3.5 h-3.5 text-primary" />}
                              {activity.type === 'task' && <ListTodo className="w-3.5 h-3.5 text-primary" />}
                              {activity.type === 'collab' && <PenTool className="w-3.5 h-3.5 text-primary" />}
                              {activity.type === 'contact' && <Users className="w-3.5 h-3.5 text-primary" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              

              

                  {/* Sidebar (Chat Summary + Team Status) */}
                <div className="space-y-6">
                  {/* Chat Summary */}
                  <Card className="glass-card border-border/60 hover-lift" aria-label="Chat Summary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Chat Summary
                      </CardTitle>
                      <CardDescription>Breakdown of your chat rooms</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="text-lg font-semibold">{chatSummary.total}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="text-xs text-muted-foreground">Groups</div>
                          <div className="text-lg font-semibold">{chatSummary.groups}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="text-xs text-muted-foreground">Contact-based</div>
                          <div className="text-lg font-semibold">{chatSummary.contacts}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="text-xs text-muted-foreground">Non-contacts</div>
                          <div className="text-lg font-semibold">{chatSummary.nonContacts}</div>
                        </div>
                      </div>
                      {(chatSummary.contactPeers.length > 0 || chatSummary.nonContactPeers.length > 0) && (
                        <div className="space-y-2">
                          {chatSummary.contactPeers.length > 0 && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Examples (contacts)</div>
                              <div className="flex flex-wrap gap-2">
                                {chatSummary.contactPeers.map((e) => (
                                  <Badge key={`c-${e}`} variant="secondary">{e}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {chatSummary.nonContactPeers.length > 0 && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Examples (non-contacts)</div>
                              <div className="flex flex-wrap gap-2">
                                {chatSummary.nonContactPeers.map((e) => (
                                  <Badge key={`n-${e}`} variant="outline">{e}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {/* Team Status (moved to sidebar) */}
                  <Card className="glass-card border-border/60 hover-lift" aria-label="Team Status">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Team Status
                      </CardTitle>
                      <CardDescription>Who's online now</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {teamStatus.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-fade-in">
                          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center animate-pulse-slow">
                            <Users className="w-10 h-10 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">No team members yet</p>
                            <p className="text-muted-foreground text-sm">Invite others to start collaborating</p>
                          </div>
                          <Button size="sm" variant="outline" className="glass-card hover-scale" aria-label="Invite Team">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Team
                          </Button>
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto scrollbar-hide pr-2">
                          <ul className="space-y-3" aria-label="Team Members">
                            {teamStatus.map((member, idx) => (
                              <li key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="relative">
                                  <Avatar className="w-10 h-10 border-2 border-primary/30">
                                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                                    <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{member.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{member.role || 'Team Member'}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">Online</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  </div>

                  
            </div>

            {/* Manage Center (separate div) */}
            <div className="mt-6 mb-10">
              <Card className="glass-card border-border/60 hover-lift" aria-label="Manage Center">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Manage Center
                  </CardTitle>
                  <CardDescription>Quickly manage Contacts, Notes, and Tasks from here</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={manageTab} onValueChange={(v:any)=>setManageTab(v)}>
                    <TabsList>
                      <TabsTrigger value="contacts">Contacts</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    </TabsList>
                    <TabsContent value="contacts">
                      {teamStatus.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No contacts yet. <Link className="underline" to="/contacts">Add one</Link>.</p>
                      ) : (
                        <ul className="divide-y divide-border/50">
                          {teamStatus.slice(0,5).map((c:any)=> (
                            <li key={c.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 border">
                                  <AvatarImage src={c.avatarUrl} alt={c.name} />
                                  <AvatarFallback>{c.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{c.name}</div>
                                  <div className="text-xs text-muted-foreground">{c.email}</div>
                                </div>
                              </div>
                              <Link to="/contacts" className="text-xs underline">Manage</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>
                    <TabsContent value="notes">
                      {manageNotes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No notes found. <Link className="underline" to="/notes">Create one</Link>.</p>
                      ) : (
                        <ul className="divide-y divide-border/50">
                          {manageNotes.map((n:any)=> (
                            <li key={n.id} className="flex items-center justify-between py-2">
                              <div>
                                <div className="text-sm font-medium truncate max-w-[260px]">{n.title || 'Untitled'}</div>
                                <div className="text-xs text-muted-foreground">{new Date(n.updatedAt || n.createdAt).toLocaleString()}</div>
                              </div>
                              <Link to="/notes" className="text-xs underline">Open</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>
                    <TabsContent value="tasks">
                      {manageTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks found. <Link className="underline" to="/tasks">Add one</Link>.</p>
                      ) : (
                        <ul className="divide-y divide-border/50">
                          {manageTasks.map((t:any)=> (
                            <li key={t.id} className="flex items-center justify-between py-2">
                              <div>
                                <div className="text-sm font-medium truncate max-w-[260px]">{t.title || 'Untitled'}</div>
                                <div className="text-xs text-muted-foreground">{t.status} • {t.priority}{t.dueDate?` • due ${new Date(t.dueDate).toLocaleDateString()}`:''}</div>
                              </div>
                              <Link to="/tasks" className="text-xs underline">Open</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles for Scrollbar Hiding */}
      <style >{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;