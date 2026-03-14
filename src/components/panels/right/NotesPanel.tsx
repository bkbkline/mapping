'use client';

import { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { useMapStore } from '@/store/mapStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit3, Check, X } from 'lucide-react';

export default function NotesPanel() {
  const { selectedFeatureId } = useMapStore();
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes(selectedFeatureId || undefined);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleCreate = () => {
    if (!newContent.trim() || !selectedFeatureId) return;
    createNote.mutate({ content: newContent.trim(), parcel_id: selectedFeatureId });
    setNewContent('');
  };

  const handleUpdate = (id: string) => {
    if (!editContent.trim()) return;
    updateNote.mutate({ id, content: editContent.trim() });
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      {!selectedFeatureId && (
        <p className="text-sm text-gray-400">Select a parcel to view notes.</p>
      )}

      {selectedFeatureId && (
        <>
          {/* Add note form */}
          <div className="space-y-2">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Add a note..."
              className="bg-white/5 border-white/10 text-white text-sm min-h-[80px] placeholder:text-gray-500"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newContent.trim()}
              className="h-7 text-xs"
            >
              Add Note
            </Button>
          </div>

          {loading && <p className="text-xs text-gray-500">Loading...</p>}

          {/* Notes list */}
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="rounded-md bg-white/5 p-3 group">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-sm min-h-[60px]"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => handleUpdate(note.id)}>
                        <Check className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-gray-400"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-500">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-white"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-red-400"
                          onClick={() => deleteNote.mutate(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
