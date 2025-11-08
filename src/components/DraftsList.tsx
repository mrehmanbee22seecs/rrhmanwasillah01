import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Edit3, Trash2, Send, Clock, AlertTriangle } from 'lucide-react';
import { doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProjectSubmission, EventSubmission } from '../types/submissions';

type SubmissionWithType = (ProjectSubmission | EventSubmission) & {
  submissionType: 'project' | 'event';
};

interface DraftsListProps {
  drafts: SubmissionWithType[];
}

const DraftsList: React.FC<DraftsListProps> = ({ drafts }) => {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleEdit = (draft: SubmissionWithType) => {
    navigate(`/create-submission?type=${draft.submissionType}&draft=${draft.id}`);
  };

  const handleDelete = async (draft: SubmissionWithType) => {
    if (!confirm(`Are you sure you want to delete "${draft.title || 'Untitled Draft'}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(draft.id);
    try {
      const collectionName = draft.submissionType === 'project'
        ? 'project_submissions'
        : 'event_submissions';
      await deleteDoc(doc(db, collectionName, draft.id));
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (draft: SubmissionWithType) => {
    if (!confirm(`Submit "${draft.title || 'Untitled Draft'}" for review? Make sure all required information is complete.`)) {
      return;
    }

    setSubmittingId(draft.id);
    try {
      const collectionName = draft.submissionType === 'project'
        ? 'project_submissions'
        : 'event_submissions';
      await updateDoc(doc(db, collectionName, draft.id), {
        status: 'pending',
        submittedAt: serverTimestamp()
      });
      alert('Draft submitted successfully! You will receive an email notification once it has been reviewed.');
    } catch (error) {
      console.error('Error submitting draft:', error);
      alert('Failed to submit draft. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (drafts.length === 0) {
    return null;
  }

  return (
    <div className="luxury-card bg-white p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-luxury-heading text-black">My Drafts</h2>
          <p className="text-sm text-black/70 font-luxury-body mt-1">
            Continue working on your saved drafts or submit them for review
          </p>
        </div>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-luxury-semibold text-black">
          {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {drafts.map((draft) => {
          const isDeleting = deletingId === draft.id;
          const isSubmitting = submittingId === draft.id;

          return (
            <div
              key={draft.id}
              className="p-6 border-2 border-dashed border-gray-300 rounded-luxury hover:border-vibrant-orange transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h4 className="font-luxury-heading text-black text-lg">
                      {draft.title || 'Untitled Draft'}
                    </h4>
                  </div>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-luxury-body">
                    {draft.submissionType.charAt(0).toUpperCase() + draft.submissionType.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(draft)}
                    className="p-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors group"
                    title="Edit draft"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleSubmit(draft)}
                    disabled={isSubmitting}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-luxury transition-colors disabled:opacity-50"
                    title="Submit for review"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(draft)}
                    disabled={isDeleting}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-luxury transition-colors disabled:opacity-50"
                    title="Delete draft"
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {draft.description && (
                <p className="text-sm text-black/70 font-luxury-body mb-3 line-clamp-2">
                  {draft.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-black/60">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Saved {formatDate(draft.submittedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-luxury-body">Not submitted</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleEdit(draft)}
                  className="flex-1 px-4 py-2 border-2 border-vibrant-orange text-vibrant-orange rounded-luxury hover:bg-vibrant-orange/10 transition-colors font-luxury-semibold text-sm"
                >
                  Continue Editing
                </button>
                <button
                  onClick={() => handleSubmit(draft)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors font-luxury-semibold text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DraftsList;
