import axiosInstance from '@/lib/axios';

const BASE_URL = '/contacts';

export interface ContactDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  position?: string;
  address?: string;
  website?: string;
  secondaryPhone?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  tags?: string;
  department?: string;
  managerName?: string;
  employeeId?: string;
  startDate?: string;
  industry?: string;
  birthday?: string;
  anniversary?: string;
  nickname?: string;
  avatarUrl?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreateRequest {
  name: string;
  email: string;
  phone: string;
  organization: string;
  position?: string;
  address?: string;
  website?: string;
  secondaryPhone?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  tags?: string;
  department?: string;
  managerName?: string;
  employeeId?: string;
  startDate?: string;
  industry?: string;
  birthday?: string;
  anniversary?: string;
  nickname?: string;
  note?: string;
  avatarUrl?: string;
}

export interface ContactUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  position?: string;
  address?: string;
  website?: string;
  secondaryPhone?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  tags?: string;
  department?: string;
  managerName?: string;
  employeeId?: string;
  startDate?: string;
  industry?: string;
  birthday?: string;
  anniversary?: string;
  nickname?: string;
  note?: string;
  avatarUrl?: string;
}

// Get all contacts
export const getAllContacts = async (): Promise<ContactDto[]> => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data.data;
};

// Get contact by ID
export const getContactById = async (id: string): Promise<ContactDto> => {
  const response = await axiosInstance.get(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Create a new contact
export const createContact = async (contact: ContactCreateRequest): Promise<ContactDto> => {
  const response = await axiosInstance.post(BASE_URL, contact);
  return response.data.data;
};

// Update a contact
export const updateContact = async (id: string, contact: ContactUpdateRequest): Promise<ContactDto> => {
  const response = await axiosInstance.put(`${BASE_URL}/${id}`, contact);
  return response.data.data;
};

// Delete a contact
export const deleteContact = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
};

export const contactApi = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};