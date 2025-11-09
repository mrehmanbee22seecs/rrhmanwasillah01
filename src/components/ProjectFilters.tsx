/**
 * ProjectFilters Component
 * Advanced filtering for project discovery
 */

import React, { useState, useEffect } from 'react';
import {
  Filter,
  Search,
  MapPin,
  Calendar,
  Tag,
  X,
  SlidersHorizontal,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { ProjectSubmission } from '../types/submissions';

export interface ProjectFilterCriteria {
  searchQuery: string;
  categories: string[];
  locations: string[];
  statuses: string[];
  dateRange: {
    start: string;
    end: string;
  };
  skills: string[];
  sortBy: 'newest' | 'popular' | 'ending_soon' | 'match_score';
  showOnlyBookmarked: boolean;
}

interface ProjectFiltersProps {
  projects: ProjectSubmission[];
  onFilterChange: (filteredProjects: ProjectSubmission[]) => void;
  onCriteriaChange: (criteria: ProjectFilterCriteria) => void;
  availableCategories?: string[];
  availableLocations?: string[];
  availableSkills?: string[];
  userSkills?: string[];
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  projects,
  onFilterChange,
  onCriteriaChange,
  availableCategories = [],
  availableLocations = [],
  availableSkills = [],
  userSkills = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [criteria, setCriteria] = useState<ProjectFilterCriteria>({
    searchQuery: '',
    categories: [],
    locations: [],
    statuses: [],
    dateRange: { start: '', end: '' },
    skills: [],
    sortBy: 'newest',
    showOnlyBookmarked: false,
  });

  // Extract available options from projects if not provided
  useEffect(() => {
    if (availableCategories.length === 0) {
      const categories = Array.from(new Set(projects.map(p => p.category))).filter(Boolean);
      // Update parent if needed
    }
    if (availableLocations.length === 0) {
      const locations = Array.from(new Set(projects.map(p => p.location))).filter(Boolean);
      // Update parent if needed
    }
  }, [projects, availableCategories.length, availableLocations.length]);

  const categories = availableCategories.length > 0 
    ? availableCategories 
    : Array.from(new Set(projects.map(p => p.category))).filter(Boolean);

  const locations = availableLocations.length > 0
    ? availableLocations
    : Array.from(new Set(projects.map(p => p.location))).filter(Boolean);

  const skills = availableSkills.length > 0
    ? availableSkills
    : Array.from(new Set(
        projects.flatMap(p => [
          ...(p.requiredSkills || []),
          ...(p.preferredSkills || []),
          ...(p.skillRequirements || []),
        ])
      )).filter(Boolean);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const applyFilters = useCallback(() => {
    let filtered = [...projects];

    // Search query
    if (criteria.searchQuery.trim()) {
      const query = criteria.searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.category.toLowerCase().includes(query) ||
        project.location.toLowerCase().includes(query) ||
        (project.requiredSkills || []).some(skill => skill.toLowerCase().includes(query)) ||
        (project.objectives || []).some(obj => obj.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (criteria.categories.length > 0) {
      filtered = filtered.filter(project => criteria.categories.includes(project.category));
    }

    // Location filter
    if (criteria.locations.length > 0) {
      filtered = filtered.filter(project => criteria.locations.includes(project.location));
    }

    // Status filter
    if (criteria.statuses.length > 0) {
      filtered = filtered.filter(project => {
        const status = project.status === 'approved' ? 'ongoing' : project.status;
        return criteria.statuses.includes(status);
      });
    }

    // Date range filter
    if (criteria.dateRange.start) {
      const startDate = new Date(criteria.dateRange.start);
      filtered = filtered.filter(project => {
        if (!project.startDate) return false;
        const projectStart = typeof project.startDate === 'string' 
          ? new Date(project.startDate)
          : project.startDate.toDate?.() || new Date();
        return projectStart >= startDate;
      });
    }

    if (criteria.dateRange.end) {
      const endDate = new Date(criteria.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(project => {
        if (!project.endDate) return true;
        const projectEnd = typeof project.endDate === 'string'
          ? new Date(project.endDate)
          : project.endDate.toDate?.() || new Date();
        return projectEnd <= endDate;
      });
    }

    // Skills filter
    if (criteria.skills.length > 0) {
      filtered = filtered.filter(project => {
        const projectSkills = [
          ...(project.requiredSkills || []),
          ...(project.preferredSkills || []),
          ...(project.skillRequirements || []),
        ];
        return criteria.skills.some(skill => 
          projectSkills.some(ps => ps.toLowerCase().includes(skill.toLowerCase()))
        );
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (criteria.sortBy) {
        case 'newest':
          const aDate = a.submittedAt?.toDate?.() || new Date(a.submittedAt || 0);
          const bDate = b.submittedAt?.toDate?.() || new Date(b.submittedAt || 0);
          return bDate.getTime() - aDate.getTime();

        case 'popular':
          const aPopularity = (a.participantIds?.length || 0) + (a.expectedVolunteers || 0);
          const bPopularity = (b.participantIds?.length || 0) + (b.expectedVolunteers || 0);
          return bPopularity - aPopularity;

        case 'ending_soon':
          const aEnd = a.endDate 
            ? (typeof a.endDate === 'string' ? new Date(a.endDate) : a.endDate.toDate?.() || new Date())
            : new Date('9999-12-31');
          const bEnd = b.endDate
            ? (typeof b.endDate === 'string' ? new Date(b.endDate) : b.endDate.toDate?.() || new Date())
            : new Date('9999-12-31');
          return aEnd.getTime() - bEnd.getTime();

        default:
          return 0;
      }
    });

    onFilterChange(filtered);
    onCriteriaChange(criteria);
  };

  const toggleCategory = (category: string) => {
    setCriteria(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleLocation = (location: string) => {
    setCriteria(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location],
    }));
  };

  const toggleStatus = (status: string) => {
    setCriteria(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const toggleSkill = (skill: string) => {
    setCriteria(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const clearFilters = () => {
    setCriteria({
      searchQuery: '',
      categories: [],
      locations: [],
      statuses: [],
      dateRange: { start: '', end: '' },
      skills: [],
      sortBy: 'newest',
      showOnlyBookmarked: false,
    });
  };

  const activeFiltersCount = 
    criteria.categories.length +
    criteria.locations.length +
    criteria.statuses.length +
    (criteria.dateRange.start ? 1 : 0) +
    (criteria.dateRange.end ? 1 : 0) +
    criteria.skills.length +
    (criteria.searchQuery ? 1 : 0);

  return (
    <div className="luxury-card bg-white p-6 mb-8 shadow-xl border-2 border-logo-navy/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Filter className="w-6 h-6 text-vibrant-orange mr-3" />
          <h2 className="text-2xl font-luxury-heading text-logo-navy">Filter Projects</h2>
          {activeFiltersCount > 0 && (
            <span className="ml-3 px-3 py-1 bg-vibrant-orange text-white text-xs font-bold rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center px-4 py-2 bg-logo-navy text-cream-elegant rounded-luxury hover:bg-logo-navy-light transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {isOpen ? 'Hide' : 'Show'} Filters
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center px-4 py-2 bg-gray-200 text-logo-navy rounded-luxury hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by title, description, skills..."
            value={criteria.searchQuery}
            onChange={(e) => setCriteria(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body text-logo-navy"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {isOpen && (
        <div className="space-y-6 border-t border-logo-navy/10 pt-6">
          {/* Categories */}
          <div>
            <label className="block font-luxury-medium text-logo-navy mb-3 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-luxury border-2 transition-colors ${
                    criteria.categories.includes(category)
                      ? 'bg-vibrant-orange text-white border-vibrant-orange'
                      : 'bg-white text-logo-navy border-logo-navy/30 hover:border-vibrant-orange/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block font-luxury-medium text-logo-navy mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Locations
            </label>
            <div className="flex flex-wrap gap-2">
              {locations.map(location => (
                <button
                  key={location}
                  onClick={() => toggleLocation(location)}
                  className={`px-4 py-2 rounded-luxury border-2 transition-colors ${
                    criteria.locations.includes(location)
                      ? 'bg-vibrant-orange text-white border-vibrant-orange'
                      : 'bg-white text-logo-navy border-logo-navy/30 hover:border-vibrant-orange/50'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block font-luxury-medium text-logo-navy mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {['ongoing', 'upcoming', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-4 py-2 rounded-luxury border-2 transition-colors capitalize ${
                    criteria.statuses.includes(status)
                      ? 'bg-vibrant-orange text-white border-vibrant-orange'
                      : 'bg-white text-logo-navy border-logo-navy/30 hover:border-vibrant-orange/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block font-luxury-medium text-logo-navy mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-logo-navy-light mb-1">Start Date</label>
                <input
                  type="date"
                  value={criteria.dateRange.start}
                  onChange={(e) => setCriteria(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value },
                  }))}
                  className="w-full px-4 py-2 border-2 border-logo-navy/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange"
                />
              </div>
              <div>
                <label className="block text-sm text-logo-navy-light mb-1">End Date</label>
                <input
                  type="date"
                  value={criteria.dateRange.end}
                  onChange={(e) => setCriteria(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value },
                  }))}
                  className="w-full px-4 py-2 border-2 border-logo-navy/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <label className="block font-luxury-medium text-logo-navy mb-3">
                Required Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => {
                  const hasSkill = userSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-luxury border-2 transition-colors ${
                        criteria.skills.includes(skill)
                          ? 'bg-vibrant-orange text-white border-vibrant-orange'
                          : hasSkill
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-white text-logo-navy border-logo-navy/30 hover:border-vibrant-orange/50'
                      }`}
                      title={hasSkill ? 'You have this skill' : ''}
                    >
                      {skill}
                      {hasSkill && <span className="ml-1">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sort Options */}
      <div className="mt-6 pt-6 border-t border-logo-navy/10">
        <label className="block font-luxury-medium text-logo-navy mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Sort By
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'newest', label: 'Newest', icon: Clock },
            { value: 'popular', label: 'Popular', icon: TrendingUp },
            { value: 'ending_soon', label: 'Ending Soon', icon: Calendar },
          ].map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setCriteria(prev => ({ ...prev, sortBy: option.value as any }))}
                className={`px-4 py-2 rounded-luxury border-2 transition-colors flex items-center ${
                  criteria.sortBy === option.value
                    ? 'bg-vibrant-orange text-white border-vibrant-orange'
                    : 'bg-white text-logo-navy border-logo-navy/30 hover:border-vibrant-orange/50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectFilters;

