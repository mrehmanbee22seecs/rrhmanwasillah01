/**
 * BatchOperations Component
 * Multi-select and bulk operations for submissions
 */

import React, { useState } from 'react';
import { CheckSquare, Square, CheckCircle, XCircle, Trash2, Download, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { SubmissionStatus } from '../../types/submissions';
import { sendProjectUpdateNotification } from '../../utils/notificationHelpers';
import * as XLSX from 'xlsx';

export interface SelectableItem {
  id: string;
  type: 'project' | 'event';
  [key: string]: any;
}

interface BatchOperationsProps {
  items: SelectableItem[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onItemsUpdate: (updatedItems: SelectableItem[]) => void;
  currentUser?: { uid: string; email?: string | null };
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  items,
  selectedItems,
  onSelectionChange,
  onItemsUpdate,
  currentUser,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);

  const selectedCount = selectedItems.length;
  const selectedItemsData = items.filter((item) => selectedItems.includes(item.id));

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map((item) => item.id));
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const confirmActionWrapper = (action: () => Promise<void>, operationName: string) => {
    setOperation(operationName);
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };

  const executeBatchOperation = async (
    operation: (item: SelectableItem) => Promise<void>,
    operationName: string
  ) => {
    if (selectedCount === 0) {
      alert('Please select at least one item');
      return;
    }

    setIsProcessing(true);
    try {
      // Firestore batch limit is 500 operations
      // Split into batches if needed
      const batchSize = 500;
      const batches: SelectableItem[][] = [];
      for (let i = 0; i < selectedItemsData.length; i += batchSize) {
        batches.push(selectedItemsData.slice(i, i + batchSize));
      }

      let successCount = 0;
      let errorCount = 0;
      const updatedItems: SelectableItem[] = [];

      for (const batchItems of batches) {
        const batch = writeBatch(db);
        
        for (const item of batchItems) {
          try {
            const collectionName = item.type === 'project' ? 'project_submissions' : 'event_submissions';
            const itemRef = doc(db, collectionName, item.id);
            const updatedItem = { ...item };
            
            if (operationName === 'approve') {
              updatedItem.status = 'approved';
              updatedItem.isVisible = true;
              batch.update(itemRef, {
                status: 'approved',
                isVisible: true,
                reviewedAt: serverTimestamp(),
                reviewedBy: currentUser?.uid,
                updatedAt: serverTimestamp(),
              });
            } else if (operationName === 'reject') {
              updatedItem.status = 'rejected';
              updatedItem.isVisible = false;
              batch.update(itemRef, {
                status: 'rejected',
                isVisible: false,
                reviewedAt: serverTimestamp(),
                reviewedBy: currentUser?.uid,
                updatedAt: serverTimestamp(),
              });
            } else if (operationName === 'delete') {
              batch.delete(itemRef);
            } else if (operationName === 'show') {
              updatedItem.isVisible = true;
              batch.update(itemRef, { 
                isVisible: true,
                updatedAt: serverTimestamp(),
              });
            } else if (operationName === 'hide') {
              updatedItem.isVisible = false;
              batch.update(itemRef, { 
                isVisible: false,
                updatedAt: serverTimestamp(),
              });
            }

            if (operationName !== 'delete') {
              updatedItems.push(updatedItem);
            }
            successCount++;
          } catch (error) {
            console.error(`Error processing item ${item.id}:`, error);
            errorCount++;
          }
        }

        await batch.commit();
      }

      // Send notifications for approve/reject
      if (operationName === 'approve') {
        for (const item of selectedItemsData) {
          try {
            if (item.type === 'project') {
              await sendProjectUpdateNotification({
                projectId: item.id,
                projectName: item.title || 'Project',
                updateType: 'approved',
                userId: item.submittedBy || '',
                link: `/projects/${item.id}`,
              });
            }
            // Add event notification if needed
          } catch (error) {
            console.error('Error sending notification:', error);
            // Don't fail batch operation if notification fails
          }
        }
      }

      // Update local state
      if (operationName === 'delete') {
        onItemsUpdate(items.filter((item) => !selectedItems.includes(item.id)));
      } else {
        const updatedItemsMap = new Map(updatedItems.map((item) => [item.id, item]));
        onItemsUpdate(
          items.map((item) => updatedItemsMap.get(item.id) || item)
        );
      }

      onSelectionChange([]);
      alert(`${operationName} completed: ${successCount} succeeded, ${errorCount} failed`);
    } catch (error) {
      console.error(`Error in batch ${operationName}:`, error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setOperation(null);
      setConfirmAction(null);
    }
  };

  const handleBatchApprove = () => {
    confirmActionWrapper(
      async () => {
        await executeBatchOperation(async (item) => {
          // Approval logic is in executeBatchOperation
        }, 'approve');
      },
      `approve ${selectedCount} item(s)`
    );
  };

  const handleBatchReject = () => {
    confirmActionWrapper(
      async () => {
        await executeBatchOperation(async (item) => {
          // Rejection logic is in executeBatchOperation
        }, 'reject');
      },
      `reject ${selectedCount} item(s)`
    );
  };

  const handleBatchDelete = () => {
    confirmActionWrapper(
      async () => {
        await executeBatchOperation(async (item) => {
          // Deletion logic is in executeBatchOperation
        }, 'delete');
      },
      `delete ${selectedCount} item(s)`
    );
  };

  const handleBatchShow = () => {
    confirmActionWrapper(
      async () => {
        await executeBatchOperation(async (item) => {
          // Show logic is in executeBatchOperation
        }, 'show');
      },
      `show ${selectedCount} item(s)`
    );
  };

  const handleBatchHide = () => {
    confirmActionWrapper(
      async () => {
        await executeBatchOperation(async (item) => {
          // Hide logic is in executeBatchOperation
        }, 'hide');
      },
      `hide ${selectedCount} item(s)`
    );
  };

  const handleBatchExport = () => {
    if (selectedCount === 0) {
      alert('Please select at least one item to export');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      const worksheetData = selectedItemsData.map((item) => ({
        Type: item.type === 'project' ? 'Project' : 'Event',
        ID: item.id,
        Title: item.title,
        Status: item.status,
        Visibility: item.isVisible ? 'Visible' : 'Hidden',
        Category: item.category,
        Location: item.location,
        Submitter: item.submitterName,
        'Submitter Email': item.submitterEmail,
        'Submitted At': item.submittedAt?.toDate?.()?.toISOString() || item.submittedAt,
        'Reviewed At': item.reviewedAt?.toDate?.()?.toISOString() || item.reviewedAt,
        'Reviewed By': item.reviewedBy,
        'Admin Comments': item.adminComments || '',
        'Rejection Reason': item.rejectionReason || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
      XLSX.writeFile(workbook, `submissions_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert(`Exported ${selectedCount} item(s) to Excel`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting data');
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between p-4 luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-cream-elegant hover:text-vibrant-orange transition-colors"
          >
            {selectedItems.length === items.length ? (
              <CheckSquare className="w-5 h-5" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span className="text-sm">
              {selectedCount > 0 ? `${selectedCount} selected` : 'Select All'}
            </span>
          </button>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-cream-elegant/80 text-sm mr-2">
              {selectedCount} item(s) selected
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleBatchApprove}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-luxury hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Approve selected"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={handleBatchReject}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-luxury hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Reject selected"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={handleBatchShow}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-luxury hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Show selected"
              >
                <Eye className="w-4 h-4" />
                <span>Show</span>
              </button>
              <button
                onClick={handleBatchHide}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-luxury hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Hide selected"
              >
                <EyeOff className="w-4 h-4" />
                <span>Hide</span>
              </button>
              <button
                onClick={handleBatchExport}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1.5 bg-logo-navy-light text-cream-elegant rounded-luxury hover:bg-logo-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Export selected"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-800 text-white rounded-luxury hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Delete selected"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selection checkbox column - can be used in table */}
      <div className="hidden">
        {/* This is a helper for rendering checkboxes in tables */}
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-6 max-w-md w-full mx-4">
            <h3 className="text-cream-elegant font-semibold text-lg mb-4">
              Confirm Action
            </h3>
            <p className="text-cream-elegant/80 mb-6">
              Are you sure you want to {operation}? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setOperation(null);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 text-cream-elegant/80 hover:text-cream-elegant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessing}
                className="px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchOperations;

