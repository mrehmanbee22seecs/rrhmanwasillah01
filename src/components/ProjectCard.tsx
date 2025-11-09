/**
 * ProjectCard Component
 * Displays a project card with bookmarking, match score, and interactive features
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bookmark, 
  BookmarkCheck, 
  Users, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Share2, 
  Star,
  Clock,
  Target,
  TrendingUp,
  Award
} from 'lucide-react';
import { ProjectSubmission } from '../types/submissions';
import { useBookmarks } from '../hooks/useBookmarks';
import { useAuth } from '../contexts/AuthContext';

interface ProjectCardProps {
  project: ProjectSubmission;
  matchScore?: number;
  showMatchScore?: boolean;
  onBookmarkChange?: (projectId: string, isBookmarked: boolean) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  matchScore,
  showMatchScore = false,
  onBookmarkChange,
  variant = 'default',
}) => {
  const { currentUser } = useAuth();
  const { isBookmarked, toggleBookmark, addBookmarkNote } = useBookmarks();
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const bookmarked = isBookmarked(project.id);

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please login to bookmark projects');
      return;
    }

    setIsBookmarking(true);
    try {
      await toggleBookmark(project.id, {
        title: project.title,
        description: project.description,
        category: project.category,
        location: project.location,
        image: project.image,
        status: project.status,
      });
      onBookmarkChange?.(project.id, !bookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/projects/${project.id}`;
    const shareData = {
      title: project.title,
      text: project.description,
      url: url,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        alert('Project link copied to clipboard!');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(url);
          alert('Project link copied to clipboard!');
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
        }
      }
    }
    setShowShareMenu(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'planning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Active';
      case 'pending':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Education: 'bg-blue-50 text-blue-700 border-blue-200',
      Healthcare: 'bg-red-50 text-red-700 border-red-200',
      Infrastructure: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      Technology: 'bg-purple-50 text-purple-700 border-purple-200',
      'Food Security': 'bg-orange-50 text-orange-700 border-orange-200',
      Employment: 'bg-green-50 text-green-700 border-green-200',
      Environment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Community: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatDate = (date: string | any) => {
    if (!date) return 'TBD';
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (date.toDate) {
      return date.toDate().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return 'TBD';
  };

  const isUpcoming = project.startDate && new Date(project.startDate) > new Date();
  const isEndingSoon = project.endDate && 
    new Date(project.endDate) > new Date() && 
    new Date(project.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (variant === 'compact') {
    return (
      <Link
        to={`/projects/${project.id}`}
        className="luxury-card bg-white rounded-luxury-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-logo-navy/10 hover:border-vibrant-orange/50 group"
      >
        <div className="flex">
          <div className="w-32 h-32 flex-shrink-0">
            <img
              src={project.image || '/logo.jpeg'}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-luxury-heading text-logo-navy group-hover:text-vibrant-orange transition-colors line-clamp-1">
                {project.title}
              </h3>
              {currentUser && (
                <button
                  onClick={handleBookmarkToggle}
                  disabled={isBookmarking}
                  className="text-gray-400 hover:text-vibrant-orange transition-colors ml-2"
                  title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  {bookmarked ? (
                    <BookmarkCheck className="w-5 h-5 fill-vibrant-orange text-vibrant-orange" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
            <p className="text-sm text-logo-navy-light font-luxury-body line-clamp-2 mb-2">
              {project.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-logo-navy-light">
              <span className={`px-2 py-1 rounded-full border ${getCategoryColor(project.category)}`}>
                {project.category}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {project.location}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/projects/${project.id}`}
      className="luxury-card bg-white rounded-luxury-lg shadow-xl overflow-hidden floating-card magnetic-element group border-2 border-logo-navy/10 hover:border-vibrant-orange/50 transition-all duration-300 relative"
    >
      {/* Match Score Badge */}
      {showMatchScore && matchScore !== undefined && matchScore > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-vibrant-orange text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
          <Star className="w-3 h-3 fill-white" />
          {Math.round(matchScore)}% Match
        </div>
      )}

      {/* Status and Actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)} shadow-lg`}>
          {getStatusText(project.status)}
        </span>
        {currentUser && (
          <>
            <button
              onClick={handleBookmarkToggle}
              disabled={isBookmarking}
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-vibrant-orange/20 transition-colors shadow-lg"
              title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              {bookmarked ? (
                <BookmarkCheck className="w-5 h-5 fill-vibrant-orange text-vibrant-orange" />
              ) : (
                <Bookmark className="w-5 h-5 text-logo-navy" />
              )}
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowShareMenu(!showShareMenu);
                }}
                className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-vibrant-orange/20 transition-colors shadow-lg"
                title="Share project"
              >
                <Share2 className="w-5 h-5 text-logo-navy" />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-logo-navy/10 z-20">
                  <button
                    onClick={handleShare}
                    className="w-full text-left px-4 py-2 hover:bg-vibrant-orange/10 transition-colors flex items-center gap-2 text-logo-navy"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Project
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Project Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={project.image || '/logo.jpeg'}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Trending Badge */}
        {isEndingSoon && (
          <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Ending Soon
          </div>
        )}
        {isUpcoming && (
          <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Upcoming
          </div>
        )}
      </div>

      {/* Project Content */}
      <div className="p-6">
        {/* Category and Location */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getCategoryColor(project.category)}`}>
            {project.category}
          </span>
          <span className="text-sm text-logo-navy-light font-semibold flex items-center">
            <MapPin className="w-4 h-4 mr-1 text-vibrant-orange" />
            {project.location}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-luxury-heading text-logo-navy mb-3 group-hover:text-gradient-animated transition-all duration-500 line-clamp-2">
          {project.title}
        </h3>

        {/* Affiliation */}
        {project.affiliation?.name && (
          <div className="text-xs text-vibrant-orange-dark font-semibold mb-2 flex items-center">
            <span className="mr-1">🏢</span>
            {project.affiliation.name}
          </div>
        )}

        {/* Description */}
        <p className="text-logo-navy-light font-luxury-body text-sm mb-4 line-clamp-3">
          {project.description}
        </p>

        {/* Project Details */}
        <div className="space-y-2 mb-4 bg-cream-white p-3 rounded-lg border border-logo-navy/10">
          <div className="flex items-center justify-between text-sm text-logo-navy-light font-semibold">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1 text-vibrant-orange" />
              <span>{project.expectedVolunteers || 0} volunteers</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-logo-teal" />
              <span>{project.timeline || project.durationEstimate || 'Ongoing'}</span>
            </div>
          </div>
          
          {project.peopleImpacted && project.peopleImpacted > 0 && (
            <div className="text-sm text-logo-navy-light font-semibold flex items-center">
              <Target className="w-4 h-4 mr-1 text-vibrant-orange" />
              <span className="font-bold text-logo-navy">{project.peopleImpacted.toLocaleString()}</span>
              <span className="ml-1">people impacted</span>
            </div>
          )}

          {project.startDate && (
            <div className="text-sm text-vibrant-orange-dark font-bold flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Starts: {formatDate(project.startDate)}
            </div>
          )}

          {project.endDate && (
            <div className="text-sm text-vibrant-orange-dark font-bold flex items-center">
              <Award className="w-4 h-4 mr-1" />
              Ends: {formatDate(project.endDate)}
            </div>
          )}
        </div>

        {/* Skills Required (if available) */}
        {project.requiredSkills && project.requiredSkills.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-logo-navy mb-2">Required Skills:</div>
            <div className="flex flex-wrap gap-1">
              {project.requiredSkills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-vibrant-orange/10 text-vibrant-orange-dark text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
              {project.requiredSkills.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{project.requiredSkills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-3 border-t border-logo-navy/10">
          <div className="flex items-center text-vibrant-orange font-bold group-hover:text-vibrant-orange-light transition-colors">
            <span className="text-sm">Learn More</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;

