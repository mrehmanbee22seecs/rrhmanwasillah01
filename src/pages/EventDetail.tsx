import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, MapPin, Clock, CheckCircle, Send, AlertCircle, Star, Target } from 'lucide-react';
import { sendEmail, formatEventRegistrationEmail, formatEventRegistrationConfirmationEmail } from '../utils/emailService';
import { db } from '../config/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { EventSubmission, ProjectSubmission } from '../types/submissions';
import { useAuth } from '../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [event, setEvent] = useState<EventSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentProject, setParentProject] = useState<ProjectSubmission | null>(null);
  const [siblingEvents, setSiblingEvents] = useState<EventSubmission[]>([]);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
    dietaryRestrictions: '',
    experience: '',
    shiftPreference: '',
    sessionSelections: '' as unknown as string, // comma-separated input -> array
    teamPreference: '',
    tShirtSize: '',
    accessibilityNeeds: '',
    consentLiability: false,
    consentPhoto: false,
    preferredContactMethod: '',
    heardAboutUs: '',
    medicalConditions: '',
    whatsappConsent: false,
  });

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const eventRef = doc(db, 'event_submissions', id);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          const data = eventSnap.data();
          setEvent({
            id: eventSnap.id,
            ...data
          } as EventSubmission);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Fetch parent project (if any) and other events for the same project
  useEffect(() => {
    const fetchParentAndSiblings = async () => {
      try {
        if (!event?.projectId) {
          setParentProject(null);
          setSiblingEvents([]);
          return;
        }

        // Parent project
        const projRef = doc(db, 'project_submissions', event.projectId);
        const projSnap = await getDoc(projRef);
        if (projSnap.exists()) {
          setParentProject({ id: projSnap.id, ...projSnap.data() } as ProjectSubmission);
        } else {
          setParentProject(null);
        }

        // Other events in the same project
        const eventsRef = collection(db, 'event_submissions');
        const q = query(eventsRef, where('projectId', '==', event.projectId));
        const snap = await getDocs(q);
        const siblings = snap.docs
          .filter(d => d.id !== id)
          .map(d => ({ id: d.id, ...d.data() } as EventSubmission))
          .filter(e => e.status === 'approved' && e.isVisible === true);
        setSiblingEvents(siblings);
      } catch (e) {
        console.error('Error loading parent project/sibling events:', e);
      }
    };
    fetchParentAndSiblings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.projectId, id]);

  const staticEvents = {
    '1': {
      title: 'Community Health Fair',
      date: '2024-04-15',
      time: '9:00 AM - 4:00 PM',
      location: 'City Community Center, Karachi',
      description: 'Free health screenings, vaccinations, and health education sessions for the entire community.',
      attendees: 150,
      category: 'Health',
      registrationDeadline: 'April 10, 2024',
      image: 'https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?auto=compress&cs=tinysrgb&w=800',
      aims: [
        'Provide free health screenings to underserved communities',
        'Increase health awareness and preventive care knowledge',
        'Connect community members with healthcare resources',
        'Promote healthy lifestyle choices and habits'
      ],
      objectives: [
        'Screen 500+ individuals for basic health conditions',
        'Provide vaccinations to 200+ children and adults',
        'Distribute 1000+ health education materials',
        'Register 100+ people for ongoing healthcare programs'
      ],
      overview: 'Our Community Health Fair is a comprehensive one-day event bringing essential healthcare services directly to the community. We partner with local hospitals, clinics, and health professionals to provide free screenings, vaccinations, and health education. The event includes specialized stations for different age groups and health concerns.',
      schedule: [
        { time: '9:00 AM - 10:00 AM', activity: 'Registration and Welcome' },
        { time: '10:00 AM - 12:00 PM', activity: 'Health Screenings (Blood Pressure, Diabetes, BMI)' },
        { time: '12:00 PM - 1:00 PM', activity: 'Lunch Break and Networking' },
        { time: '1:00 PM - 3:00 PM', activity: 'Vaccinations and Health Education Sessions' },
        { time: '3:00 PM - 4:00 PM', activity: 'Resource Distribution and Follow-up Appointments' }
      ],
      services: [
        'Free blood pressure and diabetes screening',
        'BMI and basic health assessments',
        'Vaccination services for all ages',
        'Eye and dental check-ups',
        'Maternal and child health consultations',
        'Mental health awareness sessions',
        'Nutrition counseling',
        'Health insurance enrollment assistance'
      ],
      requirements: [
        'Bring valid ID for registration',
        'Vaccination records (if available)',
        'List of current medications',
        'Comfortable clothing for screenings',
        'Empty stomach for diabetes screening (if applicable)'
      ],
      volunteerRoles: [
        'Registration and check-in assistance',
        'Translation services (Urdu/English)',
        'Crowd management and guidance',
        'Health education material distribution',
        'Data collection and record keeping',
        'Setup and cleanup assistance'
      ],
      coordinator: 'Dr. Sarah Ahmed - Community Health Director',
      contact: 'health@wasilah.org | +92 XXX XXXXXXX',
      cost: 'Free for all participants',
      parking: 'Free parking available at the community center'
    },
    '2': {
      title: 'Educational Workshop Series',
      date: '2024-04-20',
      time: '2:00 PM - 5:00 PM',
      location: 'Waseela Training Center, Lahore',
      description: 'Interactive workshops on digital literacy, financial planning, and career development.',
      attendees: 80,
      category: 'Education',
      registrationDeadline: 'April 17, 2024',
      image: 'https://images.pexels.com/photos/7516359/pexels-photo-7516359.jpeg?auto=compress&cs=tinysrgb&w=800',
      aims: [
        'Enhance digital literacy skills in the community',
        'Provide practical financial planning education',
        'Support career development and job readiness',
        'Create networking opportunities for participants'
      ],
      objectives: [
        'Train 80+ participants in essential digital skills',
        'Provide financial planning tools and resources',
        'Conduct mock interviews and resume workshops',
        'Establish ongoing mentorship connections'
      ],
      overview: 'This comprehensive workshop series covers three essential life skills: digital literacy, financial planning, and career development. Participants will engage in hands-on learning experiences, receive practical tools and resources, and connect with mentors and peers. The workshops are designed for adults of all ages looking to enhance their skills and opportunities.',
      schedule: [
        { time: '2:00 PM - 2:30 PM', activity: 'Registration and Welcome Coffee' },
        { time: '2:30 PM - 3:15 PM', activity: 'Digital Literacy Workshop' },
        { time: '3:15 PM - 3:30 PM', activity: 'Break and Networking' },
        { time: '3:30 PM - 4:15 PM', activity: 'Financial Planning Session' },
        { time: '4:15 PM - 5:00 PM', activity: 'Career Development and Q&A' }
      ],
      services: [
        'Basic computer and internet training',
        'Email setup and digital communication',
        'Online banking and digital payments',
        'Personal budgeting and savings strategies',
        'Investment basics and retirement planning',
        'Resume writing and interview skills',
        'Job search strategies and networking',
        'Professional development planning'
      ],
      requirements: [
        'Basic reading and writing skills',
        'Bring notebook and pen for notes',
        'Smartphone or tablet (if available)',
        'Bank account information (for financial planning)',
        'Current resume (if available)'
      ],
      volunteerRoles: [
        'Workshop facilitation assistance',
        'Technical support for digital activities',
        'One-on-one mentoring during sessions',
        'Registration and materials distribution',
        'Translation services',
        'Follow-up coordination'
      ],
      coordinator: 'Ms. Fatima Khan - Education Program Manager',
      contact: 'education@wasilah.org | +92 XXX XXXXXXX',
      cost: 'Free for all participants',
      materials: 'All materials and resources provided'
    },
    '3': {
      title: 'Volunteer Training Day',
      date: '2024-04-25',
      time: '10:00 AM - 3:00 PM',
      location: 'Multiple Locations',
      description: 'Comprehensive training for new volunteers covering project management, community engagement, and safety protocols.',
      attendees: 60,
      category: 'Training',
      registrationDeadline: 'April 22, 2024',
      image: 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800',
      aims: [
        'Prepare new volunteers for effective community service',
        'Provide essential training in project management',
        'Ensure safety and best practices in all activities',
        'Build a strong, knowledgeable volunteer network'
      ],
      objectives: [
        'Train 60+ new volunteers in core competencies',
        'Certify volunteers in safety protocols',
        'Establish mentor-mentee relationships',
        'Create volunteer resource network'
      ],
      overview: 'Our Volunteer Training Day is a comprehensive orientation program for new volunteers joining Wasilah. The training covers essential skills, safety protocols, project management basics, and community engagement strategies. Participants will receive certification and ongoing support to ensure successful volunteer experiences.',
      schedule: [
        { time: '10:00 AM - 10:30 AM', activity: 'Welcome and Introductions' },
        { time: '10:30 AM - 11:30 AM', activity: 'Wasilah Mission and Values' },
        { time: '11:30 AM - 12:30 PM', activity: 'Project Management Basics' },
        { time: '12:30 PM - 1:00 PM', activity: 'Lunch Break' },
        { time: '1:00 PM - 2:00 PM', activity: 'Community Engagement Strategies' },
        { time: '2:00 PM - 2:45 PM', activity: 'Safety Protocols and Emergency Procedures' },
        { time: '2:45 PM - 3:00 PM', activity: 'Certification and Next Steps' }
      ],
      services: [
        'Comprehensive volunteer handbook',
        'Project management training materials',
        'Safety protocol certification',
        'Community engagement guidelines',
        'Emergency response training',
        'Mentor assignment and introduction',
        'Ongoing support resources',
        'Volunteer ID and materials'
      ],
      requirements: [
        'Completed volunteer application',
        'Background check clearance',
        'Commitment to volunteer for minimum 6 months',
        'Attendance at full training session',
        'Basic first aid knowledge preferred'
      ],
      volunteerRoles: [
        'Training session facilitation',
        'Mentor assignment and coordination',
        'Materials preparation and distribution',
        'Registration and check-in',
        'Documentation and certification',
        'Follow-up and ongoing support'
      ],
      coordinator: 'Mr. Ahmed Hassan - Volunteer Coordinator',
      contact: 'volunteers@wasilah.org | +92 XXX XXXXXXX',
      cost: 'Free for all participants',
      certification: 'Official Wasilah Volunteer Certificate provided'
    },
    '4': {
      title: 'Clean-Up Drive & Tree Plantation',
      date: '2024-05-01',
      time: '7:00 AM - 12:00 PM',
      location: 'Various Parks & Communities',
      description: 'Community-wide environmental initiative focusing on waste management and urban forestry.',
      attendees: 200,
      category: 'Environment',
      registrationDeadline: 'April 28, 2024',
      image: 'https://images.pexels.com/photos/9324574/pexels-photo-9324574.jpeg?auto=compress&cs=tinysrgb&w=800',
      aims: [
        'Improve environmental conditions in local communities',
        'Increase green cover through tree plantation',
        'Promote environmental awareness and responsibility',
        'Build community pride and ownership'
      ],
      objectives: [
        'Clean 10+ parks and community areas',
        'Plant 500+ trees and saplings',
        'Collect and properly dispose of 2+ tons of waste',
        'Engage 200+ community members in environmental action'
      ],
      overview: 'Our Clean-Up Drive & Tree Plantation is a large-scale environmental initiative bringing together community members to improve local environmental conditions. The event combines waste collection and proper disposal with tree planting activities. Participants will work in teams across multiple locations to maximize impact.',
      schedule: [
        { time: '7:00 AM - 7:30 AM', activity: 'Registration and Team Assignment' },
        { time: '7:30 AM - 9:30 AM', activity: 'Clean-Up Activities (Waste Collection)' },
        { time: '9:30 AM - 10:00 AM', activity: 'Refreshment Break' },
        { time: '10:00 AM - 11:30 AM', activity: 'Tree Plantation Activities' },
        { time: '11:30 AM - 12:00 PM', activity: 'Wrap-up and Group Photo' }
      ],
      services: [
        'All cleaning supplies and equipment provided',
        'Tree saplings and planting materials',
        'Waste collection and disposal coordination',
        'Refreshments and water throughout event',
        'Transportation to assigned locations',
        'First aid support and safety equipment',
        'Environmental education materials',
        'Participation certificates'
      ],
      requirements: [
        'Comfortable work clothes and closed-toe shoes',
        'Sun protection (hat, sunscreen)',
        'Water bottle and personal snacks',
        'Work gloves (if available)',
        'Physical ability for outdoor work'
      ],
      volunteerRoles: [
        'Team leadership and coordination',
        'Equipment distribution and management',
        'Safety monitoring and first aid',
        'Transportation coordination',
        'Documentation and photography',
        'Waste sorting and disposal guidance',
        'Tree planting instruction',
        'Community engagement and education'
      ],
      coordinator: 'Eng. Omar Sheikh - Environmental Projects Lead',
      contact: 'environment@wasilah.org | +92 XXX XXXXXXX',
      cost: 'Free for all participants',
      impact: 'Expected to clean 15+ locations and plant 500+ trees'
    }
  };

  const staticEvent = staticEvents[id as keyof typeof staticEvents];
  const displayEvent = event || staticEvent;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayEvent) return;

    // Save structured registration entry
    try {
      const payload = {
        eventId: id,
        eventTitle: displayEvent.title,
        eventDate: displayEvent.date,
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        emergencyContact: registrationData.emergencyContact || '',
        dietaryRestrictions: registrationData.dietaryRestrictions || '',
        experience: registrationData.experience || '',
        shiftPreference: registrationData.shiftPreference || '',
        sessionSelections: (registrationData.sessionSelections || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        teamPreference: registrationData.teamPreference || '',
        tShirtSize: registrationData.tShirtSize || '',
        accessibilityNeeds: registrationData.accessibilityNeeds || '',
        consents: { liability: !!registrationData.consentLiability, photo: !!registrationData.consentPhoto },
        preferredContactMethod: registrationData.preferredContactMethod || '',
        heardAboutUs: registrationData.heardAboutUs || '',
        medicalConditions: registrationData.medicalConditions || '',
        whatsappConsent: !!registrationData.whatsappConsent,
        submittedAt: serverTimestamp(),
      };

      // 1) Backwards-compatible top-level collection
      await addDoc(collection(db, 'event_registrations'), payload);
      // 2) New per-event subcollection for explicit linkage
      if (id) {
        await addDoc(collection(db, `event_submissions/${id}/registrations`), payload);
      }
    } catch (error) {
      console.error('Failed to save event registration:', error);
    }

    // Send email notification
    const emailData = formatEventRegistrationEmail({
      ...registrationData,
      eventTitle: displayEvent.title,
      eventDate: formatDate(displayEvent.date),
      timestamp: new Date().toISOString()
    });
    
    sendEmail(emailData).then(async (success) => {
      if (success) {
        // Also send a confirmation to the registrant
        try {
          await sendEmail(
            formatEventRegistrationConfirmationEmail({
              name: registrationData.name,
              email: registrationData.email,
              eventTitle: displayEvent.title,
              eventDate: formatDate(displayEvent.date),
              time: displayEvent.time,
              location: displayEvent.location,
            })
          );
        } catch {}
        alert(`Thank you for registering for ${displayEvent.title}! You will receive a confirmation email shortly.`);
      } else {
        alert('There was an error with your registration. Please try again or contact us directly.');
      }
    });
    
    setRegistrationData({
      name: '',
      email: '',
      phone: '',
      emergencyContact: '',
      dietaryRestrictions: '',
      experience: '',
      shiftPreference: '',
      sessionSelections: '' as unknown as string,
      teamPreference: '',
      tShirtSize: '',
      accessibilityNeeds: '',
      consentLiability: false,
      consentPhoto: false,
      preferredContactMethod: '',
      heardAboutUs: '',
      medicalConditions: '',
      whatsappConsent: false,
    });
    setShowRegistration(false);
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
        <p className="text-xl font-luxury-heading text-black">Loading event details...</p>
      </div>
    );
  }

  if (!displayEvent) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-4xl font-luxury-heading text-black mb-4">Event Not Found</h1>
        <Link to="/events" className="btn-luxury-primary inline-flex items-center">
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back to Events
        </Link>
      </div>
    );
  }

  const isFromFirestore = !!event;
  const aims = !isFromFirestore && staticEvent?.aims ? staticEvent.aims : [];
  const objectives = !isFromFirestore && staticEvent?.objectives ? staticEvent.objectives : [];
  const schedule = !isFromFirestore && staticEvent?.schedule ? staticEvent.schedule : [];
  const services = !isFromFirestore && staticEvent?.services ? staticEvent.services : [];
  const volunteerRoles = !isFromFirestore && staticEvent?.volunteerRoles ? staticEvent.volunteerRoles : [];
  const overview = !isFromFirestore && staticEvent?.overview ? staticEvent.overview : displayEvent.description;
  const coordinator = !isFromFirestore && staticEvent?.coordinator ? staticEvent.coordinator : 'Event Coordinator';
  const contact = displayEvent.contactEmail || '';
  const attendees = isFromFirestore ? displayEvent.expectedAttendees : (staticEvent?.attendees || 0);
  const registrationDeadline = isFromFirestore ? displayEvent.registrationDeadline : (staticEvent?.registrationDeadline || 'Open');
  const cost = isFromFirestore ? displayEvent.cost : (staticEvent?.cost || 'Free');
  
  // Check if current user can edit this event (only for approved events)
  const canEdit = !!event && event.status === 'approved' && !!currentUser && (isAdmin || event.submittedBy === currentUser.uid);
  
  const handleEditClick = () => {
    if (!event || !id) return;
    // Navigate to create-submission with edit parameter
    navigate(`/create-submission?type=event&edit=${id}`);
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

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'health': return 'bg-red-100 text-red-800';
      case 'education': return 'bg-blue-100 text-blue-800';
      case 'training': return 'bg-purple-100 text-purple-800';
      case 'environment': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-12">
      {/* Header */}
      <section className="bg-cream-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <Link to="/events" className="inline-flex items-center text-vibrant-orange hover:text-vibrant-orange-dark font-luxury-semibold">
              <ArrowLeft className="mr-2 w-5 h-5" />
              Back to Events
            </Link>
            {canEdit && (
              <button
                onClick={handleEditClick}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-luxury-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Event
              </button>
            )}
          </div>
          {parentProject && (
            <div className="mb-6 text-black">
              <span className="text-black/70">Part of project: </span>
              <Link to={`/projects/${parentProject.id}`} className="text-vibrant-orange hover:underline">
                {parentProject.title || 'View project'}
              </Link>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                {(() => {
                  const now = new Date();
                  const date = displayEvent.date ? new Date(displayEvent.date) : null;
                  const tag = date ? (now < date ? 'Upcoming' : now.toDateString() === date.toDateString() ? 'Active' : 'Completed') : 'Upcoming';
                  return (
                    <span className={`px-4 py-2 rounded-luxury font-luxury-semibold ${tag === 'Upcoming' ? 'bg-blue-100 text-blue-800' : tag === 'Completed' ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                      {tag}
                    </span>
                  );
                })()}
                <span className={`px-4 py-2 rounded-luxury font-luxury-semibold ${getCategoryColor(displayEvent.category)}`}>
                  {displayEvent.category}
                </span>
                <div className="flex items-center text-vibrant-orange">
                  <Star className="w-5 h-5 mr-1" />
                  <span className="font-luxury-semibold">Featured Event</span>
                </div>
              </div>

              <h1 className="text-5xl font-luxury-display text-black mb-6">{displayEvent.title}</h1>
              
              {displayEvent.affiliation && displayEvent.affiliation.name && (
                <div className="mb-6 p-4 bg-cream-elegant border-l-4 border-vibrant-orange rounded-r-luxury">
                  <div className="flex items-center">
                    <div className="mr-3 text-vibrant-orange">🏢</div>
                    <div>
                      <div className="text-sm text-black/60 font-luxury-body mb-1">Organized by</div>
                      <div className="text-lg font-luxury-semibold text-vibrant-orange-dark">
                        {displayEvent.affiliation.name}
                      </div>
                      {(displayEvent.affiliation.customType || displayEvent.affiliation.type) && (
                        <div className="text-sm text-black/70 font-luxury-body">
                          {displayEvent.affiliation.customType || displayEvent.affiliation.type}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xl text-black font-luxury-body leading-relaxed mb-8">{displayEvent.description}</p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-center text-black">
                  <Calendar className="w-6 h-6 mr-3 text-vibrant-orange" />
                  <div className="flex flex-col">
                    <span className="font-luxury-body">{formatDate(displayEvent.date)}</span>
                    <span className="text-xs text-black/60">Date</span>
                  </div>
                </div>
                <div className="flex items-center text-black">
                  <Clock className="w-6 h-6 mr-3 text-vibrant-orange" />
                  <div className="flex flex-col">
                    <span className="font-luxury-body">{displayEvent.time}</span>
                    <span className="text-xs text-black/60">Time</span>
                  </div>
                </div>
                <div className="flex items-center text-black">
                  <MapPin className="w-6 h-6 mr-3 text-vibrant-orange" />
                  <div className="flex flex-col">
                    <span className="font-luxury-body">{displayEvent.location}</span>
                    <span className="text-xs text-black/60">Venue</span>
                  </div>
                </div>
                <div className="flex items-center text-black">
                  <Users className="w-6 h-6 mr-3 text-vibrant-orange" />
                  <div className="flex flex-col">
                    <span className="font-luxury-body">{attendees} expected</span>
                    <span className="text-xs text-black/60">Attendees</span>
                  </div>
                </div>
              </div>

              {/* Impact Highlight Box */}
              {displayEvent.peopleImpacted != null && displayEvent.peopleImpacted > 0 && (
                <div className="bg-vibrant-orange/10 border-2 border-vibrant-orange/30 rounded-luxury p-6 mb-8">
                  <div className="flex items-center justify-center">
                    <Target className="w-8 h-8 mr-4 text-vibrant-orange" />
                    <div className="text-center">
                      <div className="text-4xl font-luxury-display text-vibrant-orange-dark mb-1">
                        {displayEvent.peopleImpacted.toLocaleString()}+
                      </div>
                      <div className="text-lg font-luxury-semibold text-black">
                        People Expected to Benefit
                      </div>
                      <p className="text-sm text-black/70 mt-1">
                        Estimated social impact of this event
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-vibrant-orange/10 p-6 rounded-luxury mb-8">
                <p className="text-black font-luxury-semibold">
                  Registration Deadline: <span className="text-vibrant-orange-dark">{registrationDeadline}</span>
                </p>
                {registrationDeadline && (() => {
                  const now = new Date();
                  const deadline = new Date(registrationDeadline);
                  const passed = now > new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59);
                  return passed ? (
                    <p className="mt-2 text-sm text-red-700">Registration is closed for this event.</p>
                  ) : null;
                })()}
              </div>
              
              {(() => {
                const now = new Date();
                const eventDate = displayEvent.date ? new Date(displayEvent.date) : null;
                const isSameDay = eventDate && now.toDateString() === eventDate.toDateString();
                
                // Use registration deadline if provided, otherwise use event date as deadline
                const deadline = displayEvent.registrationDeadline 
                  ? new Date(displayEvent.registrationDeadline) 
                  : eventDate;
                
                const deadlinePassed = deadline 
                  ? now > new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59) 
                  : false;

                if (deadlinePassed) {
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-luxury text-black">
                      {displayEvent.registrationDeadline 
                        ? 'Registration deadline has passed. Please browse other events.'
                        : 'This event has finished. Please browse other events.'}
                    </div>
                  );
                }

                return (
                  <button
                    onClick={() => setShowRegistration(true)}
                    className="btn-luxury-primary text-lg px-8 py-4 inline-flex items-center"
                  >
                    {isSameDay ? 'Register (Today)' : 'Register Now'}
                    <Send className="ml-3 w-6 h-6" />
                  </button>
                );
              })()}
            </div>
            
            <div className="relative">
              <img
                src={displayEvent.image || 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'}
                alt={displayEvent.title}
                className="w-full h-96 object-cover rounded-luxury-lg shadow-luxury"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Event Details */
      }
      <section className="py-16 bg-cream-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Content */}
            <div className="space-y-12">
              {/* Overview */}
              <div className="luxury-card bg-cream-white p-10">
                <h2 className="text-3xl font-luxury-heading text-black mb-6">Event Overview</h2>
                <p className="text-black font-luxury-body text-lg leading-relaxed">{overview}</p>
              </div>

              {/* Aims & Objectives */}
              {(aims.length > 0 || objectives.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {aims.length > 0 && (
                <div className="luxury-card bg-cream-white p-8">
                  <h3 className="text-2xl font-luxury-heading text-black mb-6">Event Aims</h3>
                  <ul className="space-y-3">
                    {aims.map((aim, index) => (
                      <li key={index} className="flex items-start text-black font-luxury-body">
                        <CheckCircle className="w-5 h-5 mr-3 text-vibrant-orange flex-shrink-0 mt-1" />
                        {aim}
                      </li>
                    ))}
                  </ul>
                </div>
                )}

                {objectives.length > 0 && (
                <div className="luxury-card bg-cream-white p-8">
                  <h3 className="text-2xl font-luxury-heading text-black mb-6">Key Objectives</h3>
                  <ul className="space-y-3">
                    {objectives.map((objective, index) => (
                      <li key={index} className="flex items-start text-black font-luxury-body">
                        <CheckCircle className="w-5 h-5 mr-3 text-vibrant-orange flex-shrink-0 mt-1" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
                )}
              </div>
              )}

              {/* Schedule */}
              {schedule.length > 0 && (
              <div className="luxury-card bg-cream-white p-10">
                <h2 className="text-3xl font-luxury-heading text-black mb-6">Event Schedule</h2>
                <div className="space-y-4">
                  {schedule.map((item, index) => (
                    <div key={index} className="flex items-center p-4 bg-cream-elegant rounded-luxury">
                      <div className="bg-vibrant-orange text-white px-4 py-2 rounded-luxury font-luxury-semibold mr-6 min-w-fit">
                        {item.time}
                      </div>
                      <div className="text-black font-luxury-body text-lg">{item.activity}</div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Services/Activities */}
              {services.length > 0 && (
              <div className="luxury-card bg-cream-white p-10">
                <h2 className="text-3xl font-luxury-heading text-black mb-6">What's Included</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service, index) => (
                    <div key={index} className="flex items-center text-black font-luxury-body p-4 bg-cream-elegant rounded-luxury">
                      <CheckCircle className="w-5 h-5 mr-3 text-vibrant-orange flex-shrink-0" />
                      {service}
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Volunteer Opportunities */}
              {volunteerRoles.length > 0 && (
              <div className="luxury-card bg-logo-navy p-10 text-cream-elegant">
                <h2 className="text-3xl font-luxury-heading text-vibrant-orange-light mb-6">Volunteer Opportunities</h2>
                <p className="text-cream-elegant font-luxury-body text-lg mb-6">
                  Join our team of volunteers and help make this event successful!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {volunteerRoles.map((role, index) => (
                    <div key={index} className="flex items-start text-cream-elegant font-luxury-body p-4 bg-logo-navy-light/60 rounded-luxury">
                      <CheckCircle className="w-5 h-5 mr-3 text-vibrant-orange-light flex-shrink-0 mt-1" />
                      {role}
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Event Details - Always show */}
              <div className="luxury-card bg-cream-white p-8">
                <h3 className="text-2xl font-luxury-heading text-black mb-6">📋 Event Details</h3>
                <div className="space-y-4 text-black font-luxury-body">
                  <div>
                    <strong>Cost:</strong> {cost}
                  </div>
                  {staticEvent?.materials && (
                    <div>
                      <strong>Materials:</strong> {staticEvent.materials}
                    </div>
                  )}
                  {staticEvent?.parking && (
                    <div>
                      <strong>Parking:</strong> {staticEvent.parking}
                    </div>
                  )}
                  {staticEvent?.certification && (
                    <div>
                      <strong>Certification:</strong> {staticEvent.certification}
                    </div>
                  )}
                  {staticEvent?.impact && (
                    <div>
                      <strong>Expected Impact:</strong> {staticEvent.impact}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact - Always show */}
              <div className="luxury-card bg-vibrant-orange/10 p-8">
                <h3 className="text-2xl font-luxury-heading text-black mb-4">📞 Contact Information</h3>
                <p className="text-black font-luxury-semibold mb-2">{coordinator}</p>
                <p className="text-black font-luxury-body text-sm break-words">{contact}</p>
                {displayEvent.contactPhone && (
                  <p className="text-black font-luxury-body text-sm mt-1">{displayEvent.contactPhone}</p>
                )}
              </div>

              {/* Capacity & Services */}
              {(
                (typeof displayEvent.capacity === 'number') ||
                (Array.isArray(displayEvent.servicesIncluded) && displayEvent.servicesIncluded.length > 0) ||
                (displayEvent.accessibilityInfo)
              ) && (
                <div className="luxury-card bg-cream-white p-8">
                  <h3 className="text-2xl font-luxury-heading text-black mb-4">🎯 Participation & Services</h3>
                  <div className="space-y-3 text-black">
                    {typeof displayEvent.capacity === 'number' && (
                      <div>
                        <strong>Capacity:</strong> {displayEvent.capacity}
                      </div>
                    )}
                    {Array.isArray(displayEvent.servicesIncluded) && displayEvent.servicesIncluded.length > 0 && (
                      <div>
                        <strong>Included:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {displayEvent.servicesIncluded.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {displayEvent.accessibilityInfo && (
                      <div><strong>Accessibility:</strong> {displayEvent.accessibilityInfo}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Logistics */}
              {(
                (Array.isArray(displayEvent.materialsList) && displayEvent.materialsList.length > 0) ||
                (displayEvent.parkingInfo) ||
                (Array.isArray(displayEvent.certifications) && displayEvent.certifications.length > 0)
              ) && (
                <div className="luxury-card bg-cream-white p-8">
                  <h3 className="text-2xl font-luxury-heading text-black mb-4">Logistics</h3>
                  <div className="space-y-3 text-black">
                    {Array.isArray(displayEvent.materialsList) && displayEvent.materialsList.length > 0 && (
                      <div>
                        <strong>What to bring:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {displayEvent.materialsList.map((m: string, i: number) => <li key={i}>{m}</li>)}
                        </ul>
                      </div>
                    )}
                    {displayEvent.parkingInfo && (
                      <div><strong>Parking:</strong> {displayEvent.parkingInfo}</div>
                    )}
                    {Array.isArray(displayEvent.certifications) && displayEvent.certifications.length > 0 && (
                      <div><strong>Certification:</strong> {displayEvent.certifications.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* FAQ */}
              {Array.isArray(displayEvent.faq) && displayEvent.faq.length > 0 && (
                <div className="luxury-card bg-cream-white p-8">
                  <h3 className="text-2xl font-luxury-heading text-black mb-4">FAQ</h3>
                  <div className="space-y-3">
                    {displayEvent.faq.map((f: any, i: number) => (
                      <div key={i}>
                        <div className="font-semibold text-black">{f.question}</div>
                        <div className="text-black/80">{f.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partners */}
              {Array.isArray(displayEvent.partners) && displayEvent.partners.length > 0 && (
                <div className="luxury-card bg-cream-white p-8">
                  <h3 className="text-2xl font-luxury-heading text-black mb-4">🤝 Event Partners</h3>
                  <div className="flex flex-wrap gap-2">
                    {displayEvent.partners.map((partner: string, i: number) => (
                      <span key={i} className="px-3 py-2 bg-cream-elegant rounded-luxury text-black font-luxury-semibold border border-vibrant-orange/20">
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Childcare */}
              {displayEvent.childcareAvailable && (
                <div className="luxury-card bg-vibrant-orange/10 p-8">
                  <h3 className="text-2xl font-luxury-heading text-black mb-2">👶 Childcare Available</h3>
                  <p className="text-black font-luxury-body">Childcare services will be provided at this event</p>
                </div>
              )}

              {/* Requirements */}
              {displayEvent.requirements && displayEvent.requirements.length > 0 && displayEvent.requirements[0] !== '' && (
              <div className="luxury-card bg-cream-white p-8">
                <h3 className="text-2xl font-luxury-heading text-black mb-6">📦 What to Bring</h3>
                <ul className="space-y-3">
                  {displayEvent.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start text-black font-luxury-body">
                      <AlertCircle className="w-5 h-5 mr-3 text-vibrant-orange flex-shrink-0 mt-1" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Event Organizers Section */}
      {displayEvent && displayEvent.heads && displayEvent.heads.length > 0 && (
        <section className="py-16 bg-cream-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-luxury-heading text-black mb-8 text-center">Event Organizers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayEvent.heads.map((head, index) => (
                <div key={head.id || index} className="luxury-card bg-cream-white p-6 text-center">
                  {head.image && (
                    <div className="mb-4">
                      <img
                        src={head.image}
                        alt={head.name}
                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-vibrant-orange/20"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-luxury-heading text-black mb-2">{head.name}</h3>
                  <p className="text-vibrant-orange-dark font-luxury-semibold mb-4">{head.designation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other events in the same project */}
      {parentProject && siblingEvents.length > 0 && (
        <section className="py-16 bg-cream-elegant">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-luxury-heading text-black mb-8 text-center">
              More events in "{parentProject.title}"
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {siblingEvents.map(ev => (
                <Link key={ev.id} to={`/events/${ev.id}`} className="luxury-card bg-cream-white p-6 hover:shadow-luxury-lg transition-all">
                  <div className="text-sm text-black/70 mb-2">{ev.date}{ev.time ? ` • ${ev.time}` : ''}</div>
                  <h3 className="text-xl font-luxury-heading text-black mb-2">{ev.title}</h3>
                  <div className="text-black/80">{ev.location}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="luxury-card bg-cream-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-luxury-heading text-black">Event Registration</h3>
              <button
                onClick={() => setShowRegistration(false)}
                className="text-black hover:text-vibrant-orange text-2xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-black font-luxury-body mb-6">
              Register for: <strong>{displayEvent.title}</strong><br />
              <span className="text-vibrant-orange-dark">{formatDate(displayEvent.date)} at {displayEvent.time}</span>
            </p>

            <form onSubmit={handleRegistrationSubmit} className="space-y-6">
              <div>
                <label className="block font-luxury-medium text-black mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={registrationData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                />
              </div>

              <div>
                <label className="block font-luxury-medium text-black mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={registrationData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                />
              </div>

              <div>
                <label className="block font-luxury-medium text-black mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={registrationData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                />
              </div>

              <div>
                <label className="block font-luxury-medium text-black mb-2">Emergency Contact</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={registrationData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Name and phone number"
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                />
              </div>

              <div>
                <label className="block font-luxury-medium text-black mb-2">Dietary Restrictions/Allergies</label>
                <input
                  type="text"
                  name="dietaryRestrictions"
                  value={registrationData.dietaryRestrictions}
                  onChange={handleInputChange}
                  placeholder="Please specify any dietary restrictions or allergies"
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                />
              </div>

              <div>
                <label className="block font-luxury-medium text-black mb-2">Previous Experience (Optional)</label>
                <textarea
                  name="experience"
                  rows={3}
                  value={registrationData.experience}
                  onChange={handleInputChange}
                  placeholder="Any relevant experience or special skills you'd like to share..."
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                />
              </div>

              {/* New Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Shift Preference</label>
                  <input
                    type="text"
                    name="shiftPreference"
                    value={registrationData.shiftPreference}
                    onChange={handleInputChange}
                    placeholder="Morning, Afternoon, Evening"
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Session Selections (comma-separated)</label>
                  <input
                    type="text"
                    value={registrationData.sessionSelections as unknown as string}
                    onChange={(e) => setRegistrationData((p) => ({ ...p, sessionSelections: e.target.value as unknown as string }))}
                    placeholder="Track A, Workshop 2, Keynote"
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Team Preference (optional)</label>
                  <input
                    type="text"
                    name="teamPreference"
                    value={registrationData.teamPreference}
                    onChange={handleInputChange}
                    placeholder="Buddy/team name, if any"
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-black mb-2">T‑shirt Size</label>
                  <input
                    type="text"
                    name="tShirtSize"
                    value={registrationData.tShirtSize}
                    onChange={handleInputChange}
                    placeholder="S, M, L, XL"
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
              </div>

              <div>
                <label className="block font-luxury-medium text-black mb-2">Accessibility Needs (optional)</label>
                <input
                  type="text"
                  value={registrationData.accessibilityNeeds}
                  onChange={(e) => setRegistrationData((p) => ({ ...p, accessibilityNeeds: e.target.value }))}
                  placeholder="Any accommodations required"
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Preferred Contact Method</label>
                  <input
                    type="text"
                    name="preferredContactMethod"
                    value={registrationData.preferredContactMethod}
                    onChange={handleInputChange}
                    placeholder="WhatsApp, Email, Phone"
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-black mb-2">How did you hear about us?</label>
                  <input
                    type="text"
                    name="heardAboutUs"
                    value={registrationData.heardAboutUs}
                    onChange={handleInputChange}
                    placeholder="Friend, Social media, University, etc."
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Medical Conditions (optional)</label>
                  <input
                    type="text"
                    name="medicalConditions"
                    value={registrationData.medicalConditions}
                    onChange={handleInputChange}
                    placeholder="Any important information for organizers"
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
                <label className="flex items-center gap-2 mt-8">
                  <input type="checkbox" checked={registrationData.whatsappConsent} onChange={(e) => setRegistrationData((p) => ({ ...p, whatsappConsent: e.target.checked }))} />
                  <span className="text-black">Contact via WhatsApp</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={registrationData.consentLiability} onChange={(e) => setRegistrationData((p) => ({ ...p, consentLiability: e.target.checked }))} />
                  <span className="text-black">Liability Waiver</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={registrationData.consentPhoto} onChange={(e) => setRegistrationData((p) => ({ ...p, consentPhoto: e.target.checked }))} />
                  <span className="text-black">Photo Consent</span>
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowRegistration(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-luxury-primary py-3 px-6 flex items-center justify-center"
                >
                  Complete Registration
                  <Send className="ml-2 w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;