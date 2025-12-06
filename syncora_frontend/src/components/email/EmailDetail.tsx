import { useState } from 'react';
import { X, Reply, ReplyAll, Forward, Archive, Trash2, Star, Download, MoreVertical, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { EmailDto, emailApi } from '@/api/emailApi';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EmailDetailProps {
  email: EmailDto;
  onClose: () => void;
  onRefresh: () => void;
  onReply: () => void;
}

const EmailDetail = ({ email, onClose, onRefresh, onReply }: EmailDetailProps) => {
  const { toast } = useToast();
  const [isStarred, setIsStarred] = useState(email.isStarred);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleToggleStar = async () => {
    try {
      await emailApi.toggleStar(email.id);
      setIsStarred(!isStarred);
      toast({
        title: isStarred ? 'Unstarred' : 'Starred',
        description: `Email ${isStarred ? 'removed from' : 'added to'} starred`,
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async () => {
    try {
      await emailApi.moveToFolder(email.id, 'archive');
      toast({
        title: 'Archived',
        description: 'Email moved to archive',
      });
      onClose();
      onRefresh();
    } catch (error) {
      console.error('Failed to archive:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive email',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await emailApi.moveToFolder(email.id, 'trash');
      toast({
        title: 'Deleted',
        description: 'Email moved to trash',
      });
      onClose();
      onRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete email',
        variant: 'destructive',
      });
    }
  };

  const handleMarkUnread = async () => {
    try {
      await emailApi.markAsRead(email.id, false);
      toast({
        title: 'Marked as unread',
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to mark as unread:', error);
    }
  };

  const handleDownloadAttachment = (attachment: any) => {
    // Download attachment
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-[600px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleArchive}
          >
            <Archive className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleMarkUnread}
          >
            <span className="text-xs">Unread</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleStar}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleMarkUnread}>
                Mark as unread
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Subject */}
          <h1 className="text-2xl font-bold mb-4">
            {email.subject || '(No subject)'}
          </h1>

          {/* Labels */}
          {email.labels && email.labels.length > 0 && (
            <div className="flex gap-2 mb-4">
              {email.labels.map((label, index) => (
                <Badge key={index} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          )}

          {/* Sender Info */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback>{email.fromName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{email.fromName || email.from}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {email.from}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  to {email.to.join(', ')}
                </div>
                {email.cc && email.cc.length > 0 && (
                  <div className="text-xs text-gray-500">
                    cc: {email.cc.join(', ')}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(email.sentAt)}
            </div>
          </div>

          {/* Body */}
          <div className="prose dark:prose-invert max-w-none mb-6">
            {email.htmlBody ? (
              <div dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
            ) : (
              <div className="whitespace-pre-wrap">{email.body}</div>
            )}
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {email.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">{attachment.filename}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <Button
            onClick={onReply}
            className="flex-1"
            variant="outline"
          >
            <Reply className="w-4 h-4 mr-2" />
            Reply
          </Button>
          <Button
            onClick={onReply}
            className="flex-1"
            variant="outline"
          >
            <ReplyAll className="w-4 h-4 mr-2" />
            Reply All
          </Button>
          <Button
            onClick={onReply}
            variant="outline"
          >
            <Forward className="w-4 h-4 mr-2" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;
