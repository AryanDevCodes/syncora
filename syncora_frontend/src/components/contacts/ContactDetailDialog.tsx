import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Phone, Globe, MapPin, Linkedin, Twitter, Tag, Briefcase, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContactDto } from '@/api/contactApi';

interface ContactDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactDto | null;
  formatDate: (dateString: string) => string;
}

const ContactDetailDialog = ({ open, onOpenChange, contact, formatDate }: ContactDetailDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Contact Details</DialogTitle>
      </DialogHeader>
      {contact && (
        <div className="space-y-6">
          {/* Header with Avatar and Basic Info */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {contact.avatarUrl ? (
                <img src={contact.avatarUrl} alt={contact.name} className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-white font-bold text-2xl">{contact.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {contact.nickname ? `${contact.name} (${contact.nickname})` : contact.name}
              </h2>
              <p className="text-lg text-gray-600">{contact.organization}</p>
              {contact.position && <p className="text-md text-gray-500">{contact.position}</p>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                    {contact.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className={contact.secondaryPhone ? "text-gray-600" : "text-gray-400 italic"}>
                    {contact.secondaryPhone || "Not provided"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  {contact.website ? (
                    <a
                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {contact.website}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Not provided</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className={contact.address ? "text-gray-600" : "text-gray-400 italic"}>
                    {contact.address || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Linkedin className="h-4 w-4 text-gray-400" />
                {contact.linkedinUrl ? (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Twitter className="h-4 w-4 text-gray-400" />
                {contact.twitterHandle ? (
                  <a
                    href={`https://twitter.com/${contact.twitterHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @{contact.twitterHandle.replace('@', '')}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className={contact.department ? "text-gray-600" : "text-gray-400 italic"}>
                    Department: {contact.department || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className={contact.managerName ? "text-gray-600" : "text-gray-400 italic"}>
                    Manager: {contact.managerName || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className={contact.employeeId ? "text-gray-600" : "text-gray-400 italic"}>
                    Employee ID: {contact.employeeId || "Not provided"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className={contact.industry ? "text-gray-600" : "text-gray-400 italic"}>
                    Industry: {contact.industry || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className={contact.startDate ? "text-gray-600" : "text-gray-400 italic"}>
                    Start Date: {contact.startDate ? formatDate(contact.startDate) : "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎂</span>
                  <span className={contact.birthday ? "text-gray-600" : "text-gray-400 italic"}>
                    Birthday: {contact.birthday ? formatDate(contact.birthday) : "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💍</span>
                  <span className={contact.anniversary ? "text-gray-600" : "text-gray-400 italic"}>
                    Anniversary: {contact.anniversary ? formatDate(contact.anniversary) : "Not provided"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">👤</span>
                  <span className={contact.nickname ? "text-gray-600" : "text-gray-400 italic"}>
                    Nickname: {contact.nickname || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {contact.tags.split(',').map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.note && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-200">
                <p className="text-gray-700 whitespace-pre-wrap">{contact.note}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-4">
            <div className="text-sm text-gray-500 space-y-1">
              <p>Created: {formatDate(contact.createdAt)}</p>
              {contact.updatedAt !== contact.createdAt && (
                <p>Last Updated: {formatDate(contact.updatedAt)}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default ContactDetailDialog;
