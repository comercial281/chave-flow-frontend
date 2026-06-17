import api from '@/services/core/api';

export interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  contact_id: string;
  user_id?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NoteFormData {
  content: string;
}

const BASE = '/contacts';

export const notesService = {
  async getByContact(contactId: string): Promise<Note[]> {
    const res = await api.get(`${BASE}/${contactId}/notes`);
    return (res.data as { data: Note[] }).data ?? [];
  },

  async get(contactId: string, noteId: string): Promise<Note> {
    const res = await api.get(`${BASE}/${contactId}/notes/${noteId}`);
    return (res.data as { data: Note }).data;
  },

  async create(contactId: string, data: NoteFormData): Promise<Note> {
    const res = await api.post(`${BASE}/${contactId}/notes`, { note: data });
    return (res.data as { data: Note }).data;
  },

  async update(contactId: string, noteId: string, data: Partial<NoteFormData>): Promise<Note> {
    const res = await api.put(`${BASE}/${contactId}/notes/${noteId}`, { note: data });
    return (res.data as { data: Note }).data;
  },

  async delete(contactId: string, noteId: string): Promise<void> {
    await api.delete(`${BASE}/${contactId}/notes/${noteId}`);
  },
};
