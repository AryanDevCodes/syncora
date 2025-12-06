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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4">
          <Button 
            onClick={() => setShowCompose(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2">
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition ${
                    selectedFolder === folder.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${folder.color}`} />
                  <span className="flex-1 text-left font-medium">{folder.label}</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {selectedEmails.size === emails.length && emails.length > 0 ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>

            {selectedEmails.size > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('trash')}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('read')}
                >
                  Mark Read
                </Button>
              </>
            )}
          </div>

          <div className="flex-1" />

          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchEmails}
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Email List Content */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Mail className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No emails in {selectedFolder}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition ${
                    !email.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                  } ${selectedEmail?.id === email.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                  <button
                    onClick={(e) => handleSelectEmail(email.id, e)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    {selectedEmails.has(email.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => handleToggleStar(email, e)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <Star className={`w-5 h-5 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </button>

                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{email.fromName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium truncate ${!email.isRead ? 'font-bold' : ''}`}>
                        {email.fromName || email.from}
                      </span>
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${!email.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {email.subject || '(No subject)'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {email.body?.replace(/<[^>]*>/g, '').substring(0, 100)}
                    </p>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
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
