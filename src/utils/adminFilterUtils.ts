/**
 * Admin Filter Utilities
 * Utility functions for filtering submissions and applications
 */

import { FilterCriteria } from '../components/Admin/AdvancedFilters';

export type SubmissionWithType = {
  id: string;
  submissionType: 'project' | 'event';
  status: string;
  isVisible?: boolean;
  title: string;
  description: string;
  category: string;
  location: string;
  submitterName: string;
  submitterEmail: string;
  submittedBy: string;
  submittedAt?: any;
  [key: string]: any;
};

export function applyFilters(
  items: SubmissionWithType[],
  criteria: FilterCriteria
): SubmissionWithType[] {
  let filtered = [...items];

  // Search query
  if (criteria.searchQuery.trim()) {
    const query = criteria.searchQuery.toLowerCase();
    filtered = filtered.filter((item) => {
      return criteria.searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (Array.isArray(value)) {
          return value.some((v) => String(v).toLowerCase().includes(query));
        }
        return false;
      });
    });
  }

  // Type filter
  if (criteria.types.length > 0) {
    filtered = filtered.filter((item) =>
      criteria.types.includes(item.submissionType)
    );
  }

  // Status filter
  if (criteria.statuses.length > 0) {
    filtered = filtered.filter((item) =>
      criteria.statuses.includes(item.status)
    );
  }

  // Category filter
  if (criteria.categories.length > 0) {
    filtered = filtered.filter((item) =>
      criteria.categories.includes(item.category)
    );
  }

  // Date range filter
  if (criteria.dateRange.start) {
    const startDate = new Date(criteria.dateRange.start);
    filtered = filtered.filter((item) => {
      const itemDate = item.submittedAt?.toDate?.() || new Date(item.submittedAt);
      return itemDate >= startDate;
    });
  }

  if (criteria.dateRange.end) {
    const endDate = new Date(criteria.dateRange.end);
    endDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter((item) => {
      const itemDate = item.submittedAt?.toDate?.() || new Date(item.submittedAt);
      return itemDate <= endDate;
    });
  }

  // Location filter
  if (criteria.locations.length > 0) {
    filtered = filtered.filter((item) => {
      const itemLocation = (item.location || '').toLowerCase();
      return criteria.locations.some((loc) =>
        itemLocation.includes(loc.toLowerCase())
      );
    });
  }

  // Submitter email filter
  if (criteria.submitterEmail) {
    const email = criteria.submitterEmail.toLowerCase();
    filtered = filtered.filter((item) =>
      item.submitterEmail?.toLowerCase().includes(email)
    );
  }

  // Submitter name filter
  if (criteria.submitterName) {
    const name = criteria.submitterName.toLowerCase();
    filtered = filtered.filter((item) =>
      item.submitterName?.toLowerCase().includes(name)
    );
  }

  // Visibility filter
  if (criteria.visibility === 'visible') {
    filtered = filtered.filter((item) => item.isVisible === true);
  } else if (criteria.visibility === 'hidden') {
    filtered = filtered.filter((item) => item.isVisible === false);
  }

  // Custom filters
  Object.entries(criteria.customFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filtered = filtered.filter((item) => {
        const itemValue = item[key];
        if (typeof value === 'string') {
          return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
        }
        return itemValue === value;
      });
    }
  });

  return filtered;
}

export function getFilterStats(items: SubmissionWithType[], criteria: FilterCriteria) {
  const filtered = applyFilters(items, criteria);
  return {
    total: items.length,
    filtered: filtered.length,
    visible: items.filter((item) => item.isVisible === true).length,
    pending: items.filter((item) => item.status === 'pending').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
  };
}

