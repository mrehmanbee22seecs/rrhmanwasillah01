import React, { useState } from 'react';
import { FileText, Plus, Trash2, Edit2, Save, X, Calendar } from 'lucide-react';

export interface Note {
  id: string;
  title: string;
  content: string;
  projectId?: string;
  projectTitle?: string;
  createdAt: any;
  updatedAt?: any;
}

interface PersonalNotesProps {
  notes: Note[];
  onAddNote?: (title: string, content: string, projectId?: string) => void;
  onUpdateNote?: (noteId: string, title: string, content: string) => void;
  onDeleteNote?: (noteId: string) => void;
  projectId?: string;
  projectTitle?: string;
  themeColor?: string;
}

const PersonalNotes: React.FC<PersonalNotesProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  projectId,
  projectTitle,
  themeColor = '#FF6B35'
}) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');

  const handleAddNote = () => {
    if (newNoteTitle.trim() && newNoteContent.trim() && onAddNote) {
      onAddNote(newNoteTitle.trim(), newNoteContent.trim(), projectId);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsAddingNote(false);
    }
  };

  const handleUpdateNote = (noteId: string) => {
    if (editingTitle.trim() && editingContent.trim() && onUpdateNote) {
      onUpdateNote(noteId, editingTitle.trim(), editingContent.trim());
      setEditingNoteId(null);
      setEditingTitle('');
      setEditingContent('');
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingTitle('');
    setEditingContent('');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-logo-navy/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-logo-navy flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: themeColor }} />
            Personal Notes
          </h3>
          {projectTitle && (
            <p className="text-sm text-gray-600 mt-1">{projectTitle}</p>
          )}
        </div>
        {onAddNote && !isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: themeColor }}
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        )}
      </div>

      {/* Add note form */}
      {isAddingNote && (
        <div className="mb-4 p-4 border-2 rounded-lg" style={{ borderColor: themeColor }}>
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full px-3 py-2 mb-3 border-2 border-gray-200 rounded-lg focus:border-vibrant-orange focus:outline-none font-semibold"
            autoFocus
          />
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write your note here..."
            rows={4}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-vibrant-orange focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setIsAddingNote(false);
                setNewNoteTitle('');
                setNewNoteContent('');
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: themeColor }}
              disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
            >
              <Save className="w-4 h-4" />
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No notes yet. Create your first note!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors group"
            >
              {editingNoteId === note.id ? (
                <div>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full px-3 py-2 mb-3 border-2 border-vibrant-orange rounded-lg focus:outline-none font-semibold"
                    autoFocus
                  />
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-vibrant-orange rounded-lg focus:outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={cancelEditing}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-bold text-logo-navy flex-1">{note.title}</h4>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {onUpdateNote && (
                        <button
                          onClick={() => startEditing(note)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteNote && (
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(note.createdAt)}
                      {note.updatedAt && note.updatedAt !== note.createdAt && ' (edited)'}
                    </div>
                    {note.projectTitle && !projectTitle && (
                      <span className="px-2 py-1 bg-gray-100 rounded">{note.projectTitle}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PersonalNotes;
