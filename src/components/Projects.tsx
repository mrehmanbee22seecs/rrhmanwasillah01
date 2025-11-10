import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, TrendingUp, Search, Filter } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { ProjectSubmission } from '../types/submissions';
import ProjectCard from './ProjectCard';

const Projects = () => {
  const [approvedProjects, setApprovedProjects] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('approved');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch approved projects with realtime listener
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const projectsRef = collection(db, 'project_submissions');
        const q = query(
          projectsRef,
          where('status', '==', 'approved'),
          where('isVisible', '==', true),
          orderBy('submittedAt', 'desc')
        );

        // Use realtime listener for live updates
        unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const projects: ProjectSubmission[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              
              // Defensive mapping with fallbacks to prevent crashes
              projects.push({
                id: doc.id,
                title: data.title || 'Untitled Project',
                description: data.description || '',
                category: data.category || 'Other',
                location: data.location || '',
                address: data.address || '',
                latitude: data.latitude,
                longitude: data.longitude,
                startDate: data.startDate || '',
                endDate: data.endDate || '',
                expectedVolunteers: data.expectedVolunteers || 0,
                requirements: Array.isArray(data.requirements) ? data.requirements : [],
                objectives: Array.isArray(data.objectives) ? data.objectives : [],
                targetAudience: data.targetAudience,
                durationEstimate: data.durationEstimate,
                resourceRequirements: Array.isArray(data.resourceRequirements) ? data.resourceRequirements : [],
                skillRequirements: Array.isArray(data.skillRequirements) ? data.skillRequirements : [],
                requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [],
                preferredSkills: Array.isArray(data.preferredSkills) ? data.preferredSkills : [],
                notes: data.notes,
                checklist: Array.isArray(data.checklist) ? data.checklist : [],
                reminders: Array.isArray(data.reminders) ? data.reminders : [],
                contactEmail: data.contactEmail || '',
                contactPhone: data.contactPhone || '',
                budget: data.budget,
                timeline: data.timeline || '',
                submittedBy: data.submittedBy || '',
                submitterName: data.submitterName || '',
                submitterEmail: data.submitterEmail || '',
                status: data.status || 'pending',
                submittedAt: data.submittedAt,
                reviewedAt: data.reviewedAt,
                reviewedBy: data.reviewedBy,
                adminComments: data.adminComments,
                rejectionReason: data.rejectionReason,
                image: data.image,
                auditTrail: Array.isArray(data.auditTrail) ? data.auditTrail : [],
                participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
                peopleImpacted: data.peopleImpacted || 0,
                affiliation: data.affiliation,
                heads: Array.isArray(data.heads) ? data.heads : [],
                isVisible: data.isVisible !== false,
              } as ProjectSubmission);
            });

            console.log(`✓ Loaded ${projects.length} approved projects from Firestore`);
            setApprovedProjects(projects);
            setLoading(false);
          },
          (error: unknown) => {
            console.error('❌ Error fetching approved projects:', error);
            
            // Helpful error message for missing composite index
            const errorObj = error as { message?: string; code?: string };
            if (errorObj?.message?.includes('index') || errorObj?.code === 'failed-precondition') {
              console.error(`
🔥 FIRESTORE INDEX MISSING! 🔥

Required composite index for project_submissions:
  Collection: project_submissions
  Fields: 
    - status (Ascending)
    - isVisible (Ascending)
    - submittedAt (Descending)

To fix this issue:
1. Run: firebase deploy --only firestore:indexes
2. Or create the index manually in Firebase Console:
   https://console.firebase.google.com/project/_/firestore/indexes

The index creation may take a few minutes to complete.
              `);
            }
            
            // Fallback to static projects on error
            console.log('⚠ Using static projects as fallback');
            setApprovedProjects([]);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('❌ Error setting up projects listener:', error);
        setLoading(false);
      }
    };

    fetchProjects();

    // Cleanup function to unsubscribe from listener
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Use only approved projects (no static projects)
  const allProjects = useMemo(() => {
    return approvedProjects;
  }, [approvedProjects]);

  // Get available categories for filter
  const availableCategories = useMemo(() => {
    const categories = new Set(allProjects.map(p => p.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [allProjects]);

  // Filter projects based on search, category, and status
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      // Status filter
      if (selectedStatus && project.status !== selectedStatus) {
        return false;
      }

      // Category filter
      if (selectedCategory && project.category !== selectedCategory) {
        return false;
      }

      // Search filter (case-insensitive)
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesTitle = project.title?.toLowerCase().includes(searchLower);
        const matchesDescription = project.description?.toLowerCase().includes(searchLower);
        const matchesLocation = project.location?.toLowerCase().includes(searchLower);
        const matchesCategory = project.category?.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesDescription && !matchesLocation && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [allProjects, selectedStatus, selectedCategory, debouncedSearch]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeProjects = allProjects.filter(p => p.status === 'approved').length;
    const totalVolunteers = allProjects.reduce((sum, p) => sum + (p.participantIds?.length || 0), 0);
    const peopleImpacted = allProjects.reduce((sum, p) => sum + (p.peopleImpacted || 0), 0);
    const locations = new Set(allProjects.map(p => p.location).filter(Boolean)).size;

    return {
      activeProjects,
      totalVolunteers,
      peopleImpacted,
      locations,
    };
  }, [allProjects]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-white via-white to-cream-white">
      {/* Hero Section */}
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
          <h2 className="text-3xl font-modern-display text-logo-navy">
            Discover Projects
          </h2>
          <Link
            to="/create-submission?type=project"
            className="btn-luxury-primary px-6 py-3 inline-flex items-center shadow-lg hover:shadow-xl transition-all duration-300"
            aria-label="Add new project"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Project
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-luxury shadow-lg border-2 border-logo-navy/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-logo-navy-light w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-logo-navy/20 rounded-luxury focus:outline-none focus:border-vibrant-orange transition-colors"
                aria-label="Search projects"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-logo-navy-light w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-logo-navy/20 rounded-luxury focus:outline-none focus:border-vibrant-orange transition-colors appearance-none bg-white"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-logo-navy/20 rounded-luxury focus:outline-none focus:border-vibrant-orange transition-colors appearance-none bg-white"
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-logo-navy-light font-luxury-body">
            Showing {filteredProjects.length} of {allProjects.length} projects
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
            <p className="text-xl font-luxury-heading text-logo-navy">Loading projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                variant="default"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl border-2 border-logo-navy/10">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-luxury-heading text-logo-navy mb-4">No Projects Found</h3>
            <p className="text-logo-navy-light font-luxury-body mb-6">
              Try adjusting your filters or search terms to find more projects.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('approved');
              }}
              className="btn-luxury-primary px-6 py-3 shadow-lg hover:shadow-xl"
              aria-label="Clear all filters"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Statistics Section */}
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
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4 group-hover:animate-pulse-glow group-hover:scale-110 transition-transform">
                {stats.activeProjects}
              </div>
              <div className="text-2xl font-bold text-cream-elegant mb-2 group-hover:text-vibrant-orange-light transition-colors">Active Projects</div>
              <p className="text-cream-elegant/70 font-luxury-body text-sm">Currently running initiatives</p>
            </div>
            <div className="text-center floating-card magnetic-element group bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 hover:border-logo-teal/50 transition-all duration-300 hover:shadow-2xl">
              <div className="text-6xl font-luxury-display text-logo-teal mb-4 group-hover:animate-pulse-glow group-hover:scale-110 transition-transform">
                {stats.totalVolunteers}
              </div>
              <div className="text-2xl font-bold text-cream-elegant mb-2 group-hover:text-logo-teal-light transition-colors">Volunteers</div>
              <p className="text-cream-elegant/70 font-luxury-body text-sm">Dedicated community members</p>
            </div>
            <div className="text-center floating-card magnetic-element group bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 hover:border-vibrant-orange/50 transition-all duration-300 hover:shadow-2xl">
              <div className="text-6xl font-luxury-display text-vibrant-orange-light mb-4 group-hover:animate-pulse-glow group-hover:scale-110 transition-transform">
                {stats.peopleImpacted.toLocaleString()}
              </div>
              <div className="text-2xl font-bold text-cream-elegant mb-2 group-hover:text-vibrant-orange-light transition-colors">People Helped</div>
              <p className="text-cream-elegant/70 font-luxury-body text-sm">Lives positively impacted</p>
            </div>
            <div className="text-center floating-card magnetic-element group bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 hover:border-logo-teal/50 transition-all duration-300 hover:shadow-2xl">
              <div className="text-6xl font-luxury-display text-logo-teal-light mb-4 group-hover:animate-pulse-glow group-hover:scale-110 transition-transform">
                {stats.locations}
              </div>
              <div className="text-2xl font-bold text-cream-elegant mb-2 group-hover:text-logo-teal-light transition-colors">Communities</div>
              <p className="text-cream-elegant/70 font-luxury-body text-sm">Areas served nationwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
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
              aria-label="Get involved as a volunteer"
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
