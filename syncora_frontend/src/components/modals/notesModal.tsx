import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Save, X } from 'lucide-react';

interface Note {
  id?: string;
  title: string;
  content: string;
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onSave: (note: Partial<Note>) => void;
  onDelete?: (id: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, note, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ id: note?.id, title, content });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card/90 backdrop-blur-md border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {note ? 'Edit Note' : 'Create New Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium"
          />
          <Textarea
            placeholder="Write your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        <div className="flex justify-between pt-4">
          {note?.id && onDelete && (
            <Button variant="destructive" onClick={() => onDelete(note.id!)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesModal;
