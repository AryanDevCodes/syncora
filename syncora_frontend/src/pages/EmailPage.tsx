import { useState, useEffect, useCallback } from 'react';
import { 
  Mail, Inbox, Send, FileText, Trash2, Archive, AlertCircle, 
  Star, Plus, Search, RefreshCw, MoreVertical, CheckSquare, 
  Square, Paperclip, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { emailApi, EmailDto, EmailFilterParams } from '@/api/emailApi';
import { useToast } from '@/hooks/use-toast';
import EmailCompose from '@/components/email/EmailCompose';
import EmailDetail from '@/components/email/EmailDetail';
import { useAuth } from '@/contexts/AuthContext';

const folders = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-blue-500' },
  { id: 'sent', label: 'Sent', icon: Send, color: 'text-green-500' },
  { id: 'drafts', label: 'Drafts', icon: FileText, color: 'text-yellow-500' },
  { id: 'archive', label: 'Archive', icon: Archive, color: 'text-gray-500' },
  { id: 'spam', label: 'Spam', icon: AlertCircle, color: 'text-orange-500' },
  { id: 'trash', label: 'Trash', icon: Trash2, color: 'text-red-500' },
];

const EmailPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailDto[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailDto | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailCounts, setEmailCounts] = useState<Record<string, number>>({});

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params: EmailFilterParams = {
        folder: selectedFolder,
        search: searchQuery || undefined,
      };
      console.log('📧 Fetching emails with params:', params);
      const data = await emailApi.getEmails(params);
      console.log('📧 Received emails:', data?.length || 0, 'emails');
      console.log('📧 Email data:', data);
      setEmails(data || []);
    } catch (error) {
      console.error('❌ Failed to fetch emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to load emails',
        variant: 'destructive',
      });
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, searchQuery, toast]);

  const fetchEmailCounts = useCallback(async () => {
    try {
      const counts = await emailApi.getEmailCounts();
      console.log('📊 Email counts:', counts);
      setEmailCounts(counts || {});
    } catch (error) {
      console.error('❌ Failed to fetch email counts:', error);
      setEmailCounts({});
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    fetchEmailCounts();
  }, [fetchEmailCounts]);

  const handleEmailClick = async (email: EmailDto) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await emailApi.markAsRead(email.id, true);
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
        if (selectedEmail?.id === email.id) {
          setSelectedEmail({ ...email, isRead: true });
        }
        fetchEmailCounts();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleToggleStar = async (email: EmailDto, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await emailApi.toggleStar(email.id);
      setEmails(prev => prev.map(em => 
        em.id === email.id ? { ...em, isStarred: !em.isStarred } : em
      ));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...selectedEmail, isStarred: !selectedEmail.isStarred });
      }
      toast({
        title: email.isStarred ? 'Unstarred' : 'Starred',
        description: `Email ${email.isStarred ? 'removed from' : 'added to'} starred`,
      });
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleSelectEmail = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(emails.map(e => e.id)));
    }
  };

  const handleBulkAction = async (action: 'read' | 'unread' | 'archive' | 'trash' | 'delete') => {
    const ids = Array.from(selectedEmails);
    if (ids.length === 0) return;

    try {
      switch (action) {
        case 'read':
          await emailApi.bulkMarkAsRead(ids, true);
          break;
        case 'unread':
          await emailApi.bulkMarkAsRead(ids, false);
          break;
        case 'archive':
          await emailApi.bulkMoveToFolder(ids, 'archive');
          break;
        case 'trash':
          await emailApi.bulkMoveToFolder(ids, 'trash');
          break;
        case 'delete':
          await emailApi.bulkDelete(ids);
          break;
      }
      
      toast({
        title: 'Success',
        description: `${ids.length} email(s) ${action === 'read' ? 'marked as read' : action === 'unread' ? 'marked as unread' : action}d`,
      });
      
      setSelectedEmails(new Set());
      fetchEmails();
      fetchEmailCounts();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform action',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getUnreadCount = (folder: string) => {
    return emailCounts[folder] || 0;
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <Button 
            onClick={() => setShowCompose(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>

        <ScrollArea className="flex-1 py-2">
          <div className="px-3 space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon;
              const unreadCount = getUnreadCount(folder.id);
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setSelectedEmail(null);
                    setSelectedEmails(new Set());
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    selectedFolder === folder.id
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${selectedFolder === folder.id ? 'text-indigo-600' : folder.color}`} />
                  <span className="flex-1 text-left font-medium text-sm">{folder.label}</span>
                  {unreadCount > 0 && (
                    <Badge className="ml-auto bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="text-xs text-slate-600 font-medium truncate">
            {user?.email}
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-6 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              {selectedEmails.size === emails.length && emails.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-indigo-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {selectedEmails.size > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                  className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('trash')}
                  className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('read')}
                  className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                >
                  Mark Read
                </Button>
              </>
            )}
          </div>

          <div className="flex-1" />

          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchEmails}
            disabled={loading}
            className="hover:bg-slate-100"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Email List Content */}
        <ScrollArea className="flex-1 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Mail className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-semibold text-slate-700">No emails in {selectedFolder}</p>
              <p className="text-sm text-slate-500 mt-1">Your {selectedFolder} folder is empty</p>
            </div>
          ) : (
            <div className="">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-white cursor-pointer transition-all border-b border-slate-100 ${
                    !email.isRead ? 'bg-indigo-50/30' : 'bg-white'
                  } ${selectedEmail?.id === email.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                >
                  <button
                    onClick={(e) => handleSelectEmail(email.id, e)}
                    className="p-1 hover:bg-slate-100 rounded transition"
                  >
                    {selectedEmails.has(email.id) ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={(e) => handleToggleStar(email, e)}
                    className="p-1 hover:bg-slate-100 rounded transition"
                  >
                    <Star className={`w-5 h-5 ${email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-slate-400'}`} />
                  </button>

                  <Avatar className="w-9 h-9 border border-slate-200">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">{email.fromName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`truncate ${!email.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {email.fromName || email.from}
                      </span>
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${!email.isRead ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                      {email.subject || '(No subject)'}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {email.body?.replace(/<[^>]*>/g, '').substring(0, 100)}
                    </p>
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    {formatDate(email.sentAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Email Detail Panel */}
      {selectedEmail && (
        <EmailDetail
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onRefresh={fetchEmails}
          onReply={() => {
            setShowCompose(true);
            // Pre-fill compose with reply data
          }}
        />
      )}

      {/* Compose Modal */}
      {showCompose && (
        <EmailCompose
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false);
            fetchEmails();
            fetchEmailCounts();
          }}
        />
      )}
    </div>
  );
};

export default EmailPage;
