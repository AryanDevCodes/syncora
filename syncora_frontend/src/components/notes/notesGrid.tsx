import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { getConsistentBgColor } from '@/utils/colors';
import NotesModal from '@/components/modals/notesModal'; 

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface NotesGridProps {
  notes: Note[];
  onAddNote: (note: Partial<Note>) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const NotesGrid: React.FC<NotesGridProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedNote(null);
    setModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Notes</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => handleNoteClick(note)}
            className="cursor-pointer backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-md p-5 transition-all hover:shadow-lg"
            style={{ backgroundColor: getConsistentBgColor(note.id, 0.25) }}
          >
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 truncate">{note.title}</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{note.content}</p>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Updated {new Date(note.updatedAt).toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No notes yet</p>
          <button
            onClick={handleAddNew}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Create your first note
          </button>
        </div>
      )}

      {/* Modal */}
      <NotesModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        note={selectedNote}
        onSave={(data) => {
          if (selectedNote) onUpdateNote({ ...selectedNote, ...data });
          else onAddNote(data);
          setModalOpen(false);
        }}
        onDelete={(id) => {
          onDeleteNote(id);
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default NotesGrid;
