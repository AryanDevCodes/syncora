import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Mail,
  Smartphone,
  MessageSquare,
  CheckSquare,
  Save,
  Settings,
  Trash2,
  Download,
  Camera,
  Eye,
  Key,
  AlertTriangle,
  HardDrive,
  Crown,
  Gift,
  LogOut,
  ChevronRight,
  Globe,
  Sun,
  Moon,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Hooks & Context
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { userApi } from '@/api/userApi';
import { generateUserExportPdf } from '@/utils/exportPdf';
import { notesApi } from '@/api/notesApi';
import { taskApi } from '@/api/taskApi';
import { contactApi } from '@/api/contactApi';

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
  twoFactorAuth: boolean;
}

const SettingsPage = () => {
  const { user: authUser, logout } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarInput, setAvatarInput] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [initialSettings, setInitialSettings] = useState<UserSettings | null>(null);

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
    twoFactorAuth: false,
  });

  // Check if settings have changed
  const hasChanges = useCallback(() => {
    if (!initialSettings) return false;
    return JSON.stringify(userSettings) !== JSON.stringify(initialSettings);
  }, [userSettings, initialSettings]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await userApi.getCurrentUser();

        const settings: UserSettings = {
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
          theme: userData.theme ?? 'system',
          language: userData.language ?? 'en',
          profileVisibility: userData.profileVisibility ?? 'everyone',
          onlineStatus: userData.onlineStatus ?? true,
          readReceipts: userData.readReceipts ?? true,
          twoFactorAuth: userData.twoFactorAuth ?? false,
        };
        
        setUserSettings(settings);
        setInitialSettings(settings);
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

  // Update single setting
  const updateSetting = useCallback((key: keyof UserSettings, value: any) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Save all settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await userApi.updateCurrentUser({
        firstName: userSettings.firstName,
        lastName: userSettings.lastName,
        bio: userSettings.bio,
        emailNotifications: userSettings.emailNotifications,
        pushNotifications: userSettings.pushNotifications,
        chatNotifications: userSettings.chatNotifications,
        taskNotifications: userSettings.taskNotifications,
        theme: userSettings.theme,
        language: userSettings.language,
        profileVisibility: userSettings.profileVisibility,
        onlineStatus: userSettings.onlineStatus,
        readReceipts: userSettings.readReceipts,
        twoFactorAuth: userSettings.twoFactorAuth,
      });
      
      setLastUpdate(Date.now());
      setInitialSettings(userSettings);
      
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully',
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle avatar update
  const handleAvatarUpdate = async () => {
    if (!avatarInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an image URL or upload a file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await userApi.updateCurrentUser({ avatarUrl: avatarInput });

      setUserSettings(prev => ({ ...prev, avatarUrl: avatarInput }));
      setLastUpdate(Date.now());
      
      toast({ 
        title: 'Success', 
        description: 'Profile picture updated successfully.' 
      });
    } catch (error) {
      console.error('Failed to update avatar:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update profile picture.', 
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
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setAvatarInput(base64);
    };
    reader.onerror = () => {
      toast({
        title: 'Upload Failed',
        description: 'Failed to read the image file',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  // Format storage usage
  const formatStorageUsage = (bytes: number | null): { used: string; percent: number; total: string } => {
    if (!bytes) return { used: '0 B', percent: 0, total: '0 B' };
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const used = Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    
    const totalBytes = subscription?.plan?.name === 'PROFESSIONAL' ? 100 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024;
    const percent = Math.min((bytes / totalBytes) * 100, 100);
    const total = (totalBytes / Math.pow(1024, 3)).toFixed(0) + ' GB';
    
    return { used, percent, total };
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data
      const [userData, notes, tasks, contacts] = await Promise.all([
        userApi.getCurrentUser().catch(() => ({})),
        notesApi.getAllNotes().catch(() => []),
        taskApi.getAllTasks().catch(() => []),
        contactApi.getAllContacts().catch(() => []),
      ]);

      const exportData = {
        user: userData,
        notes,
        tasks,
        contacts,
        exportedAt: new Date().toISOString(),
      };

      // Generate PDF
      const doc = await generateUserExportPdf(exportData, {
        title: 'Syncora • Data Export',
        brandName: 'SYNCORA',
        brandColor: '#2563eb',
        accentColor: '#1e293b',
      });
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      doc.save(`syncora-export-${timestamp}.pdf`);
      
      toast({ 
        title: 'Export Complete', 
        description: 'Your data has been exported successfully.',
      });
    } catch (error) {
      console.error('Export failed', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Could not export your data.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      await userApi.deleteCurrentUser();
      
      toast({ 
        title: 'Account Deleted', 
        description: 'Your account has been deleted successfully.' 
      });
      
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Delete failed', error);
      toast({ 
        title: 'Delete Failed', 
        description: 'Could not delete your account. Please try again later.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Reset settings to original
  const handleResetChanges = () => {
    if (initialSettings) {
      setUserSettings(initialSettings);
      toast({
        title: 'Changes Reset',
        description: 'All changes have been discarded',
      });
    }
  };

  if (isLoading && !userSettings.email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const storageInfo = formatStorageUsage(userSettings.storageUsedBytes);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-indigo-200 opacity-60 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-blue-100 opacity-70 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
          <div className="rounded-2xl border bg-white/80 shadow-lg backdrop-blur-md p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                    <AvatarImage src={userSettings.avatarUrl} />
                    <AvatarFallback className="bg-primary text-white font-semibold">
                      {userSettings.firstName?.charAt(0) || userSettings.lastName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Account</p>
                  <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                  <p className="text-gray-600">Manage your profile, preferences, and privacy in one place.</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                    <Badge variant={userSettings.subscriptionPlan === 'PROFESSIONAL' ? 'default' : 'outline'} className="rounded-full">
                      <Crown className="w-3 h-3 mr-1" />
                      {userSettings.subscriptionPlan || 'STARTER'}
                    </Badge>
                    {subscription?.isInTrial && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 rounded-full">
                        <Gift className="w-3 h-3 mr-1" />
                        Trial Active
                      </Badge>
                    )}
                    {userSettings.createdAt && (
                      <span className="text-gray-500">Member since {new Date(userSettings.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleExportData}
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    await logout();
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
                <Button
                  className="gap-2 shadow-sm"
                  onClick={handleSaveSettings}
                  disabled={isSaving || !hasChanges()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3 shadow-sm">
                <Crown className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Plan</p>
                  <p className="text-sm font-medium text-gray-900">{userSettings.subscriptionPlan || 'Starter'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3 shadow-sm">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Storage</p>
                  <p className="text-sm font-medium text-gray-900">{storageInfo.used} • {Math.round(storageInfo.percent)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3 shadow-sm">
                <Shield className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Security</p>
                  <p className="text-sm font-medium text-gray-900">{userSettings.twoFactorAuth ? '2FA enabled' : 'Basic protection'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-1 lg:sticky lg:top-6">
              <Card className="h-full flex flex-col rounded-xl border bg-white shadow-sm">
                <CardContent className="p-6 flex-1 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Avatar className="w-12 h-12 border">
                      <AvatarImage src={userSettings.avatarUrl} />
                      <AvatarFallback className="bg-primary text-white font-semibold">
                        {userSettings.firstName?.charAt(0) || userSettings.lastName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{userSettings.firstName} {userSettings.lastName}</h3>
                      <p className="text-sm text-gray-600 truncate">{userSettings.email}</p>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    {[
                      { id: 'profile', label: 'Profile', icon: User },
                      { id: 'notifications', label: 'Notifications', icon: Bell },
                      { id: 'appearance', label: 'Appearance', icon: Palette },
                      { id: 'privacy', label: 'Privacy & Security', icon: Shield },
                      { id: 'account', label: 'Account', icon: Settings },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          activeTab === item.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {activeTab === item.id && (
                          <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </nav>

                  <div className="pt-4 border-t space-y-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                            onClick={handleExportData}
                            disabled={isLoading}
                          >
                            <Download className="w-4 h-4" />
                            <span className="truncate">Export Data</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download all your data as PDF</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-6 pb-24 min-w-0">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <Card className="rounded-xl border bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal details and profile picture
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <Avatar className="w-24 h-24 border-2 border-gray-200">
                              <AvatarImage src={userSettings.avatarUrl} />
                              <AvatarFallback className="text-xl bg-primary text-white font-semibold">
                                {userSettings.firstName?.charAt(0) || userSettings.lastName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <button
                              onClick={() => {
                                setAvatarInput(userSettings.avatarUrl || '');
                                setShowAvatarDialog(true);
                              }}
                              className="absolute -bottom-2 -right-2 p-2 bg-white border rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 text-center max-w-[200px]">
                            Click the camera icon to update your photo
                          </p>
                        </div>

                        <div className="flex-1 space-y-4 min-w-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={userSettings.firstName}
                                onChange={(e) => updateSetting('firstName', e.target.value)}
                                placeholder="Enter your first name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={userSettings.lastName}
                                onChange={(e) => updateSetting('lastName', e.target.value)}
                                placeholder="Enter your last name"
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
                              className="bg-gray-50"
                            />
                            <p className="text-sm text-gray-600">
                              Contact support to change your email address
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                              id="bio"
                              value={userSettings.bio}
                              onChange={(e) => updateSetting('bio', e.target.value)}
                              placeholder="Tell us about yourself..."
                              className="min-h-[100px]"
                              maxLength={160}
                            />
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Brief description for your profile</span>
                              <span>{userSettings.bio.length}/160</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm text-gray-600">Subscription Plan</Label>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant={userSettings.subscriptionPlan === 'PROFESSIONAL' ? 'default' : 'outline'}>
                                    <Crown className="w-3 h-3 mr-1" />
                                    {userSettings.subscriptionPlan || 'STARTER'}
                                  </Badge>
                                  {subscription?.isInTrial && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                      <Gift className="w-3 h-3 mr-1" />
                                      Trial Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {userSettings.createdAt ? 
                                    `Member since ${new Date(userSettings.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` 
                                    : 'Recently joined'
                                  }
                                </p>
                              </div>
                              
                              <div>
                                <Label className="text-sm text-gray-600">Storage Usage</Label>
                                <div className="space-y-1 mt-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{storageInfo.used} used</span>
                                    <span className="text-gray-600">{storageInfo.total} total</span>
                                  </div>
                                  <Progress value={storageInfo.percent} className="h-2" />
                                  <p className="text-xs text-gray-600">
                                    {Math.round(storageInfo.percent)}% of storage used
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <Card className="rounded-xl border bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Choose how you want to be notified about updates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        {[
                          {
                            key: 'emailNotifications' as const,
                            icon: Mail,
                            title: 'Email Notifications',
                            description: 'Receive updates via email',
                          },
                          {
                            key: 'pushNotifications' as const,
                            icon: Smartphone,
                            title: 'Push Notifications',
                            description: 'Receive browser notifications',
                          },
                          {
                            key: 'chatNotifications' as const,
                            icon: MessageSquare,
                            title: 'Chat Notifications',
                            description: 'Get notified about new messages',
                          },
                          {
                            key: 'taskNotifications' as const,
                            icon: CheckSquare,
                            title: 'Task Notifications',
                            description: 'Updates about tasks and deadlines',
                          },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <item.icon className="w-4 h-4 text-gray-700" />
                              </div>
                              <div>
                                <Label className="font-medium">{item.title}</Label>
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={userSettings[item.key]}
                              onCheckedChange={(checked) => updateSetting(item.key, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <Card className="rounded-xl border bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>
                        Customize how Syncora looks and feels
                      </CardDescription>
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
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <Sun className="w-4 h-4" />
                                  Light
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <Moon className="w-4 h-4" />
                                  Dark
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center gap-2">
                                  <Settings className="w-4 h-4" />
                                  System
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-600">
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
                          <p className="text-sm text-gray-600">
                            Interface language preference
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <Card className="rounded-xl border bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Privacy & Security</CardTitle>
                      <CardDescription>
                        Manage your privacy and security settings
                      </CardDescription>
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
                          <p className="text-sm text-gray-600">
                            Control who can see your profile information
                          </p>
                        </div>

                        <div className="space-y-4">
                          {[
                            {
                              key: 'onlineStatus' as const,
                              icon: Eye,
                              title: 'Online Status',
                              description: 'Show when you\'re online',
                            },
                            {
                              key: 'readReceipts' as const,
                              icon: Key,
                              title: 'Read Receipts',
                              description: 'Send read receipts in conversations',
                            },
                            {
                              key: 'twoFactorAuth' as const,
                              icon: Shield,
                              title: 'Two-Factor Authentication',
                              description: 'Add an extra layer of security',
                            },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <item.icon className="w-4 h-4 text-gray-700" />
                                </div>
                                <div>
                                  <Label className="font-medium">{item.title}</Label>
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                </div>
                              </div>
                              <Switch
                                checked={userSettings[item.key]}
                                onCheckedChange={(checked) => updateSetting(item.key, checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <Card className="rounded-xl border bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Account Information</CardTitle>
                      <CardDescription>
                        View and manage your account details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-gray-600">Account ID</Label>
                            <p className="font-mono text-sm mt-1 bg-gray-50 p-2 rounded">
                              {userSettings.id || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Account Created</Label>
                            <p className="mt-1">
                              {userSettings.createdAt ? new Date(userSettings.createdAt).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                              }) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Last Updated</Label>
                            <p className="mt-1">
                              {userSettings.updatedAt ? new Date(userSettings.updatedAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-gray-600">Storage Usage</Label>
                            <div className="mt-1">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-medium">{storageInfo.used}</span>
                                <span className="text-gray-600">
                                  {Math.round(storageInfo.percent)}% of {storageInfo.total}
                                </span>
                              </div>
                              <Progress value={storageInfo.percent} className="h-2" />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm text-gray-600">Security Status</Label>
                            <div className="flex items-center gap-2 mt-1">
                              {userSettings.twoFactorAuth ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Enhanced Security
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Basic Security
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {userSettings.twoFactorAuth 
                                ? 'Two-factor authentication is enabled' 
                                : 'Enable two-factor authentication for enhanced security'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 rounded-xl shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription>
                        Irreversible actions. Please proceed with caution.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-medium text-red-800">Delete Account</h4>
                            <p className="text-sm text-red-600 mt-1">
                              Permanently delete your account and all associated data
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button (Fixed at bottom) */}
      {hasChanges() && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="shadow-lg border-primary/20 min-w-[300px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Unsaved Changes</p>
                  <p className="text-sm text-gray-600">
                    You have unsaved changes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetChanges}
                    disabled={isSaving}
                    size="sm"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    size="sm"
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Avatar Update Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload an image or paste a URL for your new profile picture
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-32 h-32 border-2">
                  <AvatarImage 
                    src={avatarInput || userSettings.avatarUrl} 
                    alt="Preview" 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-primary text-white font-semibold">
                    {(userSettings.firstName || userSettings.lastName)?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
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
                    if (file) handleFileUpload(file);
                    e.target.value = ''; // Reset input
                  }}
                />
                <p className="text-xs text-gray-600 mt-2 text-center">
                  JPG, PNG or GIF. Max size 2MB
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar-url">Image URL</Label>
                <Input
                  id="avatar-url"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                />
                <p className="text-xs text-gray-600">
                  Enter a direct link to your image
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleAvatarUpdate}
              disabled={!avatarInput.trim() || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Picture'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-center">Delete Account</DialogTitle>
            <DialogDescription className="text-center">
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>All your notes, tasks, and contacts will be permanently deleted</span>
                </li>
                <li className="flex items-start gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Your subscription will be cancelled immediately</span>
                </li>
                <li className="flex items-start gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>This action cannot be reversed or recovered</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Type "DELETE" to confirm</Label>
              <Input
                placeholder="Type DELETE"
                className="text-center font-mono tracking-wider uppercase"
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  // Only allow DELETE input
                  if (value === 'DELETE' || value === 'DELET' || value === 'DELE' || value === 'DEL' || value === 'DE' || value === 'D' || value === '') {
                    e.target.value = value;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value === 'DELETE') {
                    handleDeleteAccount();
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;