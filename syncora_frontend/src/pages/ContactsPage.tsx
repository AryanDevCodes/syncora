import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { contactApi, ContactDto, ContactCreateRequest, ContactUpdateRequest } from '@/api/contactApi';
import Loader from '@/components/layout/Loader';
import ContactCard from '@/components/contacts/ContactCard';
import ContactDetailDialog from '@/components/contacts/ContactDetailDialog';
import AddContactDialog from '@/components/contacts/AddContactDialog';
import { useAuth } from '@/contexts/AuthContext';

const ContactsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactDto | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDetailContact, setSelectedDetailContact] = useState<ContactDto | null>(null);
  const [formData, setFormData] = useState<ContactCreateRequest>({
    name: '',
    email: '',
    phone: '',
    organization: '',
    note: '',
    avatarUrl: '',
    position: '',
    address: '',
    website: '',
    secondaryPhone: '',
    linkedinUrl: '',
    twitterHandle: '',
    tags: '',
    department: '',
    managerName: '',
    employeeId: '',
    startDate: '',
    industry: '',
    birthday: '',
    anniversary: '',
    nickname: '',
  });
  const [editFormData, setEditFormData] = useState<ContactCreateRequest>({
    name: '',
    email: '',
    phone: '',
    organization: '',
    note: '',
    avatarUrl: '',
    position: '',
    address: '',
    website: '',
    secondaryPhone: '',
    linkedinUrl: '',
    twitterHandle: '',
    tags: '',
    department: '',
    managerName: '',
    employeeId: '',
    startDate: '',
    industry: '',
    birthday: '',
    anniversary: '',
    nickname: '',
  });
  const { toast } = useToast();

  // Video call loading state
  const [isCalling, setIsCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  // Start video call with a contact
  const handleVideoCall = async (contact: ContactDto) => {
    try {
      setIsCalling(true);
      setCallError(null);
      const selfEmail = user?.email || '';
      const otherEmail = contact.email || contact.id || '';
      const roomId = `vc_${[selfEmail, otherEmail]
        .map(v => (v || '').toLowerCase())
        .sort()
        .join('_')
        .replace(/[^a-z0-9]/g, '')}`;

      toast({ title: 'Starting video call', description: `Room: ${roomId}` });
      navigate(`/video?roomId=${roomId}`);
    } catch (err: any) {
      console.error('Failed to start video call:', err);
      setCallError(err?.message || 'Failed to start video call');
      toast({ title: 'Video Call Failed', description: 'Could not start the call.', variant: 'destructive' });
    } finally {
      setIsCalling(false);
    }
  };

  // Load contacts on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Filter contacts based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm)
      );
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const data = await contactApi.getAllContacts();
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      await contactApi.createContact(formData);
      toast({
        title: 'Success',
        description: 'Contact created successfully!',
      });
      setIsCreateDialogOpen(false);
      resetForm();
      loadContacts();
    } catch (error) {
      console.error('Failed to create contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to create contact. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;

    try {
      const updateData: ContactUpdateRequest = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        organization: editFormData.organization,
        note: editFormData.note,
        avatarUrl: editFormData.avatarUrl,
        position: editFormData.position,
        address: editFormData.address,
        website: editFormData.website,
        secondaryPhone: editFormData.secondaryPhone,
        linkedinUrl: editFormData.linkedinUrl,
        twitterHandle: editFormData.twitterHandle,
        tags: editFormData.tags,
        department: editFormData.department,
        managerName: editFormData.managerName,
        employeeId: editFormData.employeeId,
        startDate: editFormData.startDate,
        industry: editFormData.industry,
        birthday: editFormData.birthday,
        anniversary: editFormData.anniversary,
        nickname: editFormData.nickname,
      };

      await contactApi.updateContact(selectedContact.id, updateData);
      toast({
        title: 'Success',
        description: 'Contact updated successfully!',
      });
      setIsEditDialogOpen(false);
      setSelectedContact(null);
      resetForm();
      loadContacts();
    } catch (error) {
      console.error('Failed to update contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await contactApi.deleteContact(contactId);
      toast({
        title: 'Success',
        description: 'Contact deleted successfully!',
      });
      loadContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (contact: ContactDto) => {
    setSelectedContact(contact);
    setEditFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      organization: contact.organization,
      note: contact.note || '',
      avatarUrl: contact.avatarUrl || '',
      position: contact.position || '',
      address: contact.address || '',
      website: contact.website || '',
      secondaryPhone: contact.secondaryPhone || '',
      linkedinUrl: contact.linkedinUrl || '',
      twitterHandle: contact.twitterHandle || '',
      tags: contact.tags || '',
      department: contact.department || '',
      managerName: contact.managerName || '',
      employeeId: contact.employeeId || '',
      startDate: contact.startDate || '',
      industry: contact.industry || '',
      birthday: contact.birthday || '',
      anniversary: contact.anniversary || '',
      nickname: contact.nickname || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDetailDialog = (contact: ContactDto) => {
    setSelectedDetailContact(contact);
    setIsDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      organization: '',
      note: '',
      avatarUrl: '',
      position: '',
      address: '',
      website: '',
      secondaryPhone: '',
      linkedinUrl: '',
      twitterHandle: '',
      tags: '',
      department: '',
      managerName: '',
      employeeId: '',
      startDate: '',
      industry: '',
      birthday: '',
      anniversary: '',
      nickname: '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        </div>
        <AddContactDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          formData={formData}
          setFormData={setFormData}
          onCreate={handleCreateContact}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search contacts by name, email, organization, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Building className="h-12 w-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No contacts found' : 'No contacts yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first contact.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Contact
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onView={openDetailDialog}
              onEdit={openEditDialog}
              onDelete={handleDeleteContact}
              onVideoCall={handleVideoCall}
            />
          ))}
        </div>
      )}

      <ContactDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        contact={selectedDetailContact}
        formatDate={formatDate}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-organization">Organization *</Label>
                <Input
                  id="edit-organization"
                  value={editFormData.organization}
                  onChange={(e) => setEditFormData({ ...editFormData, organization: e.target.value })}
                  placeholder="Company name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  value={editFormData.position || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                  placeholder="Job title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-secondaryPhone">Secondary Phone</Label>
                <Input
                  id="edit-secondaryPhone"
                  value={editFormData.secondaryPhone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, secondaryPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address || ''}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="Street address, city, state, zip"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={editFormData.website || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  placeholder="company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="edit-linkedinUrl"
                  value={editFormData.linkedinUrl || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-twitterHandle">Twitter Handle</Label>
                <Input
                  id="edit-twitterHandle"
                  value={editFormData.twitterHandle || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, twitterHandle: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags</Label>
                <Input
                  id="edit-tags"
                  value={editFormData.tags || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                  placeholder="client, vendor, colleague (comma-separated)"
                />
              </div>
            </div>

            {/* Professional Details */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Professional Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={editFormData.department || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    placeholder="Engineering, Sales, Marketing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-managerName">Manager Name</Label>
                  <Input
                    id="edit-managerName"
                    value={editFormData.managerName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, managerName: e.target.value })}
                    placeholder="Direct supervisor"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-employeeId">Employee ID</Label>
                  <Input
                    id="edit-employeeId"
                    value={editFormData.employeeId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                    placeholder="Company employee ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-industry">Industry</Label>
                  <Input
                    id="edit-industry"
                    value={editFormData.industry || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                    placeholder="Tech, Finance, Healthcare"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editFormData.startDate || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-birthday">Birthday</Label>
                  <Input
                    id="edit-birthday"
                    type="date"
                    value={editFormData.birthday || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, birthday: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-anniversary">Anniversary</Label>
                  <Input
                    id="edit-anniversary"
                    type="date"
                    value={editFormData.anniversary || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, anniversary: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nickname">Nickname</Label>
                <Input
                  id="edit-nickname"
                  value={editFormData.nickname || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                  placeholder="Preferred name to be called"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-avatarUrl">Avatar URL</Label>
              <Input
                id="edit-avatarUrl"
                value={editFormData.avatarUrl}
                onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">Notes</Label>
              <Textarea
                id="edit-note"
                value={editFormData.note}
                onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                placeholder="Additional notes about this contact..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditContact} disabled={!editFormData.name || !editFormData.email || !editFormData.phone || !editFormData.organization}>
                Update Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsPage;