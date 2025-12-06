import { Eye, Edit, Trash2, Mail, Phone, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContactDto } from '@/api/contactApi';

interface ContactCardProps {
  contact: ContactDto;
  onView: (contact: ContactDto) => void;
  onEdit: (contact: ContactDto) => void;
  onDelete: (contactId: string) => void;
  onVideoCall?: (contact: ContactDto) => void;
}

const ContactCard = ({ contact, onView, onEdit, onDelete, onVideoCall }: ContactCardProps) => (
  <Card className="border-border/60 hover:border-border transition-colors">
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {contact.avatarUrl ? (
              <img
                src={contact.avatarUrl}
                alt={contact.name}
                className="h-12 w-12 rounded-full object-cover border border-border/60"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {contact.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Main Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium truncate max-w-[200px]">{contact.name}</h3>
              {!!contact.organization && (
                <Badge variant="secondary" className="text-2xs">
                  {contact.organization}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              {contact.email && (
                <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                  <Mail className="h-3 w-3" />
                  <a href={`mailto:${contact.email}`} className="hover:underline truncate">{contact.email}</a>
                </span>
              )}
              {contact.phone && (
                <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                  <Phone className="h-3 w-3" />
                  <a href={`tel:${contact.phone}`} className="hover:underline truncate">{contact.phone}</a>
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button aria-label="View contact" title="View" variant="ghost" size="icon" onClick={() => onView(contact)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button aria-label="Edit contact" title="Edit" variant="ghost" size="icon" onClick={() => onEdit(contact)}>
            <Edit className="h-4 w-4" />
          </Button>
          {onVideoCall && (
            <Button aria-label="Start video call" title="Video call" variant="ghost" size="icon" onClick={() => onVideoCall(contact)}>
              <Video className="h-4 w-4" />
            </Button>
          )}
          <Button aria-label="Delete contact" title="Delete" variant="ghost" size="icon" onClick={() => onDelete(contact.id)} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ContactCard;
