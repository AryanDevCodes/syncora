import { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { contactApi, ContactDto } from '@/api/contactApi';

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

interface InviteMembersDialogProps {
  roomId: string;
  currentParticipants: string[];
  onInvite: (userEmail: string) => void;
  onClose: () => void;
}

const InviteMembersDialog = ({ roomId, currentParticipants, onInvite, onClose }: InviteMembersDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [allContacts, setAllContacts] = useState<ContactDto[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [manualEmail, setManualEmail] = useState('');

  // Fetch contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const contacts = await contactApi.getAllContacts();
        setAllContacts(contacts || []);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load contacts',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    // Map contacts to User format and filter based on search query
    const mappedUsers: User[] = allContacts
      .filter(contact => !currentParticipants.includes(contact.email))
      .map(contact => ({
        id: contact.id?.toString() || contact.email,
        email: contact.email,
        username: contact.name || contact.email.split('@')[0],
        avatar: contact.avatarUrl,
        isOnline: false, // Can be enhanced with real online status
      }))
      .filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );

    setUsers(mappedUsers);
  }, [searchQuery, currentParticipants, allContacts]);

  const handleInvite = (user: User) => {
    onInvite(user.email);
    setInvitedUsers(prev => new Set(prev).add(user.id));
    
    toast({
      title: 'Invitation sent',
      description: `Invitation sent to ${user.email}`,
    });
  };

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/video?roomId=${roomId}`;
    navigator.clipboard.writeText(roomLink);
    toast({
      title: 'Room link copied',
      description: 'Share this link to invite others to the meeting',
    });
  };

  const handleManualInvite = () => {
    if (!manualEmail.trim()) return;
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(manualEmail.trim())) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    handleInvite({ 
      id: manualEmail, 
      email: manualEmail.trim(), 
      username: manualEmail.split('@')[0] 
    } as User);
    setManualEmail('');
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Manual Email Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Invite by email</label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="user@example.com"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleManualInvite();
              }
            }}
            className="flex-1"
          />
          <Button 
            onClick={handleManualInvite}
            disabled={!manualEmail.trim()}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Works with both contacts and non-contacts
        </p>
      </div>

      {/* Search Contacts */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search your contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={copyRoomLink}
          className="flex-1"
        >
          <Mail className="w-4 h-4 mr-2" />
          Copy Room Link
        </Button>
      </div>

      {/* Contacts List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Your Contacts</h3>
        <ScrollArea className="max-h-64">
          {loading ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              Loading contacts...
            </div>
          ) : (
            <div className="space-y-2">
              {users.length > 0 ? (
                users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(user)}
                      disabled={invitedUsers.has(user.id)}
                      className="h-7 px-2"
                    >
                      {invitedUsers.has(user.id) ? (
                        'Started'
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
                          Chat
                        </>
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-4">
                  {searchQuery ? 'No contacts found matching your search' : allContacts.length === 0 ? 'No contacts yet. Use email input above to start chatting.' : 'All contacts already have active chats'}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        💡 <strong>Tip:</strong> Start a chat with any email address, even if they're not in your contacts yet.
      </div>
    </div>
  );
};

export default InviteMembersDialog;