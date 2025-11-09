/**
 * RecommendedProjects Component
 * Displays smart project recommendations with match scores
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, MapPin, Star, Users, Heart } from 'lucide-react';
import { ProjectSubmission } from '../types/submissions';
import { UserProfile } from '../types/user';
import {
  getRecommendedProjects,
  getSimilarProjects,
  getPopularProjects,
  getTrendingProjects,
  getPopularInArea,
  getPersonalizedFeed,
  RecommendationScore,
} from '../services/recommendationService';
import ProjectCard from './ProjectCard';
import { useAuth } from '../contexts/AuthContext';

interface RecommendedProjectsProps {
  projects: ProjectSubmission[];
  currentProject?: ProjectSubmission;
  variant?: 'recommended' | 'similar' | 'popular' | 'trending' | 'area' | 'personalized';
  limit?: number;
  showMatchScore?: boolean;
  title?: string;
  onProjectClick?: (project: ProjectSubmission) => void;
}

const RecommendedProjects: React.FC<RecommendedProjectsProps> = ({
  projects,
  currentProject,
  variant = 'personalized',
  limit = 6,
  showMatchScore = true,
  title,
  onProjectClick,
}) => {
  const { currentUser, userData } = useAuth();
  const [recommendedProjects, setRecommendedProjects] = useState<RecommendationScore[]>([]);
  const [similarProjects, setSimilarProjects] = useState<ProjectSubmission[]>([]);
  const [popularProjects, setPopularProjects] = useState<ProjectSubmission[]>([]);
  const [trendingProjects, setTrendingProjects] = useState<ProjectSubmission[]>([]);
  const [areaProjects, setAreaProjects] = useState<ProjectSubmission[]>([]);
  const [personalizedProjects, setPersonalizedProjects] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [projects, currentProject, variant, currentUser, userData]);

  const loadRecommendations = () => {
    if (projects.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const userProfile = userData as UserProfile | undefined;
      const userLocation = userProfile?.location || userProfile?.city || '';
      const userSkills = userProfile?.skills || [];
      const userInterests = userProfile?.interests || [];

      // Load recommendations based on variant
      switch (variant) {
        case 'recommended':
          const recommended = getRecommendedProjects(projects, {
            userProfile,
            userLocation,
            userSkills,
            userInterests,
            limit,
          });
          setRecommendedProjects(recommended);
          break;

        case 'similar':
          if (currentProject) {
            const similar = getSimilarProjects(currentProject, projects, limit);
            setSimilarProjects(similar);
          }
          break;

        case 'popular':
          const popular = getPopularProjects(projects, limit);
          setPopularProjects(popular);
          break;

        case 'trending':
          const trending = getTrendingProjects(projects, limit);
          setTrendingProjects(trending);
          break;

        case 'area':
          if (userLocation) {
            const area = getPopularInArea(projects, userLocation, limit);
            setAreaProjects(area);
          }
          break;

        case 'personalized':
        default:
          const personalized = getPersonalizedFeed(projects, {
            userProfile,
            userLocation,
            userSkills,
            userInterests,
            limit,
          });
          setPersonalizedProjects(personalized);
          break;
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (title) return title;

    switch (variant) {
      case 'recommended':
        return 'Recommended for You';
      case 'similar':
        return 'Similar Projects';
      case 'popular':
        return 'Popular Projects';
      case 'trending':
        return 'Trending Projects';
      case 'area':
        return 'Popular in Your Area';
      case 'personalized':
        return 'Your Personalized Feed';
      default:
        return 'Recommended Projects';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'recommended':
        return Sparkles;
      case 'similar':
        return Star;
      case 'popular':
        return Users;
      case 'trending':
        return TrendingUp;
      case 'area':
        return MapPin;
      case 'personalized':
        return Heart;
      default:
        return Sparkles;
    }
  };

  const getProjectsToDisplay = (): (ProjectSubmission & { matchScore?: number })[] => {
    switch (variant) {
      case 'recommended':
        return recommendedProjects.map(r => ({
          ...r.project,
          matchScore: r.score,
        }));
      case 'similar':
        return similarProjects;
      case 'popular':
        return popularProjects;
      case 'trending':
        return trendingProjects;
      case 'area':
        return areaProjects;
      case 'personalized':
        return personalizedProjects;
      default:
        return [];
    }
  };

  const projectsToDisplay = getProjectsToDisplay();
  const Icon = getIcon();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
        <p className="text-logo-navy-light">Loading recommendations...</p>
      </div>
    );
  }

  if (projectsToDisplay.length === 0) {
    return (
      <div className="luxury-card bg-white p-8 text-center">
        <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-luxury-heading text-logo-navy mb-2">No Recommendations Available</h3>
        <p className="text-logo-navy-light">
          {variant === 'area' 
            ? 'Update your location in your profile to see projects in your area.'
            : 'Try adjusting your filters or check back later for new projects.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-vibrant-orange/10 rounded-full flex items-center justify-center mr-4">
            <Icon className="w-6 h-6 text-vibrant-orange" />
          </div>
          <div>
            <h2 className="text-2xl font-luxury-heading text-logo-navy">{getTitle()}</h2>
            <p className="text-sm text-logo-navy-light">
              {projectsToDisplay.length} project{projectsToDisplay.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsToDisplay.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            matchScore={project.matchScore}
            showMatchScore={showMatchScore && project.matchScore !== undefined}
            variant="default"
          />
        ))}
      </div>

      {/* Match Score Explanation (for recommended variant) */}
      {variant === 'recommended' && showMatchScore && recommendedProjects.length > 0 && (
        <div className="luxury-card bg-gradient-to-r from-vibrant-orange/10 to-logo-teal/10 p-6 border-2 border-vibrant-orange/20">
          <div className="flex items-start">
            <Star className="w-5 h-5 text-vibrant-orange mr-3 mt-1" />
            <div>
              <h3 className="font-luxury-heading text-logo-navy mb-2">About Match Scores</h3>
              <p className="text-sm text-logo-navy-light">
                Match scores are calculated based on your location, skills, interests, and availability. 
                Higher scores indicate better alignment with your profile and preferences.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendedProjects;

