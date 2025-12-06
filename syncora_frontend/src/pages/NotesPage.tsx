import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import NotesModal from '@/components/modals/notesModal';
import { getConsistentBgColor } from '@/utils/colors';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch notes (mock)
  useEffect(() => {
    const stored = localStorage.getItem('notes');
    if (stored) setNotes(JSON.parse(stored));
  }, []);

  const persistNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem('notes', JSON.stringify(updated));
  };

  const handleAddNote = (data: Partial<Note>) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: data.title || '',
      content: data.content || '',
      updatedAt: new Date().toISOString(),
    };
    persistNotes([newNote, ...notes]);
  };

  const handleUpdateNote = (data: Partial<Note>) => {
    const updated = notes.map((n) =>
      n.id === data.id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
    );
    persistNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    persistNotes(updated);
  };

  const handleOpenModal = (note?: Note) => {
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
      {notes.length > 0 ? (
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
        onSave={(data) => {
          selectedNote ? handleUpdateNote(data) : handleAddNote(data);
          setModalOpen(false);
        }}
        onDelete={(id) => {
          handleDeleteNote(id);
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default NotesPage;
