import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, ChevronRight, Filter, Search, Heart, BookOpen, Wrench, Leaf, Plus, Star, Award } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { EventSubmission } from '../types/submissions';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useMagneticEffect } from '../hooks/useMagneticEffect';

const Events = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvedEvents, setApprovedEvents] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const staticEvents = [
    {
      id: 'health-fair',
      title: 'Community Health Fair',
      date: '2024-04-15',
      time: '9:00 AM - 4:00 PM',
      location: 'Central Community Center, Karachi',
      description: 'Free health screenings, vaccinations, and wellness education for all community members.',
      image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'upcoming',
      volunteers: 25,
      capacity: 500,
      category: 'Health',
      icon: Heart,
      registrationDeadline: 'April 10, 2024',
      cost: 'Free'
    },
    {
      id: 'educational-workshops',
      title: 'Educational Workshop Series',
      date: '2024-04-20',
      time: '2:00 PM - 5:00 PM',
      location: 'Waseela Training Center, Lahore',
      description: 'Interactive learning sessions covering digital literacy, financial planning, and career development.',
      image: 'https://images.pexels.com/photos/7516359/pexels-photo-7516359.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'upcoming',
      volunteers: 15,
      capacity: 80,
      category: 'Education',
      icon: BookOpen,
      registrationDeadline: 'April 17, 2024',
      cost: 'Free'
    },
    {
      id: 'volunteer-training',
      title: 'Volunteer Training Session',
      date: '2024-04-25',
      time: '10:00 AM - 3:00 PM',
      location: 'Multiple Locations',
      description: 'Comprehensive training for new volunteers covering our programs, safety protocols, and community engagement.',
      image: 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'upcoming',
      volunteers: 8,
      capacity: 60,
      category: 'Training',
      icon: Wrench,
      registrationDeadline: 'April 22, 2024',
      cost: 'Free'
    },
    {
      id: 'cleanup-drive',
      title: 'Clean-up Drive & Tree Plantation',
      date: '2024-05-01',
      time: '7:00 AM - 12:00 PM',
      location: 'Various Parks & Communities',
      description: 'Community-wide environmental initiative focusing on waste management and urban forestry.',
      image: 'https://images.pexels.com/photos/9324574/pexels-photo-9324574.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'upcoming',
      volunteers: 30,
      capacity: 200,
      category: 'Environment',
      icon: Leaf,
      registrationDeadline: 'April 28, 2024',
      cost: 'Free'
    },
    {
      id: 'ramadan-iftar',
      title: 'Community Ramadan Iftar',
      date: '2024-03-25',
      time: '6:30 PM - 8:30 PM',
      location: 'City Park, Islamabad',
      description: 'Special iftar gathering bringing together community members during the holy month of Ramadan.',
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'completed',
      volunteers: 40,
      capacity: 300,
      category: 'Community',
      icon: Heart,
      registrationDeadline: 'Completed',
      cost: 'Free'
    },
    {
      id: 'skills-expo',
      title: 'Skills Development Expo',
      date: '2024-05-15',
      time: '10:00 AM - 6:00 PM',
      location: 'Convention Center, Faisalabad',
      description: 'Showcase of vocational skills, job opportunities, and entrepreneurship resources for youth.',
      image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'upcoming',
      volunteers: 35,
      capacity: 400,
      category: 'Employment',
      icon: Wrench,
      registrationDeadline: 'May 10, 2024',
      cost: 'Free'
    }
  ];

  const categories = ['all', 'Health', 'Education', 'Training', 'Environment', 'Community', 'Employment'];
  const months = ['all', 'March', 'April', 'May', 'June'];

  useEffect(() => {
    fetchApprovedEvents();
  }, []);

  const fetchApprovedEvents = async () => {
    try {
      const eventsRef = collection(db, 'event_submissions');
      const q = query(
        eventsRef,
        where('status', '==', 'approved'),
        where('isVisible', '==', true),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const events: EventSubmission[] = querySnapshot.docs.map(doc => {
        const event = doc.data();
        return {
          id: doc.id,
          title: event.title,
          description: event.description,
          category: event.category,
          date: event.date,
          time: event.time,
          location: event.location,
          address: event.address || '',
          latitude: event.latitude,
          longitude: event.longitude,
          expectedAttendees: event.expectedAttendees,
          registrationDeadline: event.registrationDeadline,
          requirements: event.requirements || [],
          agenda: event.agenda || [],
          targetAudience: event.targetAudience,
          durationEstimate: event.durationEstimate,
          resourceRequirements: [],
          skillRequirements: [],
          notes: event.notes,
          checklist: [],
          reminders: [],
          contactEmail: event.contactEmail,
          contactPhone: event.contactPhone,
          cost: event.cost,
          submittedBy: event.submittedBy,
          submitterName: event.submitterName,
          submitterEmail: event.submitterEmail,
          status: event.status,
          submittedAt: event.submittedAt,
          reviewedAt: event.reviewedAt,
          reviewedBy: event.reviewedBy,
          adminComments: event.adminComments,
          rejectionReason: event.rejectionReason,
          image: event.image,
          auditTrail: []
        };
      });

      console.log(`✓ Loaded ${events.length} approved events`);
      setApprovedEvents(events);
    } catch (error: any) {
      console.error('❌ Error fetching approved events:', error);
      if (error?.message?.includes('index')) {
        console.error(`
🔥 FIRESTORE INDEX MISSING FOR EVENT_SUBMISSIONS! 🔥

Required composite index:
  Collection: event_submissions
  Fields: status (ASC), isVisible (ASC), submittedAt (DESC)

To fix: Run 'firebase deploy --only firestore:indexes'
Or create the index in Firebase Console.
        `);
      }
      // Set empty array so page still renders with static events
      setApprovedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Convert approved events to match the expected format
  const convertedApprovedEvents = approvedEvents.map(event => {
    const now = new Date();
    const date = event.date ? new Date(event.date) : null;
    const status = date ? (now < date ? 'upcoming' : now.toDateString() === date.toDateString() ? 'active' : 'completed') : 'upcoming';
    return ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: (event as any).shortSummary || event.description,
      image: event.image || 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
      status,
      volunteers: 25,
      capacity: event.expectedAttendees,
      beneficiaries: event.peopleImpacted || 0,
      category: event.category,
      icon: Heart,
      registrationDeadline: event.registrationDeadline,
      cost: event.cost,
      affiliation: event.affiliation
    });
  });

  // Combine static events with approved user submissions
  const allEvents = [...staticEvents, ...convertedApprovedEvents];

  const filteredEvents = allEvents.filter(event => {
    const eventDate = new Date(event.date);
    const eventMonth = eventDate.toLocaleString('default', { month: 'long' });
    
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesMonth = selectedMonth === 'all' || eventMonth === selectedMonth;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesMonth && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Health':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Education':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Training':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Environment':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Community':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Employment':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Enhanced */}
      <div className="hero-luxury-bg hero-events text-cream-elegant py-20 relative overflow-hidden">
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-vibrant-orange/20 rounded-full animate-float-gentle"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-logo-teal/20 rounded-full animate-float-gentle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-vibrant-orange-light/15 rounded-full animate-float-gentle" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-cinematic-fade">
            <h1 className="text-6xl md:text-7xl font-modern-display mb-8 animate-text-reveal">
              Community Events
            </h1>
            <p className="text-2xl font-elegant-body max-w-4xl mx-auto animate-text-reveal" style={{animationDelay: '0.3s'}}>
              Join us in making a difference through meaningful community gatherings and activities
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Event Button */}
        <div className="mb-6 flex justify-end">
          <Link
            to="/create-submission?type=event"
            className="btn-luxury-primary px-6 py-3 inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Event
          </Link>
        </div>

        <div className="luxury-card bg-cream-white p-8 mb-8">
          <div className="flex items-center mb-6">
            <Filter className="w-6 h-6 text-vibrant-orange mr-3" />
            <h2 className="text-2xl font-luxury-heading text-black">Filter Events</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block font-luxury-medium text-black mb-2">Search Events</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block font-luxury-medium text-black mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block font-luxury-medium text-black mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {month === 'all' ? 'All Months' : month}
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
            {selectedMonth !== 'all' && (
              <span className="px-3 py-1 bg-vibrant-orange/20 text-vibrant-orange-dark rounded-full text-sm font-luxury-semibold">
                Month: {selectedMonth}
                <button 
                  onClick={() => setSelectedMonth('all')}
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
          <div className="mt-4 text-black font-luxury-body">
            Showing {filteredEvents.length} of {allEvents.length} events
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
            <p className="text-xl font-luxury-heading text-black">Loading events...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => {
            const IconComponent = event.icon;
            return (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="luxury-card bg-cream-white rounded-luxury-lg shadow-luxury overflow-hidden hover:shadow-luxury-lg transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2">
                    <IconComponent className="w-6 h-6 text-vibrant-orange" />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full border ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    <span className="text-sm text-vibrant-orange font-medium">{event.cost}</span>
                  </div>
                  
                  <h3 className="text-xl font-luxury-heading text-black mb-3 group-hover:text-vibrant-orange transition-colors">
                    {event.title}
                  </h3>
                  
                  {event.affiliation && event.affiliation.name && (
                    <div className="text-xs text-vibrant-orange-dark font-semibold mb-2 flex items-center">
                      <span className="mr-1">🏢</span>
                      {event.affiliation.name}
                      {(event.affiliation.customType || event.affiliation.type) && (
                        <span className="text-black/60 ml-1">
                          • {event.affiliation.customType || event.affiliation.type}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-black font-luxury-body text-sm mb-4 line-clamp-3">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">{event.time}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{event.volunteers} volunteers needed</span>
                      </div>
                      <span>{event.capacity} capacity</span>
                    </div>
                    {event.beneficiaries > 0 && (
                      <div className="text-sm text-black font-semibold">
                        <span className="font-bold text-vibrant-orange-dark">{event.beneficiaries.toLocaleString()}</span> people impacted
                      </div>
                    )}
                    <div className="text-sm text-vibrant-orange-dark font-medium">
                      Register by: {event.registrationDeadline}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-vibrant-orange font-medium">
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
        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-luxury-heading text-black mb-4">No Events Found</h3>
            <p className="text-black font-luxury-body mb-6">
              Try adjusting your filters or search terms to find more events.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedMonth('all');
                setSearchTerm('');
              }}
              className="btn-luxury-primary px-6 py-3"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Events Highlight */}
      <div className="bg-cream-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-luxury-display text-black mb-4">
              Upcoming This Month
            </h2>
            <p className="text-xl text-black font-luxury-body">
              Don't miss these exciting upcoming events
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center luxury-hover-scale">
              <div className="text-5xl font-luxury-display text-vibrant-orange mb-2">4</div>
              <div className="text-black font-luxury-body">Upcoming Events</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-5xl font-luxury-display text-vibrant-orange mb-2">108</div>
              <div className="text-black font-luxury-body">Volunteers Needed</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-5xl font-luxury-display text-vibrant-orange mb-2">1,240</div>
              <div className="text-black font-luxury-body">Expected Participants</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-5xl font-luxury-display text-vibrant-orange mb-2">6</div>
              <div className="text-black font-luxury-body">Cities Covered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-parallax py-16 text-cream-elegant relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-luxury-display mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-cream-elegant/80 font-luxury-body mb-8">
            Join our community events and be part of positive change in your neighborhood
          </p>
          <Link
            to="/volunteer"
            className="btn-luxury-primary text-lg px-8 py-4 inline-flex items-center"
          >
            Become a Volunteer
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Events;