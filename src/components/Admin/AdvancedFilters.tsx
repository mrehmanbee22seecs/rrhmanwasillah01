/**
 * AdvancedFilters Component
 * Multi-criteria filtering and search across all collections
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Save, Trash2, Calendar, Tag, MapPin, User, CheckCircle, XCircle, Clock, Eye, EyeOff, FileText, Download } from 'lucide-react';
import { SubmissionStatus, SubmissionType } from '../../types/submissions';

export interface FilterCriteria {
  // Search
  searchQuery: string;
  searchFields: string[];
  
  // Type filters
  types: SubmissionType[];
  statuses: SubmissionStatus[];
  categories: string[];
  
  // Date filters
  dateRange: {
    start: string;
    end: string;
  };
  submittedAfter?: string;
  submittedBefore?: string;
  
  // Location filters
  locations: string[];
  
  // User filters
  submitterEmail?: string;
  submitterName?: string;
  
  // Visibility
  visibility?: 'all' | 'visible' | 'hidden';
  
  // Custom fields
  customFilters: Record<string, any>;
}

export interface SavedFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
  createdAt: string;
}

interface AdvancedFiltersProps {
  onFilterChange: (criteria: FilterCriteria) => void;
  onExport?: (criteria: FilterCriteria) => void;
  collections?: string[];
  savedFilters?: SavedFilter[];
  onSaveFilter?: (filter: Omit<SavedFilter, 'id' | 'createdAt'>) => void;
  onDeleteFilter?: (filterId: string) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFilterChange,
  onExport,
  collections = ['project_submissions', 'event_submissions'],
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [criteria, setCriteria] = useState<FilterCriteria>({
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

  const statusOptions: { value: SubmissionStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'draft', label: 'Draft', icon: <FileText className="w-4 h-4" /> },
    { value: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
    { value: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
    { value: 'completed', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const typeOptions: { value: SubmissionType; label: string }[] = [
    { value: 'project', label: 'Projects' },
    { value: 'event', label: 'Events' },
  ];

  const commonCategories = [
    'Community', 'Education', 'Environment', 'Health', 'Technology',
    'Arts', 'Sports', 'Social', 'Religious', 'Other'
  ];

  const handleCriteriaChange = (updates: Partial<FilterCriteria>) => {
    const newCriteria = { ...criteria, ...updates };
    setCriteria(newCriteria);
    onFilterChange(newCriteria);
  };

  const handleClearFilters = () => {
    const emptyCriteria: FilterCriteria = {
      searchQuery: '',
      searchFields: ['title', 'description', 'submitterName', 'submitterEmail'],
      types: [],
      statuses: [],
      categories: [],
      dateRange: { start: '', end: '' },
      locations: [],
      visibility: 'all',
      customFilters: {},
    };
    setCriteria(emptyCriteria);
    onFilterChange(emptyCriteria);
  };

  const handleSaveFilter = () => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter({
        name: filterName.trim(),
        criteria,
      });
      setFilterName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    setCriteria(savedFilter.criteria);
    onFilterChange(savedFilter.criteria);
  };

  const activeFilterCount = [
    criteria.searchQuery,
    criteria.types.length,
    criteria.statuses.length,
    criteria.categories.length,
    criteria.locations.length,
    criteria.dateRange.start,
    criteria.dateRange.end,
    criteria.submitterEmail,
    criteria.submitterName,
    criteria.visibility !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-logo-navy-light text-cream-elegant rounded-luxury hover:bg-logo-navy transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-vibrant-orange text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-vibrant-orange-light text-sm hover:text-vibrant-orange transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {isOpen && (
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-cream-elegant text-sm font-semibold mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Search
            </label>
            <input
              type="text"
              value={criteria.searchQuery}
              onChange={(e) => handleCriteriaChange({ searchQuery: e.target.value })}
              placeholder="Search across all fields..."
              className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {['title', 'description', 'submitterName', 'submitterEmail', 'location', 'category'].map((field) => (
                <label key={field} className="flex items-center space-x-1 text-cream-elegant/80 text-xs">
                  <input
                    type="checkbox"
                    checked={criteria.searchFields.includes(field)}
                    onChange={(e) => {
                      const fields = e.target.checked
                        ? [...criteria.searchFields, field]
                        : criteria.searchFields.filter((f) => f !== field);
                      handleCriteriaChange({ searchFields: fields });
                    }}
                    className="rounded text-vibrant-orange"
                  />
                  <span>{field}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      const types = criteria.types.includes(option.value)
                        ? criteria.types.filter((t) => t !== option.value)
                        : [...criteria.types, option.value];
                      handleCriteriaChange({ types });
                    }}
                    className={`px-3 py-1 rounded-luxury text-sm transition-colors ${
                      criteria.types.includes(option.value)
                        ? 'bg-vibrant-orange text-white'
                        : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      const statuses = criteria.statuses.includes(option.value)
                        ? criteria.statuses.filter((s) => s !== option.value)
                        : [...criteria.statuses, option.value];
                      handleCriteriaChange({ statuses });
                    }}
                    className={`px-3 py-1 rounded-luxury text-sm transition-colors flex items-center space-x-1 ${
                      criteria.statuses.includes(option.value)
                        ? 'bg-vibrant-orange text-white'
                        : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
                    }`}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-cream-elegant text-sm font-semibold mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {commonCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    const categories = criteria.categories.includes(category)
                      ? criteria.categories.filter((c) => c !== category)
                      : [...criteria.categories, category];
                    handleCriteriaChange({ categories });
                  }}
                  className={`px-3 py-1 rounded-luxury text-sm transition-colors ${
                    criteria.categories.includes(category)
                      ? 'bg-vibrant-orange text-white'
                      : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Submitted After
              </label>
              <input
                type="date"
                value={criteria.dateRange.start}
                onChange={(e) =>
                  handleCriteriaChange({
                    dateRange: { ...criteria.dateRange, start: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant focus:outline-none focus:border-vibrant-orange"
              />
            </div>
            <div>
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                Submitted Before
              </label>
              <input
                type="date"
                value={criteria.dateRange.end}
                onChange={(e) =>
                  handleCriteriaChange({
                    dateRange: { ...criteria.dateRange, end: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant focus:outline-none focus:border-vibrant-orange"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-cream-elegant text-sm font-semibold mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Location
            </label>
            <input
              type="text"
              value={criteria.locations.join(', ')}
              onChange={(e) => {
                const locations = e.target.value.split(',').map((l) => l.trim()).filter(Boolean);
                handleCriteriaChange({ locations });
              }}
              placeholder="Enter locations separated by commas..."
              className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange"
            />
          </div>

          {/* Submitter Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Submitter Email
              </label>
              <input
                type="email"
                value={criteria.submitterEmail || ''}
                onChange={(e) => handleCriteriaChange({ submitterEmail: e.target.value || undefined })}
                placeholder="Filter by submitter email..."
                className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange"
              />
            </div>
            <div>
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                Submitter Name
              </label>
              <input
                type="text"
                value={criteria.submitterName || ''}
                onChange={(e) => handleCriteriaChange({ submitterName: e.target.value || undefined })}
                placeholder="Filter by submitter name..."
                className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-cream-elegant text-sm font-semibold mb-2">
              <Eye className="w-4 h-4 inline mr-2" />
              Visibility
            </label>
            <div className="flex gap-2">
              {(['all', 'visible', 'hidden'] as const).map((vis) => (
                <button
                  key={vis}
                  onClick={() => handleCriteriaChange({ visibility: vis })}
                  className={`px-4 py-2 rounded-luxury text-sm transition-colors flex items-center space-x-2 ${
                    criteria.visibility === vis
                      ? 'bg-vibrant-orange text-white'
                      : 'bg-logo-navy-light text-cream-elegant hover:bg-logo-navy'
                  }`}
                >
                  {vis === 'visible' && <Eye className="w-4 h-4" />}
                  {vis === 'hidden' && <EyeOff className="w-4 h-4" />}
                  <span className="capitalize">{vis}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-vibrant-orange/30">
            <div className="flex items-center space-x-2">
              {onSaveFilter && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-light transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Filter</span>
                </button>
              )}
              {onExport && (
                <button
                  onClick={() => onExport(criteria)}
                  className="flex items-center space-x-2 px-4 py-2 bg-logo-navy-light text-cream-elegant rounded-luxury hover:bg-logo-navy transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-cream-elegant/80 hover:text-cream-elegant transition-colors"
            >
              Close
            </button>
          </div>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="pt-2 border-t border-vibrant-orange/30">
              <label className="block text-cream-elegant text-sm font-semibold mb-2">
                Saved Filters
              </label>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center space-x-2 px-3 py-1 bg-logo-navy-light rounded-luxury"
                  >
                    <button
                      onClick={() => handleLoadFilter(filter)}
                      className="text-cream-elegant hover:text-vibrant-orange transition-colors text-sm"
                    >
                      {filter.name}
                    </button>
                    {onDeleteFilter && (
                      <button
                        onClick={() => onDeleteFilter(filter.id)}
                        className="text-cream-elegant/60 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-6 max-w-md w-full mx-4">
            <h3 className="text-cream-elegant font-semibold text-lg mb-4">Save Filter</h3>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Filter name..."
              className="w-full px-4 py-2 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant placeholder-cream-elegant/50 focus:outline-none focus:border-vibrant-orange mb-4"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName('');
                }}
                className="px-4 py-2 text-cream-elegant/80 hover:text-cream-elegant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
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

export default AdvancedFilters;

