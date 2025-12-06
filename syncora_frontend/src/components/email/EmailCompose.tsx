import { useState, useRef } from 'react';
import { X, Send, Paperclip, Trash2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { emailApi, EmailComposeRequest } from '@/api/emailApi';
import { useToast } from '@/hooks/use-toast';

interface EmailComposeProps {
  onClose: () => void;
  onSent: () => void;
  replyTo?: {
    to: string;
    subject: string;
    body?: string;
  };
}

const EmailCompose = ({ onClose, onSent, replyTo }: EmailComposeProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [to, setTo] = useState(replyTo?.to || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(replyTo?.subject ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState(replyTo?.body ? `\n\n--- Original Message ---\n${replyTo.body}` : '');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const parseEmails = (str: string): string[] => {
    return str
      .split(/[,;]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
  };

  const validateEmails = (emails: string[]): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(email => emailRegex.test(email));
  };

  const handleSend = async () => {
    const toEmails = parseEmails(to);
    const ccEmails = parseEmails(cc);
    const bccEmails = parseEmails(bcc);

    if (toEmails.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one recipient',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmails([...toEmails, ...ccEmails, ...bccEmails])) {
      toast({
        title: 'Error',
        description: 'Please enter valid email addresses',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const request: EmailComposeRequest = {
        to: toEmails,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        bcc: bccEmails.length > 0 ? bccEmails : undefined,
        subject: subject.trim() || '(No subject)',
        body,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await emailApi.sendEmail(request);
      toast({
        title: 'Success',
        description: 'Email sent successfully',
      });
      onSent();
    } catch (error: any) {
      console.error('Failed to send email:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to send email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const request: EmailComposeRequest = {
        to: parseEmails(to),
        cc: parseEmails(cc),
        bcc: parseEmails(bcc),
        subject,
        body,
        isDraft: true,
      };

      await emailApi.saveDraft(request);
      toast({
        title: 'Draft saved',
        description: 'Your email has been saved to drafts',
      });
      onClose();
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive',
      });
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-8 w-80 bg-gray-800 text-white rounded-t-lg shadow-xl z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-medium truncate">{subject || 'New Message'}</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(false)}
              className="h-6 w-6 text-white hover:bg-gray-700"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-white hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">New Message</h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveDraft}
              disabled={sending}
            >
              <span className="text-xs">Save</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Compose Body */}
        <div className="flex-1 overflow-y-auto">
          {/* To Field */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-2">
            <label className="w-16 text-sm text-gray-600 dark:text-gray-400">To</label>
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients (comma separated)"
                className="border-0 focus-visible:ring-0 px-0"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCc(!showCc)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Cc
                </button>
                <button
                  onClick={() => setShowBcc(!showBcc)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Bcc
                </button>
              </div>
            </div>
          </div>

          {/* Cc Field */}
          {showCc && (
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-2">
              <label className="w-16 text-sm text-gray-600 dark:text-gray-400">Cc</label>
              <Input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Carbon copy"
                className="border-0 focus-visible:ring-0 px-0"
              />
            </div>
          )}

          {/* Bcc Field */}
          {showBcc && (
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-2">
              <label className="w-16 text-sm text-gray-600 dark:text-gray-400">Bcc</label>
              <Input
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="Blind carbon copy"
                className="border-0 focus-visible:ring-0 px-0"
              />
            </div>
          )}

          {/* Subject Field */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-2">
            <label className="w-16 text-sm text-gray-600 dark:text-gray-400">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="border-0 focus-visible:ring-0 px-0"
            />
          </div>

          {/* Body */}
          <div className="p-4">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your email..."
              className="min-h-[300px] border-0 focus-visible:ring-0 resize-none"
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 py-2 px-3"
                  >
                    <Paperclip className="w-3 h-3" />
                    <span className="text-xs">
                      {file.name} ({formatFileSize(file.size)})
                    </span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSend}
              disabled={sending || !to.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send'}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailCompose;
