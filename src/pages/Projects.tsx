import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, Droplets, Smartphone, Utensils, Wrench, ChevronRight, Users, Calendar, Filter, Search, Plus, Star, Award, Target, TrendingUp } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ProjectSubmission } from '../types/submissions';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useMagneticEffect } from '../hooks/useMagneticEffect';

const Projects = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvedProjects, setApprovedProjects] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const staticProjects = [
    {
      id: 'education-support',
      title: 'Education Support Program',
      description: 'Providing educational resources, tutoring, and scholarships to underprivileged children in our community.',
      icon: BookOpen,
      image: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'ongoing',
      volunteers: 45,
      beneficiaries: 200,
      duration: '12 months',
      category: 'Education',
      location: 'Karachi',
      deadline: 'April 30, 2024'
    },
    {
      id: 'healthcare-access',
      title: 'Healthcare Access Initiative',
      description: 'Improving healthcare accessibility through mobile clinics, health education, and medical assistance programs.',
      icon: Heart,
      image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'ongoing',
      volunteers: 32,
      beneficiaries: 500,
      duration: '18 months',
      category: 'Healthcare',
      location: 'Lahore',
      deadline: 'May 15, 2024'
    },
    {
      id: 'clean-water',
      title: 'Clean Water Project',
      description: 'Installing water purification systems and educating communities about water safety and hygiene practices.',
      icon: Droplets,
      image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'planning',
      volunteers: 25,
      beneficiaries: 300,
      duration: '24 months',
      category: 'Infrastructure',
      location: 'Islamabad',
      deadline: 'June 10, 2024'
    },
    {
      id: 'digital-literacy',
      title: 'Digital Literacy Program',
      description: 'Teaching essential digital skills to help community members access online services and opportunities.',
      icon: Smartphone,
      image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'ongoing',
      volunteers: 18,
      beneficiaries: 150,
      duration: '6 months',
      category: 'Technology',
      location: 'Faisalabad',
      deadline: 'April 20, 2024'
    },
    {
      id: 'food-distribution',
      title: 'Food Distribution Network',
      description: 'Organizing regular food drives and establishing sustainable food distribution systems for families in need.',
      icon: Utensils,
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'ongoing',
      volunteers: 60,
      beneficiaries: 400,
      duration: 'Ongoing',
      category: 'Food Security',
      location: 'Multiple Cities',
      deadline: 'Open Applications'
    },
    {
      id: 'skills-development',
      title: 'Skills Development Workshop',
      description: 'Providing vocational training and skill development programs to enhance employment opportunities.',
      icon: Wrench,
      image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'completed',
      volunteers: 28,
      beneficiaries: 120,
      duration: '8 months',
      category: 'Employment',
      location: 'Peshawar',
      deadline: 'Completed'
    }
  ];

  const categories = ['all', 'Education', 'Healthcare', 'Infrastructure', 'Technology', 'Food Security', 'Employment'];
  const statuses = ['all', 'ongoing', 'completed', 'planning'];

  useEffect(() => {
    fetchApprovedProjects();
  }, []);

  const fetchApprovedProjects = async () => {
    try {
      const projectsRef = collection(db, 'project_submissions');
      const q = query(
        projectsRef,
        where('status', '==', 'approved'),
        where('isVisible', '==', true),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const projects: ProjectSubmission[] = querySnapshot.docs.map(doc => {
        const project = doc.data();
        return {
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
          resourceRequirements: [],
          skillRequirements: [],
          notes: project.notes,
          checklist: [],
          reminders: [],
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
          auditTrail: []
        };
      });

      console.log(`✓ Loaded ${projects.length} approved projects`);
      setApprovedProjects(projects);
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

  const convertedApprovedProjects = approvedProjects.map(project => ({
    id: project.id,
    title: project.title,
    description: (project as any).shortSummary || project.description,
    icon: BookOpen,
    image: project.image || 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800',
    status: 'ongoing',
    volunteers: project.expectedVolunteers,
    beneficiaries: project.peopleImpacted || 0,
    duration: project.timeline,
    category: project.category,
    location: project.location,
    deadline: 'Open Applications',
    affiliation: project.affiliation
  }));

  const allProjects = [...staticProjects, ...convertedApprovedProjects];

  const filteredProjects = allProjects.filter(project => {
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'Active';
      case 'planning':
        return 'Planning';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Education':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Healthcare':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Infrastructure':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Technology':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Food Security':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Employment':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

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

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Project Button */}
        <div className="mb-6 flex justify-end">
          <Link
            to="/create-submission?type=project"
            className="btn-luxury-primary px-6 py-3 inline-flex items-center shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Project
          </Link>
        </div>

        <div className="luxury-card bg-white p-8 mb-8 scroll-reveal shadow-xl border-2 border-logo-navy/10">
          <div className="flex items-center mb-6">
            <Filter className="w-6 h-6 text-vibrant-orange mr-3 animate-pulse-glow" />
            <h2 className="text-2xl font-luxury-heading text-logo-navy">Filter Projects</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block font-luxury-medium text-logo-navy mb-2">Search Projects</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body text-logo-navy"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block font-luxury-medium text-logo-navy mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body text-logo-navy bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block font-luxury-medium text-logo-navy mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body text-logo-navy bg-white"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          <div className="mt-6 flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <span className="px-3 py-1 bg-vibrant-orange/20 text-vibrant-orange-dark rounded-full text-sm font-luxury-semibold">
                Category: {selectedCategory}
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 text-vibrant-orange-dark hover:text-vibrant-orange"
                >
                  ×
                </button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="px-3 py-1 bg-vibrant-orange/20 text-vibrant-orange-dark rounded-full text-sm font-luxury-semibold">
                Status: {selectedStatus}
                <button 
                  onClick={() => setSelectedStatus('all')}
                  className="ml-2 text-vibrant-orange-dark hover:text-vibrant-orange"
                >
                  ×
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="px-3 py-1 bg-vibrant-orange/20 text-vibrant-orange-dark rounded-full text-sm font-luxury-semibold">
                Search: "{searchTerm}"
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-2 text-vibrant-orange-dark hover:text-vibrant-orange"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 text-logo-navy font-luxury-body font-semibold">
            Showing {filteredProjects.length} of {allProjects.length} projects
          </div>
        </div>

        {/* NEW: Introduction Section Before Projects */}
        <div className="luxury-card bg-gradient-to-br from-logo-navy to-logo-navy-light p-12 mb-12 scroll-reveal shadow-2xl rounded-2xl border-2 border-logo-teal/30">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-vibrant-orange rounded-full mb-4 animate-pulse-glow">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-modern-display text-cream-elegant mb-4">
              Discover Our Impact Projects
            </h2>
            <p className="text-xl text-cream-elegant/90 font-elegant-body max-w-3xl mx-auto leading-relaxed">
              Each project represents our commitment to creating sustainable change across Pakistan. 
              From education and healthcare to environmental conservation and community development, 
              we work hand-in-hand with local communities to address their most pressing needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <TrendingUp className="w-10 h-10 text-vibrant-orange mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-cream-elegant mb-2">100%</h3>
              <p className="text-cream-elegant/80 font-luxury-body">Community-Driven</p>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Award className="w-10 h-10 text-logo-teal mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-cream-elegant mb-2">Transparent</h3>
              <p className="text-cream-elegant/80 font-luxury-body">Full Accountability</p>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Heart className="w-10 h-10 text-vibrant-orange-light mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-cream-elegant mb-2">Impactful</h3>
              <p className="text-cream-elegant/80 font-luxury-body">Measurable Results</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/about"
              className="inline-flex items-center px-8 py-4 bg-vibrant-orange text-cream-elegant rounded-luxury font-luxury-semibold text-lg hover:bg-vibrant-orange-light transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              Learn More About Us
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
            <p className="text-xl font-luxury-heading text-logo-navy">Loading projects...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-animation">
          {filteredProjects.map((project) => {
            const IconComponent = project.icon;
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="luxury-card bg-white rounded-luxury-lg shadow-xl overflow-hidden floating-card magnetic-element group border-2 border-logo-navy/10 hover:border-vibrant-orange/50 transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)} shadow-lg`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2 group-hover:animate-pulse-glow shadow-lg">
                    <IconComponent className="w-6 h-6 text-vibrant-orange group-hover:animate-float-gentle" />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full border ${getCategoryColor(project.category)}`}>
                      {project.category}
                    </span>
                    <span className="text-sm text-logo-navy-light font-semibold">{project.location}</span>
                  </div>
                  
                  <h3 className="text-xl font-luxury-heading text-logo-navy mb-3 group-hover:text-gradient-animated transition-all duration-500">
                    {project.title}
                  </h3>
                  
                  {project.affiliation && project.affiliation.name && (
                    <div className="text-xs text-vibrant-orange-dark font-semibold mb-2 flex items-center">
                      <span className="mr-1">🏢</span>
                      {project.affiliation.name}
                      {(project.affiliation.customType || project.affiliation.type) && (
                        <span className="text-logo-navy-light ml-1">
                          • {project.affiliation.customType || project.affiliation.type}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-logo-navy-light font-luxury-body text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2 mb-4 bg-cream-white p-3 rounded-lg border border-logo-navy/10">
                    <div className="flex items-center justify-between text-sm text-logo-navy-light font-semibold">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-vibrant-orange" />
                        <span>{project.volunteers} volunteers</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-logo-teal" />
                        <span>{project.duration}</span>
                      </div>
                    </div>
                    {project.beneficiaries > 0 && (
                      <div className="text-sm text-logo-navy-light font-semibold">
                        <span className="font-bold text-logo-navy">{project.beneficiaries.toLocaleString()}</span> people impacted
                      </div>
                    )}
                    <div className="text-sm text-vibrant-orange-dark font-bold">
                      Apply by: {project.deadline}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-logo-navy/10">
                    <div className="flex items-center text-vibrant-orange font-bold group-hover:text-vibrant-orange-light transition-colors">
                      <span className="text-sm">Learn More</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        )}

        {/* No Results */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl border-2 border-logo-navy/10">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-luxury-heading text-logo-navy mb-4">No Projects Found</h3>
            <p className="text-logo-navy-light font-luxury-body mb-6">
              Try adjusting your filters or search terms to find more projects.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="btn-luxury-primary px-6 py-3 shadow-lg hover:shadow-xl"
            >
              Clear All Filters
            </button>
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