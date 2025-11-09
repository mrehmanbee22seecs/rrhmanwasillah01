import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, TrendingUp, Sparkles, Loader2, Heart } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { ProjectSubmission } from '../types/submissions';
import { useAuth } from '../contexts/AuthContext';
import ProjectCard from '../components/ProjectCard';
import ProjectFilters, { ProjectFilterCriteria } from '../components/ProjectFilters';
import RecommendedProjects from '../components/RecommendedProjects';
import { getRecommendedProjects } from '../services/recommendationService';

const Projects = () => {
  const { currentUser, userData } = useAuth();
  const [approvedProjects, setApprovedProjects] = useState<ProjectSubmission[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectSubmission[]>([]);
  const [displayedProjects, setDisplayedProjects] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'recommended' | 'popular' | 'trending'>('all');
  const [paginationMode, setPaginationMode] = useState<'infinite' | 'pagination' | 'load-more'>('load-more');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchApprovedProjects();
  }, []);

  useEffect(() => {
    // Update displayed projects based on pagination mode
    if (paginationMode === 'pagination') {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setDisplayedProjects(filteredProjects.slice(startIndex, endIndex));
    } else if (paginationMode === 'load-more') {
      setDisplayedProjects(filteredProjects.slice(0, currentPage * itemsPerPage));
    } else {
      // Infinite scroll - handled by intersection observer
      setDisplayedProjects(filteredProjects.slice(0, displayedProjects.length || itemsPerPage));
    }
  }, [filteredProjects, currentPage, paginationMode]);

  // Infinite scroll observer
  useEffect(() => {
    if (paginationMode !== 'infinite' || !observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreProjects();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [paginationMode, hasMore, loadingMore]);

  const fetchApprovedProjects = async () => {
    try {
      setLoading(true);
      const projectsRef = collection(db, 'project_submissions');
      const q = query(
        projectsRef,
        where('status', '==', 'approved'),
        where('isVisible', '==', true),
        orderBy('submittedAt', 'desc'),
        limit(50) // Initial load
      );
      const querySnapshot = await getDocs(q);

      const projects: ProjectSubmission[] = [];
      querySnapshot.docs.forEach((doc: QueryDocumentSnapshot, index: number) => {
        const project = doc.data();
        projects.push({
          id: doc.id,
          title: project.title,
          description: project.description,
          category: project.category,
          location: project.location,
          address: project.address || '',
          latitude: project.latitude,
          longitude: project.longitude,
          startDate: project.startDate,
          endDate: project.endDate,
          expectedVolunteers: project.expectedVolunteers,
          requirements: project.requirements || [],
          objectives: project.objectives || [],
          targetAudience: project.targetAudience,
          durationEstimate: project.durationEstimate,
          resourceRequirements: project.resourceRequirements || [],
          skillRequirements: project.skillRequirements || [],
          requiredSkills: project.requiredSkills || [],
          preferredSkills: project.preferredSkills || [],
          notes: project.notes,
          checklist: project.checklist || [],
          reminders: project.reminders || [],
          contactEmail: project.contactEmail,
          contactPhone: project.contactPhone,
          budget: project.budget,
          timeline: project.timeline,
          submittedBy: project.submittedBy,
          submitterName: project.submitterName,
          submitterEmail: project.submitterEmail,
          status: project.status,
          submittedAt: project.submittedAt,
          reviewedAt: project.reviewedAt,
          reviewedBy: project.reviewedBy,
          adminComments: project.adminComments,
          rejectionReason: project.rejectionReason,
          image: project.image,
          auditTrail: project.auditTrail || [],
          participantIds: project.participantIds || [],
          peopleImpacted: project.peopleImpacted || 0,
          affiliation: project.affiliation,
          heads: project.heads || [],
        } as ProjectSubmission);

        // Store last visible document for pagination
        if (index === querySnapshot.docs.length - 1) {
          setLastVisible(doc);
        }
      });

      console.log(`✓ Loaded ${projects.length} approved projects`);
      setApprovedProjects(projects);
      setHasMore(querySnapshot.docs.length === 50);
    } catch (error: any) {
      console.error('❌ Error fetching approved projects:', error);
      if (error?.message?.includes('index')) {
        console.error(`
🔥 FIRESTORE INDEX MISSING FOR PROJECT_SUBMISSIONS! 🔥

Required composite index:
  Collection: project_submissions
  Fields: status (ASC), isVisible (ASC), submittedAt (DESC)

To fix: Run 'firebase deploy --only firestore:indexes'
Or create the index in Firebase Console.
        `);
      }
      setApprovedProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProjects = useCallback(async () => {
    if (!lastVisible || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const projectsRef = collection(db, 'project_submissions');
      const q = query(
        projectsRef,
        where('status', '==', 'approved'),
        where('isVisible', '==', true),
        orderBy('submittedAt', 'desc'),
        startAfter(lastVisible),
        limit(50)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const newProjects: ProjectSubmission[] = [];
      querySnapshot.docs.forEach((doc: QueryDocumentSnapshot, index: number) => {
        const project = doc.data();
        newProjects.push({
          id: doc.id,
          ...project,
          requirements: project.requirements || [],
          objectives: project.objectives || [],
          resourceRequirements: project.resourceRequirements || [],
          skillRequirements: project.skillRequirements || [],
          requiredSkills: project.requiredSkills || [],
          preferredSkills: project.preferredSkills || [],
          checklist: project.checklist || [],
          reminders: project.reminders || [],
          auditTrail: project.auditTrail || [],
          participantIds: project.participantIds || [],
          peopleImpacted: project.peopleImpacted || 0,
          heads: project.heads || [],
        } as ProjectSubmission);

        if (index === querySnapshot.docs.length - 1) {
          setLastVisible(doc);
        }
      });

      setApprovedProjects((prev: ProjectSubmission[]) => [...prev, ...newProjects]);
      setHasMore(querySnapshot.docs.length === 50);
    } catch (error) {
      console.error('Error loading more projects:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, hasMore]);

  // Handle filter changes
  const handleFilterChange = useCallback((_criteria: ProjectFilterCriteria) => {
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handleProjectsFiltered = useCallback((filtered: ProjectSubmission[]) => {
    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Get available options for filters
  const availableCategories = Array.from(new Set(approvedProjects.map((p: ProjectSubmission) => p.category))).filter(Boolean);
  const availableLocations = Array.from(new Set(approvedProjects.map((p: ProjectSubmission) => p.location))).filter(Boolean);
  const availableSkills = Array.from(new Set(
    approvedProjects.flatMap((p: ProjectSubmission) => [
      ...(p.requiredSkills || []),
      ...(p.preferredSkills || []),
      ...(p.skillRequirements || []),
    ])
  )).filter(Boolean);
  const userSkills = (userData as any)?.skills || [];

  // Get recommended projects
  const recommendedProjects = currentUser && userData
    ? getRecommendedProjects(approvedProjects, {
        userProfile: userData as any,
        userLocation: (userData as any)?.location || (userData as any)?.city || '',
        userSkills: (userData as any)?.skills || [],
        userInterests: (userData as any)?.interests || [],
        limit: 6,
      }).map(r => r.project)
    : [];

  // Projects to display based on view mode
  const projectsToDisplay = viewMode === 'recommended' && recommendedProjects.length > 0
    ? recommendedProjects
    : displayedProjects;

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-white via-white to-cream-white">
      {/* Hero Section - Enhanced */}
      <div className="hero-luxury-bg hero-projects text-cream-elegant py-20 relative overflow-hidden">
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-vibrant-orange/20 rounded-full animate-float-gentle"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-logo-teal/20 rounded-full animate-float-gentle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-vibrant-orange-light/15 rounded-full animate-float-gentle" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-cinematic-fade">
            <h1 className="text-6xl md:text-7xl font-modern-display mb-8 animate-text-reveal">
              Our Projects
            </h1>
            <p className="text-2xl font-elegant-body max-w-4xl mx-auto animate-text-reveal" style={{animationDelay: '0.3s'}}>
              Transforming communities through sustainable initiatives and collaborative efforts
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-luxury p-1 shadow-lg border-2 border-logo-navy/10">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-luxury transition-colors ${
                  viewMode === 'all'
                    ? 'bg-vibrant-orange text-white'
                    : 'text-logo-navy hover:bg-vibrant-orange/10'
                }`}
              >
                All Projects
              </button>
              {currentUser && (
                <button
                  onClick={() => setViewMode('recommended')}
                  className={`px-4 py-2 rounded-luxury transition-colors flex items-center gap-2 ${
                    viewMode === 'recommended'
                      ? 'bg-vibrant-orange text-white'
                      : 'text-logo-navy hover:bg-vibrant-orange/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Recommended
                </button>
              )}
            </div>

            {/* Pagination Mode Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-luxury p-1 shadow-lg border-2 border-logo-navy/10">
              <button
                onClick={() => setPaginationMode('load-more')}
                className={`px-3 py-1 rounded-luxury text-xs transition-colors ${
                  paginationMode === 'load-more'
                    ? 'bg-logo-teal text-white'
                    : 'text-logo-navy hover:bg-logo-teal/10'
                }`}
                title="Load More Button"
              >
                Load More
              </button>
              <button
                onClick={() => setPaginationMode('infinite')}
                className={`px-3 py-1 rounded-luxury text-xs transition-colors ${
                  paginationMode === 'infinite'
                    ? 'bg-logo-teal text-white'
                    : 'text-logo-navy hover:bg-logo-teal/10'
                }`}
                title="Infinite Scroll"
              >
                Infinite
              </button>
              <button
                onClick={() => setPaginationMode('pagination')}
                className={`px-3 py-1 rounded-luxury text-xs transition-colors ${
                  paginationMode === 'pagination'
                    ? 'bg-logo-teal text-white'
                    : 'text-logo-navy hover:bg-logo-teal/10'
                }`}
                title="Pagination"
              >
                Pages
              </button>
            </div>
          </div>

          <Link
            to="/create-submission?type=project"
            className="btn-luxury-primary px-6 py-3 inline-flex items-center shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Project
          </Link>
        </div>

        {/* Recommended Projects Section (when view mode is recommended) */}
        {viewMode === 'recommended' && currentUser && (
          <div className="mb-8">
            <RecommendedProjects
              projects={approvedProjects}
              variant="personalized"
              limit={12}
              showMatchScore={true}
            />
          </div>
        )}

        {/* Advanced Filters */}
        {viewMode === 'all' && (
          <ProjectFilters
            projects={approvedProjects}
            onFilterChange={handleFilterChange}
            onProjectsFiltered={handleProjectsFiltered}
            availableCategories={availableCategories}
            availableLocations={availableLocations}
            availableSkills={availableSkills}
            userSkills={userSkills}
          />
        )}

        {/* Results Count */}
        <div className="mb-6 text-logo-navy font-luxury-body font-semibold">
          {viewMode === 'recommended' ? (
            <span>Showing {recommendedProjects.length} recommended projects</span>
          ) : (
            <span>Showing {displayedProjects.length} of {filteredProjects.length} projects</span>
          )}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
            <p className="text-xl font-luxury-heading text-logo-navy">Loading projects...</p>
          </div>
        ) : viewMode === 'recommended' && recommendedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedProjects.map((project: ProjectSubmission) => {
              const matchScore = getRecommendedProjects([project], {
                userProfile: userData as any,
                userLocation: (userData as any)?.location || (userData as any)?.city || '',
                userSkills: (userData as any)?.skills || [],
                userInterests: (userData as any)?.interests || [],
                limit: 1,
              })[0]?.score || 0;

              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  matchScore={matchScore}
                  showMatchScore={true}
                />
              );
            })}
          </div>
        ) : projectsToDisplay.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsToDisplay.map((project: ProjectSubmission) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  showMatchScore={viewMode === 'recommended'}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {paginationMode === 'pagination' && totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border-2 border-logo-navy/30 rounded-luxury disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vibrant-orange/10 transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i: number) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-luxury transition-colors ${
                        currentPage === pageNum
                          ? 'bg-vibrant-orange text-white'
                          : 'bg-white border-2 border-logo-navy/30 hover:bg-vibrant-orange/10'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border-2 border-logo-navy/30 rounded-luxury disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vibrant-orange/10 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Load More Button */}
            {paginationMode === 'load-more' && displayedProjects.length < filteredProjects.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setCurrentPage((prev: number) => prev + 1)}
                  className="btn-luxury-primary px-8 py-3 inline-flex items-center shadow-lg hover:shadow-xl"
                >
                  Load More Projects
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            )}

            {/* Infinite Scroll Target */}
            {paginationMode === 'infinite' && hasMore && (
              <div ref={observerTarget} className="mt-8 text-center py-8">
                {loadingMore ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-vibrant-orange mr-2" />
                    <span className="text-logo-navy-light">Loading more projects...</span>
                  </div>
                ) : (
                  <div className="text-logo-navy-light">Scroll to load more...</div>
                )}
              </div>
            )}

            {/* End of Results */}
            {!hasMore && displayedProjects.length === filteredProjects.length && (
              <div className="mt-8 text-center text-logo-navy-light">
                <p>You've reached the end of the results.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl border-2 border-logo-navy/10">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-luxury-heading text-logo-navy mb-4">No Projects Found</h3>
            <p className="text-logo-navy-light font-luxury-body mb-6">
              {viewMode === 'recommended'
                ? 'Complete your profile with skills and interests to get personalized recommendations.'
                : 'Try adjusting your filters or search terms to find more projects.'}
            </p>
            {viewMode === 'all' && (
              <button
                onClick={() => {
                  // Filters will be cleared by ProjectFilters component
                  window.location.reload();
                }}
                className="btn-luxury-primary px-6 py-3 shadow-lg hover:shadow-xl"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Statistics Section - ENHANCED with Better Visibility */}
      <div className="bg-gradient-to-br from-logo-navy via-logo-navy-light to-logo-navy py-20 relative overflow-hidden">
        <div className="particle-container absolute inset-0 opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/10 to-logo-teal/10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 scroll-reveal">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-vibrant-orange rounded-full mb-6 animate-pulse-glow">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-5xl font-modern-display text-cream-elegant mb-6">
              Our Impact in Numbers
            </h2>
            <p className="text-2xl text-cream-elegant/90 font-elegant-body max-w-2xl mx-auto">
              Together, we're making a measurable difference in communities across Pakistan
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-animation">
            <div className="text-center floating-card magnetic-element group bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 hover:border-vibrant-orange/50 transition-all duration-300 hover:shadow-2xl">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4 group-hover:animate-pulse-glow group-hover:scale-110 transition-transform">6</div>
              <div className="text-2xl font-bold text-cream-elegant mb-2 group-hover:text-vibrant-orange-light transition-colors">Active Projects</div>
              <p className="text-cream-elegant/70 font-luxury-body text-sm">Currently running initiatives</p>
            </div>
            <div className="text-center floating-card magnetic-element group bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 hover:border-logo-teal/50 transition-all duration-300 hover:shadow-2xl">
              <div className="text-6xl font-luxury-display text-logo-teal mb-4 group-hover:animate-pulse-glow group-hover:scale-110 transition-transform">208</div>
              <div className="text-2xl font-bold text-cream-elegant mb-2 group-hover:text-logo-teal-light transition-colors">Volunteers</div>
              <p className="text-cream-elegant/70 font-luxury-body text-sm">Dedicated community members</p>
            </div>
            <div className="text-center floating-card magnetic-element group bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 hover:border-vibrant-orange/50 transition-all duration-300 hover:shadow-2xl">
              <div className="text-6xl font-luxury-display text-vibrant-orange-light mb-4 group-hover:animate-pulse-glow group-hover:scale-110 transition-transform">1,670</div>
              <div className="text-2xl font-bold text-cream-elegant mb-2 group-hover:text-vibrant-orange-light transition-colors">People Helped</div>
              <p className="text-cream-elegant/70 font-luxury-body text-sm">Lives positively impacted</p>
            </div>
            <div className="text-center floating-card magnetic-element group bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 hover:border-logo-teal/50 transition-all duration-300 hover:shadow-2xl">
              <div className="text-6xl font-luxury-display text-logo-teal-light mb-4 group-hover:animate-pulse-glow group-hover:scale-110 transition-transform">12</div>
              <div className="text-2xl font-bold text-cream-elegant mb-2 group-hover:text-logo-teal-light transition-colors">Communities</div>
              <p className="text-cream-elegant/70 font-luxury-body text-sm">Areas served nationwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action - Enhanced */}
      <div className="cta-parallax py-20 text-cream-elegant relative overflow-hidden bg-gradient-to-r from-vibrant-orange to-vibrant-orange-dark">
        <div className="absolute inset-0">
          <div className="floating-3d-luxury opacity-30 magnetic-element"></div>
          <div className="floating-3d-luxury opacity-20 magnetic-element"></div>
          <div className="floating-3d-luxury opacity-25 magnetic-element"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="scroll-reveal">
            <h2 className="text-5xl font-modern-display mb-6 animate-text-reveal text-white">
              Join Our Mission
            </h2>
            <p className="text-2xl text-white/90 font-elegant-body mb-10 animate-text-reveal leading-relaxed" style={{animationDelay: '0.3s'}}>
              Be part of meaningful projects that create lasting positive change in communities across Pakistan
            </p>
            <Link
              to="/volunteer"
              className="inline-flex items-center px-10 py-5 bg-white text-vibrant-orange rounded-luxury font-luxury-semibold text-xl hover:bg-cream-elegant transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-110 transform animate-text-reveal"
              style={{animationDelay: '0.6s'}}
            >
              Get Involved Today
              <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;