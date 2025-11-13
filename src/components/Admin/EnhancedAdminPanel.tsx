/**
 * Enhanced Admin Panel Wrapper
 * Integrates advanced filtering, batch operations, moderation tools, and analytics
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, Filter, CheckSquare, Eye, Settings } from 'lucide-react';
import AdvancedFilters, { FilterCriteria, SavedFilter } from './AdvancedFilters';
import BatchOperations, { SelectableItem } from './BatchOperations';
import ModerationTools from './ModerationTools';
import AnalyticsOverview from './AnalyticsOverview';
import { applyFilters } from '../../utils/adminFilterUtils';
import { SubmissionWithType } from '../AdminPanel';
import { updateSubmissionStatus } from '../../utils/adminHelpers';

interface EnhancedAdminPanelProps {
  submissions: SubmissionWithType[];
  onSubmissionsUpdate: (submissions: SubmissionWithType[]) => void;
  onUpdateSubmissionStatus: (
    submissionId: string,
    type: 'project' | 'event',
    status: 'approved' | 'rejected',
    comments?: string,
    reason?: string
  ) => Promise<void>;
  currentUser?: { uid: string; email?: string | null };
  activeSection?: 'submissions' | 'analytics' | 'moderation';
}

const EnhancedAdminPanel: React.FC<EnhancedAdminPanelProps> = ({
  submissions,
  onSubmissionsUpdate,
  onUpdateSubmissionStatus,
  currentUser,
  activeSection = 'submissions',
}) => {
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    searchQuery: '',
    searchFields: ['title', 'description', 'submitterName', 'submitterEmail'],
    types: [],
    statuses: [],
    categories: [],
    dateRange: { start: '', end: '' },
    locations: [],
    visibility: 'all',
    customFilters: {},
  });
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionWithType[]>(submissions);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [currentSection, setCurrentSection] = useState(activeSection);

  // Apply filters when criteria or submissions change
  useEffect(() => {
    const filtered = applyFilters(submissions, filterCriteria);
    setFilteredSubmissions(filtered);
  }, [submissions, filterCriteria]);

  const handleFilterChange = (criteria: FilterCriteria) => {
    setFilterCriteria(criteria);
  };

  const handleSaveFilter = (filter: Omit<SavedFilter, 'id' | 'createdAt'>) => {
    const newFilter: SavedFilter = {
      ...filter,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setSavedFilters([...savedFilters, newFilter]);
    // In production, save to Firestore
  };

  const handleDeleteFilter = (filterId: string) => {
    setSavedFilters(savedFilters.filter((f) => f.id !== filterId));
    // In production, delete from Firestore
  };

  const handleExport = (criteria: FilterCriteria) => {
    const filtered = applyFilters(submissions, criteria);
    // Export logic would go here
    console.log('Exporting', filtered.length, 'items');
  };

  const handleItemsUpdate = (updatedItems: SelectableItem[]) => {
    onSubmissionsUpdate(updatedItems as SubmissionWithType[]);
  };

  const handleApprove = async (comments?: string) => {
    if (selectedItems.length === 0) return;
    // Handle approval for selected items
    for (const itemId of selectedItems) {
      const item = submissions.find((s) => s.id === itemId);
      if (item) {
        await onUpdateSubmissionStatus(itemId, item.submissionType, 'approved', comments);
      }
    }
    setSelectedItems([]);
  };

  const handleReject = async (reason: string, comments?: string) => {
    if (selectedItems.length === 0) return;
    // Handle rejection for selected items
    for (const itemId of selectedItems) {
      const item = submissions.find((s) => s.id === itemId);
      if (item) {
        await onUpdateSubmissionStatus(itemId, item.submissionType, 'rejected', comments, reason);
      }
    }
    setSelectedItems([]);
  };

  const selectableItems: SelectableItem[] = filteredSubmissions.map((submission) => ({
    id: submission.id,
    type: submission.submissionType,
    ...submission,
  }));

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex items-center space-x-2 border-b border-vibrant-orange/30">
        <button
          onClick={() => setCurrentSection('submissions')}
          className={`px-4 py-2 rounded-t-luxury transition-colors ${
            currentSection === 'submissions'
              ? 'bg-vibrant-orange text-white'
              : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
          }`}
        >
          <Filter className="w-4 h-4 inline mr-2" />
          Submissions
        </button>
        <button
          onClick={() => setCurrentSection('analytics')}
          className={`px-4 py-2 rounded-t-luxury transition-colors ${
            currentSection === 'analytics'
              ? 'bg-vibrant-orange text-white'
              : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
        <button
          onClick={() => setCurrentSection('moderation')}
          className={`px-4 py-2 rounded-t-luxury transition-colors ${
            currentSection === 'moderation'
              ? 'bg-vibrant-orange text-white'
              : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Moderation
        </button>
      </div>

      {/* Submissions Section */}
      {currentSection === 'submissions' && (
        <div className="space-y-4">
          <AdvancedFilters
            onFilterChange={handleFilterChange}
            onExport={handleExport}
            savedFilters={savedFilters}
            onSaveFilter={handleSaveFilter}
            onDeleteFilter={handleDeleteFilter}
          />

          <BatchOperations
            items={selectableItems}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onItemsUpdate={handleItemsUpdate}
            currentUser={currentUser}
          />

          <div className="text-cream-elegant/80 text-sm">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {currentSection === 'analytics' && (
        <AnalyticsOverview />
      )}

      {/* Moderation Section */}
      {currentSection === 'moderation' && selectedItems.length === 1 && (
        <div>
          {(() => {
            const item = submissions.find((s) => s.id === selectedItems[0]);
            if (!item) return null;
            return (
              <ModerationTools
                item={item as any}
                onApprove={async (comments) => {
                  await onUpdateSubmissionStatus(item.id, item.submissionType, 'approved', comments);
                  setSelectedItems([]);
                }}
                onReject={async (reason, comments) => {
                  await onUpdateSubmissionStatus(item.id, item.submissionType, 'rejected', comments, reason);
                  setSelectedItems([]);
                }}
                currentUser={currentUser}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminPanel;

