import axiosInstance from '@/lib/axios';

const BASE_URL = '/notes';

export interface NoteDTO {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color?: string;
  starred: boolean;
  archived: boolean;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content?: string;
  tags?: string[];
  color?: string;
  starred?: boolean;
  archived?: boolean;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
  color?: string;
  starred?: boolean;
  archived?: boolean;
}

// Get all notes
export const getAllNotes = async (): Promise<NoteDTO[]> => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data.data;
};

// Get active (non-archived) notes
export const getActiveNotes = async (): Promise<NoteDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/active`);
  return response.data.data;
};

// Get starred notes
export const getStarredNotes = async (): Promise<NoteDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/starred`);
  return response.data.data;
};

// Get archived notes
export const getArchivedNotes = async (): Promise<NoteDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/archived`);
  return response.data.data;
};

// Get note by ID
export const getNoteById = async (id: string): Promise<NoteDTO> => {
  const response = await axiosInstance.get(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Create a new note
export const createNote = async (note: CreateNoteRequest): Promise<NoteDTO> => {
  const response = await axiosInstance.post(BASE_URL, note);
  const created: NoteDTO = response.data.data;
  try {
    window.dispatchEvent(new CustomEvent('notes:changed', { detail: { action: 'created', note: created } }));
  } catch {}
  return created;
};

// Update a note
export const updateNote = async (id: string, note: UpdateNoteRequest): Promise<NoteDTO> => {
  const response = await axiosInstance.put(`${BASE_URL}/${id}`, note);
  const updated: NoteDTO = response.data.data;
  try {
    window.dispatchEvent(new CustomEvent('notes:changed', { detail: { action: 'updated', note: updated } }));
  } catch {}
  return updated;
};

// Delete a note
export const deleteNote = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
  try {
    window.dispatchEvent(new CustomEvent('notes:changed', { detail: { action: 'deleted', note: { id } } }));
  } catch {}
};

// Search notes
export const searchNotes = async (query: string): Promise<NoteDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/search`, {
    params: { query }
  });
  return response.data.data;
};

// Get notes by tags
export const getNotesByTags = async (tags: string[]): Promise<NoteDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/tags`, {
    params: { tags }
  });
  return response.data.data;
};

// Toggle star status
export const toggleStar = async (id: string): Promise<NoteDTO> => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/star`);
  return response.data.data;
};

// Toggle archive status
export const toggleArchive = async (id: string): Promise<NoteDTO> => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/archive`);
  return response.data.data;
};

// Get notes count
export const getNotesCount = async (): Promise<number> => {
  const response = await axiosInstance.get(`${BASE_URL}/count`);
  return response.data.data;
};

export const notesApi = {
  getAllNotes,
  getActiveNotes,
  getStarredNotes,
  getArchivedNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  getNotesByTags,
  toggleStar,
  toggleArchive,
  getNotesCount,
};
