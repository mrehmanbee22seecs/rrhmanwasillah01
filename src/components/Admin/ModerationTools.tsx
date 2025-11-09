/**
 * ModerationTools Component
 * Quick review interface and moderation tools
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, FileText, Flag, User, MessageSquare, Save, X } from 'lucide-react';
import { SubmissionStatus } from '../../types/submissions';

export interface ReviewTemplate {
  id: string;
  name: string;
  type: 'approve' | 'reject';
  comments: string;
  conditions?: string[];
}

export interface FlaggedContent {
  id: string;
  type: 'project' | 'event';
  reason: string;
  flaggedBy: string;
  flaggedAt: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

interface ModerationToolsProps {
  item: {
    id: string;
    type: 'project' | 'event';
    title: string;
    description: string;
    status: SubmissionStatus;
    submitterName: string;
    submitterEmail: string;
    [key: string]: any;
  };
  onApprove: (comments?: string) => Promise<void>;
  onReject: (reason: string, comments?: string) => Promise<void>;
  onFlag?: (reason: string, severity: 'low' | 'medium' | 'high') => Promise<void>;
  reviewTemplates?: ReviewTemplate[];
  onSaveTemplate?: (template: Omit<ReviewTemplate, 'id'>) => void;
  currentUser?: { uid: string; email?: string | null };
}

const ModerationTools: React.FC<ModerationToolsProps> = ({
  item,
  onApprove,
  onReject,
  onFlag,
  reviewTemplates = [],
  onSaveTemplate,
  currentUser,
}) => {
  const [showQuickReview, setShowQuickReview] = useState(false);
  const [adminComments, setAdminComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', comments: '', type: 'approve' as 'approve' | 'reject' });
  const [flagReason, setFlagReason] = useState('');
  const [flagSeverity, setFlagSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  const defaultTemplates: ReviewTemplate[] = [
    {
      id: 'approve-1',
      name: 'Standard Approval',
      type: 'approve',
      comments: 'Thank you for your submission. This has been approved and is now live.',
    },
    {
      id: 'reject-1',
      name: 'Incomplete Information',
      type: 'reject',
      comments: 'Your submission lacks sufficient information. Please provide more details and resubmit.',
    },
    {
      id: 'reject-2',
      name: 'Policy Violation',
      type: 'reject',
      comments: 'This submission violates our community guidelines. Please review our policies before resubmitting.',
    },
    {
      id: 'reject-3',
      name: 'Quality Standards',
      type: 'reject',
      comments: 'This submission does not meet our quality standards. Please improve the content and resubmit.',
    },
  ];

  const allTemplates = [...defaultTemplates, ...reviewTemplates];

  const handleTemplateSelect = (template: ReviewTemplate) => {
    setSelectedTemplate(template.id);
    if (template.type === 'approve') {
      setAdminComments(template.comments);
    } else {
      setRejectionReason(template.comments);
      setAdminComments(template.comments);
    }
  };

  const handleQuickApprove = async () => {
    try {
      await onApprove(adminComments || undefined);
      setShowQuickReview(false);
      setAdminComments('');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error approving:', error);
      alert('Error approving submission');
    }
  };

  const handleQuickReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await onReject(rejectionReason, adminComments || undefined);
      setShowQuickReview(false);
      setRejectionReason('');
      setAdminComments('');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Error rejecting submission');
    }
  };

  const handleSaveTemplate = () => {
    if (newTemplate.name.trim() && newTemplate.comments.trim() && onSaveTemplate) {
      onSaveTemplate({
        name: newTemplate.name.trim(),
        type: newTemplate.type,
        comments: newTemplate.comments.trim(),
      });
      setNewTemplate({ name: '', comments: '', type: 'approve' });
      setShowTemplateDialog(false);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim() || !onFlag) return;
    try {
      await onFlag(flagReason, flagSeverity);
      setFlagReason('');
      alert('Content flagged successfully');
    } catch (error) {
      console.error('Error flagging:', error);
      alert('Error flagging content');
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Review Button */}
      {item.status === 'pending' && (
        <button
          onClick={() => setShowQuickReview(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-light transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Quick Review</span>
        </button>
      )}

      {/* Quick Review Modal */}
      {showQuickReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-cream-elegant font-semibold text-lg">Quick Review</h3>
              <button
                onClick={() => {
                  setShowQuickReview(false);
                  setAdminComments('');
                  setRejectionReason('');
                  setSelectedTemplate(null);
                }}
                className="text-cream-elegant/80 hover:text-cream-elegant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Preview */}
            <div className="mb-4 p-4 bg-logo-navy-light rounded-luxury">
              <h4 className="text-cream-elegant font-semibold mb-2">{item.title}</h4>
              <p className="text-cream-elegant/80 text-sm mb-2 line-clamp-3">{item.description}</p>
              <div className="flex items-center space-x-4 text-cream-elegant/60 text-xs">
                <span className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{item.submitterName}</span>
                </span>
                <span>{item.submitterEmail}</span>
              </div>
            </div>

            {/* Review Templates */}
            <div className="mb-4">
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                Review Templates
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {allTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-2 text-left rounded-luxury text-sm transition-colors ${
                      selectedTemplate === template.id
                        ? 'bg-vibrant-orange text-white'
                        : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
                    }`}
                  >
                    <div className="font-semibold">{template.name}</div>
                    <div className="text-xs opacity-80 line-clamp-2">{template.comments}</div>
                  </button>
                ))}
              </div>
              {onSaveTemplate && (
                <button
                  onClick={() => setShowTemplateDialog(true)}
                  className="mt-2 text-vibrant-orange-light text-sm hover:text-vibrant-orange transition-colors"
                >
                  + Save as Template
                </button>
              )}
            </div>

            {/* Admin Comments */}
            <div className="mb-4">
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                Admin Comments (Optional)
              </label>
              <textarea
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Add comments for the submitter..."
                className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange min-h-[100px]"
              />
            </div>

            {/* Rejection Reason (if rejecting) */}
            <div className="mb-4">
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange min-h-[100px]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setShowQuickReview(false);
                  setAdminComments('');
                  setRejectionReason('');
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 text-cream-elegant/80 hover:text-cream-elegant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickReject}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-luxury hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={handleQuickApprove}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-luxury hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Content */}
      {onFlag && (
        <div className="mt-4 p-4 luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30">
          <h4 className="text-cream-elegant font-semibold mb-2 flex items-center space-x-2">
            <Flag className="w-4 h-4" />
            <span>Flag Content</span>
          </h4>
          <textarea
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Reason for flagging..."
            className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange min-h-[80px] mb-2"
          />
          <div className="flex items-center space-x-2 mb-2">
            <label className="text-cream-elegant text-sm">Severity:</label>
            {(['low', 'medium', 'high'] as const).map((severity) => (
              <button
                key={severity}
                onClick={() => setFlagSeverity(severity)}
                className={`px-3 py-1 rounded-luxury text-sm transition-colors ${
                  flagSeverity === severity
                    ? 'bg-vibrant-orange text-white'
                    : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
          <button
            onClick={handleFlag}
            disabled={!flagReason.trim()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-luxury hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Flag Content
          </button>
        </div>
      )}

      {/* Save Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-6 max-w-md w-full mx-4">
            <h3 className="text-cream-elegant font-semibold text-lg mb-4">Save Review Template</h3>
            <input
              type="text"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              placeholder="Template name..."
              className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange mb-2"
            />
            <select
              value={newTemplate.type}
              onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as 'approve' | 'reject' })}
              className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant focus:outline-none focus:border-vibrant-orange mb-2"
            >
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
            <textarea
              value={newTemplate.comments}
              onChange={(e) => setNewTemplate({ ...newTemplate, comments: e.target.value })}
              placeholder="Template comments..."
              className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange min-h-[100px] mb-4"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setShowTemplateDialog(false);
                  setNewTemplate({ name: '', comments: '', type: 'approve' });
                }}
                className="px-4 py-2 text-cream-elegant/80 hover:text-cream-elegant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplate.name.trim() || !newTemplate.comments.trim()}
                className="px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationTools;

