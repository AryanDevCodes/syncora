
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import NotesModal from '@/components/modals/notesModal';
import { getConsistentBgColor } from '@/utils/colors';
import { notesApi, NoteDTO } from '@/api/notesApi';


const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteDTO | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notes from backend
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const backendNotes = await notesApi.getAllNotes();
        setNotes(backendNotes);
      } catch (e) {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
    // Listen for notes:changed events to refresh
    const onNotesChanged = () => fetchNotes();
    window.addEventListener('notes:changed', onNotesChanged);
    return () => window.removeEventListener('notes:changed', onNotesChanged);
  }, []);

  const handleAddNote = async (data: Partial<NoteDTO>) => {
    try {
      setLoading(true);
      await notesApi.createNote({
        title: data.title || '',
        content: data.content || '',
      });
      // notes:changed event will trigger refresh
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (data: Partial<NoteDTO>) => {
    if (!data.id) return;
    try {
      setLoading(true);
      await notesApi.updateNote(data.id, {
        title: data.title,
        content: data.content,
      });
      // notes:changed event will trigger refresh
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      setLoading(true);
      await notesApi.deleteNote(id);
      // notes:changed event will trigger refresh
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (note?: NoteDTO) => {
    setSelectedNote(note || null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Notes
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" /> Add Note
        </button>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-500">Loading notes...</div>
      ) : notes.length > 0 ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => handleOpenModal(note)}
              className="cursor-pointer p-5 rounded-2xl border border-border shadow-md hover:shadow-xl transition-all backdrop-blur-sm"
              style={{ backgroundColor: getConsistentBgColor(note.id, 0.25) }}
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white truncate">
                {note.title || 'Untitled Note'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                {note.content || 'No content'}
              </p>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {new Date(note.updatedAt).toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
          <p className="text-lg mb-2">No notes yet</p>
          <button
            onClick={() => handleOpenModal()}
            className="text-blue-600 font-semibold hover:underline"
          >
            Create your first note
          </button>
        </div>
      )}

      {/* Modal */}
      <NotesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        note={selectedNote}
        onSave={async (data) => {
          if (selectedNote) {
            await handleUpdateNote({ ...selectedNote, ...data });
          } else {
            await handleAddNote(data);
          }
          setModalOpen(false);
        }}
        onDelete={async (id) => {
          await handleDeleteNote(id);
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default NotesPage;
