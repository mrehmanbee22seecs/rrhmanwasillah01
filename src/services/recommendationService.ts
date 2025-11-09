/**
 * Recommendation Service
 * Provides smart project recommendations based on user interests, skills, and behavior
 */

import { ProjectSubmission } from '../types/submissions';
import { UserProfile } from '../types/user';

export interface RecommendationScore {
  project: ProjectSubmission;
  score: number;
  reasons: string[];
}

export interface RecommendationOptions {
  userProfile?: UserProfile;
  userLocation?: string;
  userSkills?: string[];
  userInterests?: string[];
  userBookmarks?: string[];
  limit?: number;
}

/**
 * Calculate match score for a project based on user profile
 */
export const calculateMatchScore = (
  project: ProjectSubmission,
  options: RecommendationOptions
): number => {
  let score = 0;
  const reasons: string[] = [];

  const { userProfile, userLocation, userSkills = [], userInterests = [], userBookmarks = [] } = options;

  // Location match (30 points)
  if (userLocation && project.location) {
    const userLocationLower = userLocation.toLowerCase();
    const projectLocationLower = project.location.toLowerCase();
    
    if (userLocationLower === projectLocationLower) {
      score += 30;
      reasons.push('Same location');
    } else if (projectLocationLower.includes(userLocationLower) || userLocationLower.includes(projectLocationLower)) {
      score += 15;
      reasons.push('Nearby location');
    }
  }

  // Skills match (40 points)
  const projectSkills = [
    ...(project.requiredSkills || []),
    ...(project.preferredSkills || []),
    ...(project.skillRequirements || []),
  ];

  if (projectSkills.length > 0 && userSkills.length > 0) {
    const matchingSkills = projectSkills.filter(skill =>
      userSkills.some(userSkill =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    if (matchingSkills.length > 0) {
      const skillMatchRatio = matchingSkills.length / projectSkills.length;
      const skillScore = Math.min(40, skillMatchRatio * 40);
      score += skillScore;
      reasons.push(`${matchingSkills.length} skill${matchingSkills.length > 1 ? 's' : ''} match`);
    }
  }

  // Interest/Category match (20 points)
  if (userInterests.length > 0 && project.category) {
    const categoryLower = project.category.toLowerCase();
    const interestMatch = userInterests.some(interest =>
      interest.toLowerCase().includes(categoryLower) ||
      categoryLower.includes(interest.toLowerCase())
    );

    if (interestMatch) {
      score += 20;
      reasons.push('Matches your interests');
    }
  }

  // Availability match (10 points)
  if (userProfile?.availability) {
    // Simple check: if project has start/end dates and user has availability
    if (project.startDate && project.endDate && userProfile.availability.startDate && userProfile.availability.endDate) {
      const projectStart = typeof project.startDate === 'string' 
        ? new Date(project.startDate)
        : project.startDate.toDate?.() || new Date();
      const projectEnd = typeof project.endDate === 'string'
        ? new Date(project.endDate)
        : project.endDate.toDate?.() || new Date();
      const userStart = new Date(userProfile.availability.startDate);
      const userEnd = new Date(userProfile.availability.endDate || '9999-12-31');

      if (projectStart >= userStart && projectEnd <= userEnd) {
        score += 10;
        reasons.push('Matches your availability');
      }
    }
  }

  return Math.min(100, score);
};

/**
 * Get recommended projects for a user
 */
export const getRecommendedProjects = (
  projects: ProjectSubmission[],
  options: RecommendationOptions = {}
): RecommendationScore[] => {
  const { limit = 10 } = options;

  // Calculate scores for all projects
  const scoredProjects: RecommendationScore[] = projects.map(project => {
    const score = calculateMatchScore(project, options);
    const reasons: string[] = [];

    // Add reasons based on score components
    if (options.userLocation && project.location) {
      if (options.userLocation.toLowerCase() === project.location.toLowerCase()) {
        reasons.push('Same location');
      }
    }

    if (options.userSkills && options.userSkills.length > 0) {
      const projectSkills = [
        ...(project.requiredSkills || []),
        ...(project.preferredSkills || []),
        ...(project.skillRequirements || []),
      ];
      const matchingSkills = projectSkills.filter(skill =>
        options.userSkills!.some(userSkill =>
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      if (matchingSkills.length > 0) {
        reasons.push(`${matchingSkills.length} skill${matchingSkills.length > 1 ? 's' : ''} match`);
      }
    }

    if (options.userInterests && options.userInterests.length > 0 && project.category) {
      const interestMatch = options.userInterests.some(interest =>
        interest.toLowerCase().includes(project.category.toLowerCase()) ||
        project.category.toLowerCase().includes(interest.toLowerCase())
      );
      if (interestMatch) {
        reasons.push('Matches your interests');
      }
    }

    return {
      project,
      score,
      reasons: reasons.length > 0 ? reasons : ['Recommended for you'],
    };
  });

  // Sort by score (descending) and return top projects
  return scoredProjects
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .slice(0, limit);
};

/**
 * Get similar projects based on a reference project
 */
export const getSimilarProjects = (
  referenceProject: ProjectSubmission,
  allProjects: ProjectSubmission[],
  limit: number = 5
): ProjectSubmission[] => {
  const referenceCategory = referenceProject.category;
  const referenceLocation = referenceProject.location;
  const referenceSkills = [
    ...(referenceProject.requiredSkills || []),
    ...(referenceProject.preferredSkills || []),
    ...(referenceProject.skillRequirements || []),
  ];

  // Score projects based on similarity
  const scoredProjects = allProjects
    .filter(p => p.id !== referenceProject.id)
    .map(project => {
      let similarityScore = 0;

      // Category match (40 points)
      if (project.category === referenceCategory) {
        similarityScore += 40;
      }

      // Location match (30 points)
      if (project.location === referenceLocation) {
        similarityScore += 30;
      }

      // Skills match (30 points)
      const projectSkills = [
        ...(project.requiredSkills || []),
        ...(project.preferredSkills || []),
        ...(project.skillRequirements || []),
      ];
      if (projectSkills.length > 0 && referenceSkills.length > 0) {
        const matchingSkills = projectSkills.filter(skill =>
          referenceSkills.some(refSkill =>
            refSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(refSkill.toLowerCase())
          )
        );
        if (matchingSkills.length > 0) {
          const skillMatchRatio = matchingSkills.length / Math.max(projectSkills.length, referenceSkills.length);
          similarityScore += skillMatchRatio * 30;
        }
      }

      return { project, similarityScore };
    });

  // Sort by similarity score and return top projects
  return scoredProjects
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit)
    .map(item => item.project);
};

/**
 * Get popular projects (based on participant count and engagement)
 */
export const getPopularProjects = (
  projects: ProjectSubmission[],
  limit: number = 10
): ProjectSubmission[] => {
  return projects
    .map(project => {
      const popularityScore =
        (project.participantIds?.length || 0) * 2 + // Participants
        (project.expectedVolunteers || 0) + // Expected volunteers
        (project.peopleImpacted || 0) / 100; // Impact scale

      return { project, popularityScore };
    })
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit)
    .map(item => item.project);
};

/**
 * Get trending projects (recently popular projects)
 */
export const getTrendingProjects = (
  projects: ProjectSubmission[],
  limit: number = 10
): ProjectSubmission[] => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return projects
    .filter(project => {
      const submittedAt = project.submittedAt?.toDate?.() || new Date(project.submittedAt || 0);
      return submittedAt >= sevenDaysAgo;
    })
    .map(project => {
      const trendScore =
        (project.participantIds?.length || 0) * 3 + // Recent participants
        (project.expectedVolunteers || 0) * 1.5; // Expected volunteers

      return { project, trendScore };
    })
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit)
    .map(item => item.project);
};

/**
 * Get projects popular in user's area
 */
export const getPopularInArea = (
  projects: ProjectSubmission[],
  userLocation: string,
  limit: number = 10
): ProjectSubmission[] => {
  const locationLower = userLocation.toLowerCase();

  return projects
    .filter(project => {
      const projectLocation = project.location?.toLowerCase() || '';
      return projectLocation === locationLower ||
        projectLocation.includes(locationLower) ||
        locationLower.includes(projectLocation);
    })
    .map(project => {
      const popularityScore =
        (project.participantIds?.length || 0) * 2 +
        (project.expectedVolunteers || 0) +
        (project.peopleImpacted || 0) / 100;

      return { project, popularityScore };
    })
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit)
    .map(item => item.project);
};

/**
 * Get personalized feed (combination of recommendations)
 */
export const getPersonalizedFeed = (
  projects: ProjectSubmission[],
  options: RecommendationOptions = {}
): ProjectSubmission[] => {
  const { userLocation, limit = 20 } = options;

  // Get different types of recommendations
  const recommended = getRecommendedProjects(projects, options);
  const popular = userLocation 
    ? getPopularInArea(projects, userLocation, 5)
    : getPopularProjects(projects, 5);
  const trending = getTrendingProjects(projects, 5);

  // Combine and deduplicate
  const combined = [
    ...recommended.map(r => r.project),
    ...popular,
    ...trending,
  ];

  // Remove duplicates
  const uniqueProjects = Array.from(
    new Map(combined.map(project => [project.id, project])).values()
  );

  return uniqueProjects.slice(0, limit);
};

