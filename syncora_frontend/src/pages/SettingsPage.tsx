import { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Zap, 
  Camera, 
  Save, 
  Settings,
  Trash2,
  Download,
  Mail,
  Smartphone,
  MessageSquare,
  CheckSquare,
  Eye,
  EyeOff,
  Key,
  AlertTriangle,
  HardDrive,
  Crown,
  Star,
  Gift
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Hooks & Context
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { userApi } from '@/api/userApi';
import { generateUserExportPdf } from '@/utils/exportPdf';
import { notesApi } from '@/api/notesApi';
import { taskApi } from '@/api/taskApi';
import { contactApi } from '@/api/contactApi';
import { motion } from 'framer-motion';

// Types
interface UserSettings {
  // Profile
  id: number | null;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string;
  role: string;
  subscriptionPlan: string;
  storageUsedBytes: number | null;
  createdAt: string;
  updatedAt: string;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  chatNotifications: boolean;
  taskNotifications: boolean;
  
  // Appearance
  theme: string;
  language: string;
  
  // Privacy
  profileVisibility: string;
  onlineStatus: boolean;
  readReceipts: boolean;
}

const SettingsPage = () => {
  const { user: authUser, logout } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarInput, setAvatarInput] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // User settings state
  const [userSettings, setUserSettings] = useState<UserSettings>({
    id: null,
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    avatarUrl: '',
    role: '',
    subscriptionPlan: '',
    storageUsedBytes: null,
    createdAt: '',
    updatedAt: '',
    emailNotifications: true,
    pushNotifications: true,
    chatNotifications: true,
    taskNotifications: true,
    theme: 'system',
    language: 'en',
    profileVisibility: 'everyone',
    onlineStatus: true,
    readReceipts: true,
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await userApi.getCurrentUser();
        
        setUserSettings(prev => ({
          ...prev,
          id: userData.id ?? null,
          email: userData.userEmail ?? userData.email ?? '',
          firstName: userData.firstName ?? '',
          lastName: userData.lastName ?? '',
          bio: userData.bio ?? '',
          avatarUrl: userData.avatarUrl ?? '',
          role: userData.role ?? '',
          subscriptionPlan: subscription?.plan?.name ?? userData.subscriptionPlan ?? '',
          storageUsedBytes: userData.storageUsedBytes ?? null,
          createdAt: userData.createdAt ?? '',
          updatedAt: userData.updatedAt ?? '',
          emailNotifications: userData.emailNotifications ?? true,
          pushNotifications: userData.pushNotifications ?? true,
          chatNotifications: userData.chatNotifications ?? true,
          taskNotifications: userData.taskNotifications ?? true,
        }));
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [lastUpdate, toast]);

  // Update subscription plan when subscription changes
  useEffect(() => {
    if (subscription?.plan?.name) {
      setUserSettings(prev => ({
        ...prev,
        subscriptionPlan: subscription.plan.name
      }));
    }
  }, [subscription]);

  // Listen for subscription updates
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      if (subscription?.plan?.name) {
        setUserSettings(prev => ({
          ...prev,
          subscriptionPlan: subscription.plan.name
        }));
      }
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate);
    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    };
  }, [subscription]);

  // Update single setting
  const updateSetting = useCallback((key: keyof UserSettings, value: any) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Save profile settings
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await userApi.updateCurrentUser({
        firstName: userSettings.firstName,
        lastName: userSettings.lastName,
        bio: userSettings.bio,
        emailNotifications: userSettings.emailNotifications,
        pushNotifications: userSettings.pushNotifications,
        chatNotifications: userSettings.chatNotifications,
        taskNotifications: userSettings.taskNotifications,
      });
      
      setLastUpdate(Date.now());
      setIsEditing(false);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile settings have been saved successfully',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar update
  const handleAvatarUpdate = async (avatarData: string) => {
    if (avatarData.length > 1000) {
      toast({
        title: 'Error',
        description: 'Avatar URL is too long. Maximum length is 1000 characters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await userApi.updateCurrentUser({ avatarUrl: avatarData });
      updateSetting('avatarUrl', avatarData);
      setLastUpdate(Date.now());
      
      toast({ 
        title: 'Avatar Updated', 
        description: 'Your profile picture was updated successfully.' 
      });
    } catch (error) {
      console.error('Failed to update avatar:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update avatar.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
      setShowAvatarDialog(false);
      setAvatarInput('');
    }
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await handleAvatarUpdate(base64);
    };
    reader.readAsDataURL(file);
  };

  // Save appearance settings
  const handleSaveAppearance = async () => {
    // TODO: Integrate with backend API
    toast({
      title: 'Appearance Updated',
      description: 'Your appearance settings have been saved',
    });
  };

  // Save privacy settings
  const handleSavePrivacy = async () => {
    // TODO: Integrate with backend API
    toast({
      title: 'Privacy Updated',
      description: 'Your privacy settings have been saved',
    });
  };

  // Format storage usage
  const formatStorageUsage = (bytes: number | null): { used: string; percent: number } => {
    if (!bytes) return { used: '0 B', percent: 0 };
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const used = Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    
    // Calculate percentage (assuming 1GB storage limit for free tier)
    const totalStorage = subscription?.plan?.name === 'PROFESSIONAL' ? 100 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024; // 100GB for pro, 5GB for free
    const percent = Math.min((bytes / totalStorage) * 100, 100);
    
    return { used, percent };
  };

  // Danger zone actions
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      // Fetch export JSON (from blob), then render premium PDF
      const blob = await userApi.exportCurrentUser();
      const text = await blob.text();
      const json = JSON.parse(text);

      // If backend export lacks data arrays, fetch them on the client
      const needNotes = !Array.isArray(json.notes) || json.notes.length === 0;
      const needTasks = !Array.isArray(json.tasks) || json.tasks.length === 0;
      const needContacts = !Array.isArray(json.contacts) || json.contacts.length === 0;

      if (needNotes || needTasks || needContacts) {
        const [notes, tasks, contacts] = await Promise.all([
          needNotes ? notesApi.getAllNotes().catch(() => []) : Promise.resolve(json.notes),
          needTasks ? taskApi.getAllTasks().catch(() => []) : Promise.resolve(json.tasks),
          needContacts ? contactApi.getAllContacts().catch(() => []) : Promise.resolve(json.contacts),
        ]);

        if (needNotes) json.notes = notes;
        if (needTasks) json.tasks = tasks;
        if (needContacts) json.contacts = contacts;
      }

      const doc = await generateUserExportPdf(json, {
        title: 'Syncora • Personal Data Export',
        brandName: 'SYNCORA',
        brandColor: '#7C3AED', // violet-600 for premium feel
        accentColor: '#0F172A', // slate-900
      });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      doc.save(`syncora-export-${ts}.pdf`);
      toast({ title: 'Export Complete', description: 'Your export PDF has been downloaded.' });
    } catch (error) {
      console.error('Export failed', error);
      toast({ title: 'Export Failed', description: 'Could not generate PDF export.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteDialog(true);
  };

  if (isLoading && !userSettings.email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    );
  }

  const storageInfo = formatStorageUsage(userSettings.storageUsedBytes);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Quick Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-white via-blue-50/10 to-indigo-50/10 dark:from-slate-800 dark:via-blue-900/5 dark:to-indigo-900/5 backdrop-blur-xl hover:shadow-3xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-indigo-500/10 rounded-t-lg border-b border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 shadow-inner">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Profile Information</CardTitle>
                        <CardDescription className="font-medium">
                          Update your personal details and profile picture
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => setIsEditing(!isEditing)}
                      className={isEditing ? "gap-2 border-2 border-primary/30" : "gap-2 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 hover:from-primary/90 hover:via-blue-700 hover:to-indigo-700 text-white shadow-md"}
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500 rounded-full opacity-30 group-hover:opacity-50 blur transition duration-300"></div>
                        <Avatar className="w-28 h-28 border-4 border-white shadow-2xl relative ring-2 ring-primary/20">
                          <AvatarImage 
                            src={userSettings.avatarUrl} 
                            alt={`${userSettings.firstName} ${userSettings.lastName}`} 
                          />
                          <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/80 text-white">
                            {userSettings.firstName?.charAt(0) || userSettings.lastName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => setShowAvatarDialog(true)}
                          className="absolute -bottom-2 -right-2 p-3 rounded-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 border-4 border-white dark:border-slate-800 group"
                        >
                          <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        </button>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                          {userSettings.firstName} {userSettings.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium mt-1">{userSettings.email}</p>
                        <Badge className="mt-3 px-4 py-1 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white shadow-md font-bold">
                          {userSettings.role}
                        </Badge>
                      </div>
                    </div>

                    {/* Profile Form */}
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={userSettings.firstName}
                                onChange={(e) => updateSetting('firstName', e.target.value)}
                                placeholder="First Name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={userSettings.lastName}
                                onChange={(e) => updateSetting('lastName', e.target.value)}
                                placeholder="Last Name"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={userSettings.email}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                              Contact support to change your email address
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <textarea
                              id="bio"
                              value={userSettings.bio}
                              onChange={(e) => updateSetting('bio', e.target.value)}
                              placeholder="Tell us about yourself..."
                              className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                              maxLength={160}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Brief description for your profile</span>
                              <span>{userSettings.bio.length}/160</span>
                            </div>
                          </div>

                          <Button 
                            onClick={handleSaveProfile} 
                            disabled={isLoading}
                            className="w-full gap-2 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 hover:from-primary/90 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                            size="lg"
                          >
                            <Save className="w-5 h-5" />
                            Save Changes
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">About</h4>
                            <p className="text-muted-foreground">
                              {userSettings.bio || 'No bio added yet.'}
                            </p>
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Crown className="w-4 h-4" />
                                Subscription
                              </h4>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white shadow-md px-3 py-1 font-bold">
                                    {userSettings.subscriptionPlan || 'STARTER'}
                                  </Badge>
                                  {subscription?.isInTrial && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                                      <Gift className="w-3 h-3 mr-1" />
                                      Trial Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                  Member since {userSettings.createdAt ? new Date(userSettings.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently joined'}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <HardDrive className="w-4 h-4" />
                                Storage Usage
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{storageInfo.used} used</span>
                                  <span className="text-muted-foreground">
                                    {subscription?.plan?.name === 'PROFESSIONAL' ? '100 GB total' : '5 GB total'}
                                  </span>
                                </div>
                                <Progress value={storageInfo.percent} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  {subscription?.plan?.name === 'PROFESSIONAL' 
                                    ? 'Professional plan includes 100 GB storage' 
                                    : 'Upgrade to Professional for more storage'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Settings Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-xl border border-primary/10 shadow-lg">
                  <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 font-medium">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 font-medium">
                    <Palette className="w-4 h-4 mr-2" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 font-medium">
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy
                  </TabsTrigger>
                </TabsList>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="mt-6">
                  <Card className="shadow-xl border-2 border-primary/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Notification Preferences</CardTitle>
                      <CardDescription className="font-medium">Control how you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-transparent hover:border-primary/30 hover:bg-gradient-to-r hover:from-primary/5 hover:to-blue-500/5 transition-all duration-300 hover:shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Mail className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Email Notifications</Label>
                              <p className="text-sm text-muted-foreground">
                                Receive updates and alerts via email
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={userSettings.emailNotifications}
                            onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-transparent hover:border-green-500/30 hover:bg-gradient-to-r hover:from-green-500/5 hover:to-emerald-500/5 transition-all duration-300 hover:shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <Smartphone className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Push Notifications</Label>
                              <p className="text-sm text-muted-foreground">
                                Receive browser notifications
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={userSettings.pushNotifications}
                            onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-transparent hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-violet-500/5 transition-all duration-300 hover:shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                              <MessageSquare className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Chat Notifications</Label>
                              <p className="text-sm text-muted-foreground">
                                Notify about new messages
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={userSettings.chatNotifications}
                            onCheckedChange={(checked) => updateSetting('chatNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-transparent hover:border-amber-500/30 hover:bg-gradient-to-r hover:from-amber-500/5 hover:to-yellow-500/5 transition-all duration-300 hover:shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                              <CheckSquare className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Task Notifications</Label>
                              <p className="text-sm text-muted-foreground">
                                Notify about task updates and deadlines
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={userSettings.taskNotifications}
                            onCheckedChange={(checked) => updateSetting('taskNotifications', checked)}
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="gap-2 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 hover:from-primary/90 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                        size="lg"
                      >
                        <Save className="w-5 h-5" />
                        Save Notification Settings
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="mt-6">
                  <Card className="shadow-xl border-2 border-primary/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Appearance Settings</CardTitle>
                      <CardDescription className="font-medium">Customize how Syncora looks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Theme</Label>
                          <Select 
                            value={userSettings.theme} 
                            onValueChange={(value) => updateSetting('theme', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Choose your preferred color scheme
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Language</Label>
                          <Select 
                            value={userSettings.language} 
                            onValueChange={(value) => updateSetting('language', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="de">Deutsch</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Interface language preference
                          </p>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSaveAppearance}
                        disabled={isLoading}
                        className="gap-2 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 hover:from-primary/90 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                        size="lg"
                      >
                        <Save className="w-5 h-5" />
                        Save Appearance Settings
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="mt-6">
                  <Card className="shadow-xl border-2 border-primary/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Privacy & Security</CardTitle>
                      <CardDescription className="font-medium">Manage your privacy settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Profile Visibility</Label>
                          <Select 
                            value={userSettings.profileVisibility} 
                            onValueChange={(value) => updateSetting('profileVisibility', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="everyone">Everyone (Public)</SelectItem>
                              <SelectItem value="team">Team Members Only</SelectItem>
                              <SelectItem value="private">Private (Only Me)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Control who can see your profile information
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <Eye className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Show Online Status</Label>
                              <p className="text-sm text-muted-foreground">
                                Let others see when you're online
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={userSettings.onlineStatus}
                            onCheckedChange={(checked) => updateSetting('onlineStatus', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Key className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Read Receipts</Label>
                              <p className="text-sm text-muted-foreground">
                                Send read receipts in conversations
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={userSettings.readReceipts}
                            onCheckedChange={(checked) => updateSetting('readReceipts', checked)}
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={handleSavePrivacy}
                        disabled={isLoading}
                        className="gap-2 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 hover:from-primary/90 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                        size="lg"
                      >
                        <Save className="w-5 h-5" />
                        Save Privacy Settings
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Right Column - Danger Zone & Account Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Account Info */}
            <Card className="shadow-xl border-2 border-primary/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  <Settings className="w-5 h-5 text-primary" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-medium">Account ID</Label>
                  <p className="font-mono text-sm font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {userSettings.id ? `#${userSettings.id}` : 'Loading...'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-medium">Created</Label>
                  <p className="font-medium">
                    {userSettings.createdAt ? new Date(userSettings.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-medium">Last Updated</Label>
                  <p className="font-medium">
                    {userSettings.updatedAt ? new Date(userSettings.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-2 border-red-500/30 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="font-medium">Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  className="w-full justify-start gap-2 border-2 border-blue-500/30 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950 dark:hover:to-indigo-950 hover:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                  size="lg"
                >
                  <Download className="w-4 h-4" />
                  Export All Data
                  <Badge className="ml-auto bg-blue-500/10 text-blue-600 text-xs">PDF</Badge>
                </Button>
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  onClick={handleDeleteAccount}
                  className="w-full justify-start gap-2 border-2 border-red-500/30 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950 dark:hover:to-orange-950 hover:border-red-500/50 transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                  size="lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Avatar Update Dialog */}
      <AvatarUpdateDialog
        open={showAvatarDialog}
        onOpenChange={setShowAvatarDialog}
        avatarInput={avatarInput}
        onAvatarInputChange={setAvatarInput}
        currentAvatar={userSettings.avatarUrl}
        firstName={userSettings.firstName}
        lastName={userSettings.lastName}
        onFileUpload={handleFileUpload}
        onUrlSubmit={handleAvatarUpdate}
        isLoading={isLoading}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={async () => {
          try {
            setIsLoading(true);
            await userApi.deleteCurrentUser();
            toast({ title: 'Account Deleted', description: 'Your account has been deleted.' });
            await logout();
            window.location.href = '/auth';
          } catch (error) {
            console.error('Delete failed', error);
            toast({ title: 'Delete Failed', description: 'Could not delete your account.', variant: 'destructive' });
          } finally {
            setIsLoading(false);
            setShowDeleteDialog(false);
          }
        }}
      />
    </div>
  );
};

// Avatar Update Dialog Component
interface AvatarUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarInput: string;
  onAvatarInputChange: (value: string) => void;
  currentAvatar: string;
  firstName: string;
  lastName: string;
  onFileUpload: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  isLoading: boolean;
}

const AvatarUpdateDialog: React.FC<AvatarUpdateDialogProps> = ({
  open,
  onOpenChange,
  avatarInput,
  onAvatarInputChange,
  currentAvatar,
  firstName,
  lastName,
  onFileUpload,
  onUrlSubmit,
  isLoading,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogDescription>
          Upload an image or paste a URL for your new avatar
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage src={avatarInput || currentAvatar} alt="Avatar Preview" />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/80 text-white">
                {(firstName || lastName)?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                <Camera className="w-5 h-5" />
                <span>Upload from device</span>
              </div>
            </Label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file);
              }}
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">OR</div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Paste image URL..."
              value={avatarInput}
              onChange={(e) => onAvatarInputChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG or GIF. Max size 2MB. You can upload or paste an image URL.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button 
          onClick={() => onUrlSubmit(avatarInput)}
          disabled={!avatarInput.trim() || isLoading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          Update Avatar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Delete Account Dialog Component
interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ open, onOpenChange, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };
  
  const disabled = confirmText !== 'DELETE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Delete Account</DialogTitle>
          <DialogDescription className="text-center">
            This action cannot be undone. All your data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium mb-2">Type "DELETE" to confirm</p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              className="text-center"
            />
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                All your notes, tasks, and contacts will be deleted
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Your subscription will be cancelled immediately
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                This action cannot be reversed
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            disabled={disabled || isDeleting}
            onClick={handleConfirm}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPage;