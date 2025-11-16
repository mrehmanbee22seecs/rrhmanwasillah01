import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Mail, Calendar, Target, Settings, CreditCard as Edit3, Save, X, Plus, Trash2, Eye, EyeOff, Download, CheckCircle, XCircle, Clock, FileText, Mail as MailIcon, RefreshCw, Database, ExternalLink, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ProjectSubmission, EventSubmission, SubmissionStatus, ProjectApplicationEntry, EventRegistrationEntry, VolunteerApplicationEntry, NewsletterSubscriberEntry, ProjectApplicationEditRequest, EventRegistrationEditRequest, ProjectSubmissionEditRequest, EventSubmissionEditRequest } from '../types/submissions';
import { sendEmail, formatSubmissionStatusUpdateEmail } from '../utils/emailService';
import { sendEditRequestStatusEmail } from '../services/resendEmailService';
import { migrateApprovedSubmissions } from '../utils/migrateVisibility';
import ChatsPanel from './Admin/ChatsPanel';
import { seedKnowledgeBase } from '../utils/kbSeed';
import AdvancedFilters, { FilterCriteria, SavedFilter } from './Admin/AdvancedFilters';
import BatchOperations, { SelectableItem } from './Admin/BatchOperations';
import ModerationTools from './Admin/ModerationTools';
import AnalyticsOverview from './Admin/AnalyticsOverview';
import { applyFilters } from '../utils/adminFilterUtils';
import { sendProjectUpdateNotification } from '../utils/notificationHelpers';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Response {
  id: string;
  type: 'volunteer' | 'contact' | 'chat' | 'event' | 'project';
  data: any;
  timestamp: any;
  status: 'new' | 'reviewed' | 'responded';
}

interface EditableContent {
  id: string;
  section: string;
  content: string;
  type: 'text' | 'html';
}

type SubmissionWithType = (ProjectSubmission | EventSubmission) & {
  submissionType: 'project' | 'event';
};

// Column headers for application tables
const PROJECT_APPLICATION_COLUMNS = [
  'Project', 'Name', 'Email', 'Phone', 'Preferred Role', 'Availability',
  'Skills', 'Languages', 'Transport', 'Equipment', 'Accessibility',
  'Emergency Contact', 'Consents', 'Contact Method', 'Portfolio',
  'Heard About Us', 'WhatsApp', 'Experience', 'Motivation', 'Submitted'
];

const EVENT_REGISTRATION_COLUMNS = [
  'Event', 'Name', 'Email', 'Phone', 'Emergency Contact', 'Dietary',
  'Medical', 'Shift', 'Sessions', 'Team', 'T‑shirt', 'Accessibility',
  'Consents', 'Contact Method', 'Heard About Us', 'WhatsApp',
  'Experience', 'Submitted'
];

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('responses');
  const [responses, setResponses] = useState<Response[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithType[]>([]);
  const [projectApplications, setProjectApplications] = useState<ProjectApplicationEntry[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistrationEntry[]>([]);
  const [volunteerApplications, setVolunteerApplications] = useState<VolunteerApplicationEntry[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriberEntry[]>([]);
  const [projectEditRequests, setProjectEditRequests] = useState<ProjectApplicationEditRequest[]>([]);
  const [eventEditRequests, setEventEditRequests] = useState<EventRegistrationEditRequest[]>([]);
  const [projectSubmissionEditRequests, setProjectSubmissionEditRequests] = useState<ProjectSubmissionEditRequest[]>([]);
  const [eventSubmissionEditRequests, setEventSubmissionEditRequests] = useState<EventSubmissionEditRequest[]>([]);
  const [editableContent, setEditableContent] = useState<EditableContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<string | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Community'
  });
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(true);

  // Enhanced admin features state
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    searchQuery: '',
    searchFields: ['title', 'description', 'submitterName', 'submitterEmail'],
    types: [],
    statuses: [],
    categories: [],
    dateRange: { start: '', end: '' },
    locations: [],
    visibility: 'all',
    customFilters: {},
  });
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionWithType[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  const { isAdmin, currentUser } = useAuth();

  // Broadcast open/close so other widgets (e.g., Chat/Donation) can coordinate
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(isOpen ? 'admin:open' : 'admin:close'));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchResponses();
      fetchSubmissions();
      fetchApplications();
      fetchEditRequests();
      fetchEditableContent();
    }
  }, [isOpen, isAdmin]);

  // Apply filters to submissions
  useEffect(() => {
    const filtered = applyFilters(submissions, filterCriteria);
    setFilteredSubmissions(filtered);
  }, [submissions, filterCriteria]);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      // Use correct collection names that exist in Firestore with proper admin read permissions
      const collections = [
        { name: 'volunteer_applications', type: 'volunteer' },
        { name: 'contact_messages', type: 'contact' }
      ];
      const allResponses: Response[] = [];

      for (const { name, type } of collections) {
        try {
          const q = query(collection(db, name), orderBy('submittedAt', 'desc'));
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach((doc) => {
            allResponses.push({
              id: doc.id,
              type: type as any,
              data: doc.data(),
              timestamp: doc.data().submittedAt || doc.data().timestamp,
              status: doc.data().status || 'new'
            });
          });
        } catch (collectionError) {
          console.warn(`Could not fetch ${name}:`, collectionError);
          // Continue with other collections even if one fails
        }
      }

      allResponses.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return bTime - aTime;
      });
      setResponses(allResponses);
    } catch (error) {
      console.error('Error fetching responses:', error);
      // Set empty array instead of leaving it in error state
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      // Project Applications - Fetch ALL fields
      const projQ = query(collection(db, 'project_applications'), orderBy('submittedAt', 'desc'));
      const projSnap = await getDocs(projQ);
      const projRows: ProjectApplicationEntry[] = [];
      projSnap.forEach((d) => {
        const data: any = d.data();
        projRows.push({
          id: d.id,
          projectId: data.projectId || '',
          projectTitle: data.projectTitle || 'Untitled',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          experience: data.experience || '',
          motivation: data.motivation || '',
          preferredRole: data.preferredRole || '',
          availability: data.availability || '',
          skills: data.skills || [],
          languageProficiency: data.languageProficiency || [],
          transportAvailable: data.transportAvailable || false,
          equipment: data.equipment || [],
          accessibilityNeeds: data.accessibilityNeeds || '',
          emergencyContact: data.emergencyContact || undefined,
          consents: data.consents || undefined,
          startAvailabilityDate: data.startAvailabilityDate || '',
          endAvailabilityDate: data.endAvailabilityDate || '',
          preferredContactMethod: data.preferredContactMethod || '',
          portfolioUrls: data.portfolioUrls || [],
          heardAboutUs: data.heardAboutUs || '',
          emergencyContactRelation: data.emergencyContactRelation || '',
          whatsappConsent: data.whatsappConsent || false,
          submittedAt: data.submittedAt,
        });
      });
      setProjectApplications(projRows);

      // Event Registrations - Fetch ALL fields
      const evtQ = query(collection(db, 'event_registrations'), orderBy('submittedAt', 'desc'));
      const evtSnap = await getDocs(evtQ);
      const evtRows: EventRegistrationEntry[] = [];
      evtSnap.forEach((d) => {
        const data: any = d.data();
        evtRows.push({
          id: d.id,
          eventId: data.eventId || '',
          eventTitle: data.eventTitle || 'Untitled',
          eventDate: data.eventDate || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          emergencyContact: data.emergencyContact || '',
          dietaryRestrictions: data.dietaryRestrictions || '',
          experience: data.experience || '',
          shiftPreference: data.shiftPreference || '',
          sessionSelections: data.sessionSelections || [],
          teamPreference: data.teamPreference || '',
          tShirtSize: data.tShirtSize || '',
          accessibilityNeeds: data.accessibilityNeeds || '',
          consents: data.consents || undefined,
          preferredContactMethod: data.preferredContactMethod || '',
          heardAboutUs: data.heardAboutUs || '',
          medicalConditions: data.medicalConditions || '',
          whatsappConsent: data.whatsappConsent || false,
          submittedAt: data.submittedAt,
        });
      });
      setEventRegistrations(evtRows);

      // Volunteer Applications - Fetch ALL fields
      const volQ = query(collection(db, 'volunteer_applications'), orderBy('submittedAt', 'desc'));
      const volSnap = await getDocs(volQ);
      const volRows: VolunteerApplicationEntry[] = [];
      volSnap.forEach((d) => {
        const data: any = d.data();
        volRows.push({
          id: d.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age || '',
          city: data.city || '',
          occupation: data.occupation || '',
          experience: data.experience || '',
          skills: Array.isArray(data.skills) ? data.skills : [],
          interests: Array.isArray(data.interests) ? data.interests : [],
          availability: data.availability || '',
          motivation: data.motivation || '',
          preferredRole: data.preferredRole || '',
          languages: data.languages || [],
          tShirtSize: data.tShirtSize || '',
          emergencyContact: data.emergencyContact || undefined,
          heardAboutUs: data.heardAboutUs || '',
          whatsappConsent: data.whatsappConsent || false,
          submittedAt: data.submittedAt,
        });
      });
      setVolunteerApplications(volRows);

      // Newsletter Subscribers
      const nsQ = query(collection(db, 'newsletter_subscribers'), orderBy('subscribedAt', 'desc'));
      const nsSnap = await getDocs(nsQ);
      const nsRows: NewsletterSubscriberEntry[] = [];
      nsSnap.forEach((d) => {
        const data: any = d.data();
        nsRows.push({
          id: d.id,
          email: data.email || '',
          source: data.source || '',
          subscribedAt: data.subscribedAt,
        });
      });
      setNewsletterSubscribers(nsRows);
    } catch (e) {
      console.error('Error fetching applications', e);
    }
  };

  const fetchEditRequests = async () => {
    try {
      // Fetch project application edit requests
      const projEditQ = query(collection(db, 'project_application_edit_requests'), orderBy('submittedAt', 'desc'));
      const projEditSnap = await getDocs(projEditQ);
      const projEditReqs: ProjectApplicationEditRequest[] = [];
      projEditSnap.forEach((d) => {
        projEditReqs.push({ id: d.id, ...d.data() } as ProjectApplicationEditRequest);
      });
      setProjectEditRequests(projEditReqs);

      // Fetch event registration edit requests
      const evtEditQ = query(collection(db, 'event_registration_edit_requests'), orderBy('submittedAt', 'desc'));
      const evtEditSnap = await getDocs(evtEditQ);
      const evtEditReqs: EventRegistrationEditRequest[] = [];
      evtEditSnap.forEach((d) => {
        evtEditReqs.push({ id: d.id, ...d.data() } as EventRegistrationEditRequest);
      });
      setEventEditRequests(evtEditReqs);

      // Fetch project submission edit requests (for editing projects themselves)
      const projSubEditQ = query(collection(db, 'project_edit_requests'), orderBy('requestedAt', 'desc'));
      const projSubEditSnap = await getDocs(projSubEditQ);
      const projSubEditReqs: ProjectSubmissionEditRequest[] = [];
      projSubEditSnap.forEach((d) => {
        projSubEditReqs.push({ id: d.id, ...d.data() } as ProjectSubmissionEditRequest);
      });
      setProjectSubmissionEditRequests(projSubEditReqs);

      // Fetch event submission edit requests (for editing events themselves)
      const evtSubEditQ = query(collection(db, 'event_edit_requests'), orderBy('requestedAt', 'desc'));
      const evtSubEditSnap = await getDocs(evtSubEditQ);
      const evtSubEditReqs: EventSubmissionEditRequest[] = [];
      evtSubEditSnap.forEach((d) => {
        evtSubEditReqs.push({ id: d.id, ...d.data() } as EventSubmissionEditRequest);
      });
      setEventSubmissionEditRequests(evtSubEditReqs);
    } catch (e) {
      console.error('Error fetching edit requests', e);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const allSubmissions: SubmissionWithType[] = [];

      // Fetch project submissions
      const projectQuery = query(collection(db, 'project_submissions'), orderBy('submittedAt', 'desc'));
      const projectSnapshot = await getDocs(projectQuery);
      projectSnapshot.forEach((doc) => {
        allSubmissions.push({
          id: doc.id,
          ...doc.data(),
          submissionType: 'project'
        } as SubmissionWithType);
      });

      // Fetch event submissions
      const eventQuery = query(collection(db, 'event_submissions'), orderBy('submittedAt', 'desc'));
      const eventSnapshot = await getDocs(eventQuery);
      eventSnapshot.forEach((doc) => {
        allSubmissions.push({
          id: doc.id,
          ...doc.data(),
          submissionType: 'event'
        } as SubmissionWithType);
      });

      // Sort by submission date
      allSubmissions.sort((a, b) => b.submittedAt?.seconds - a.submittedAt?.seconds);
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportApplicationsToExcel = () => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      // Prepare rows with ALL fields
      const projectRows = projectApplications.map((p) => ({
        'Project Title': p.projectTitle,
        'Name': p.name,
        'Email': p.email,
        'Phone': p.phone,
        'Preferred Role': p.preferredRole || '',
        'Availability': p.availability || '',
        'Start Date': p.startAvailabilityDate || '',
        'End Date': p.endAvailabilityDate || '',
        'Skills': Array.isArray(p.skills) ? p.skills.join('; ') : '',
        'Languages': Array.isArray(p.languageProficiency) ? p.languageProficiency.join('; ') : '',
        'Transport': p.transportAvailable ? 'Yes' : 'No',
        'Equipment': Array.isArray(p.equipment) ? p.equipment.join('; ') : '',
        'Accessibility': p.accessibilityNeeds || '',
        'Emergency Contact Name': p.emergencyContact?.name || '',
        'Emergency Contact Phone': p.emergencyContact?.phone || '',
        'Emergency Contact Relation': p.emergencyContactRelation || '',
        'Liability Consent': p.consents?.liability ? 'Yes' : 'No',
        'Photo Consent': p.consents?.photo ? 'Yes' : 'No',
        'Background Check Consent': p.consents?.backgroundCheck ? 'Yes' : 'No',
        'Preferred Contact': p.preferredContactMethod || '',
        'Portfolio URLs': Array.isArray(p.portfolioUrls) ? p.portfolioUrls.join('; ') : '',
        'Heard About Us': p.heardAboutUs || '',
        'WhatsApp Consent': p.whatsappConsent ? 'Yes' : 'No',
        'Experience': p.experience || '',
        'Motivation': p.motivation || '',
        'Submitted': formatTimestamp(p.submittedAt),
      }));

      const eventRows = eventRegistrations.map((e) => ({
        'Event Title': e.eventTitle,
        'Event Date': e.eventDate || '',
        'Name': e.name,
        'Email': e.email,
        'Phone': e.phone,
        'Emergency Contact': e.emergencyContact || '',
        'Dietary Restrictions': e.dietaryRestrictions || '',
        'Shift Preference': e.shiftPreference || '',
        'Sessions': Array.isArray(e.sessionSelections) ? e.sessionSelections.join('; ') : '',
        'Team Preference': e.teamPreference || '',
        'T-shirt Size': e.tShirtSize || '',
        'Accessibility Needs': e.accessibilityNeeds || '',
        'Experience': e.experience || '',
        'Submitted': formatTimestamp(e.submittedAt),
      }));

      const volunteerRows = volunteerApplications.map((v) => ({
        'First Name': v.firstName,
        'Last Name': v.lastName,
        'Email': v.email,
        'Phone': v.phone,
        'Age': v.age || '',
        'City': v.city,
        'Occupation': v.occupation || '',
        'Availability': v.availability,
        'Skills': (v.skills || []).join('; '),
        'Interests': (v.interests || []).join('; '),
        'Experience': v.experience || '',
        'Motivation': v.motivation || '',
        'Submitted': formatTimestamp(v.submittedAt),
      }));

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(projectRows);
      const ws2 = XLSX.utils.json_to_sheet(eventRows);
      const ws3 = XLSX.utils.json_to_sheet(volunteerRows);
      XLSX.utils.book_append_sheet(wb, ws1, 'Project Users');
      XLSX.utils.book_append_sheet(wb, ws2, 'Event Users');
      XLSX.utils.book_append_sheet(wb, ws3, 'Join Us');
      XLSX.writeFile(wb, `wasilah-applications-${dateStr}.xlsx`);
    } catch (e) {
      console.error('Excel export failed', e);
      alert('Failed to export Excel. See console for details.');
    }
  };

  const exportRegisteredToExcel = () => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const rows = newsletterSubscribers.map((n) => ({
        Email: n.email,
        Source: n.source || '',
        Subscribed: formatTimestamp(n.subscribedAt),
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Registered Users');
      XLSX.writeFile(wb, `wasilah-registered-users-${dateStr}.xlsx`);
    } catch (e) {
      console.error('Registered users export failed', e);
      alert('Failed to export Excel. See console for details.');
    }
  };

  const fetchEditableContent = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'editableContent'));
      const content: EditableContent[] = [];
      
      querySnapshot.forEach((doc) => {
        content.push({
          id: doc.id,
          ...doc.data()
        } as EditableContent);
      });
      
      setEditableContent(content);
    } catch (error) {
      console.error('Error fetching editable content:', error);
    }
  };

  const updateResponseStatus = async (responseId: string, status: 'new' | 'reviewed' | 'responded') => {
    try {
      const response = responses.find(r => r.id === responseId);
      if (response) {
        const collectionName = response.type + 's';
        await updateDoc(doc(db, collectionName, responseId), { status });
        
        setResponses(prev => 
          prev.map(r => r.id === responseId ? { ...r, status } : r)
        );
      }
    } catch (error) {
      console.error('Error updating response status:', error);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, submissionType: 'project' | 'event', status: SubmissionStatus, comments?: string, reason?: string) => {
    try {
      const collectionName = submissionType === 'project' ? 'project_submissions' : 'event_submissions';
      const submission = submissions.find(s => s.id === submissionId);

      if (!submission) return;

      const now = new Date().toISOString();
      const auditEntry = {
        action: `Status changed to ${status}`,
        performedBy: currentUser?.uid || 'unknown',
        performedAt: now,
        details: comments || reason || `Submission ${status}`,
        previousStatus: submission.status,
        newStatus: status
      };

      const currentAuditTrail = Array.isArray(submission.auditTrail) ? submission.auditTrail : [];

      const updateData: any = {
        status,
        isVisible: status === 'approved',
        reviewedAt: now,
        reviewedBy: currentUser?.uid,
        adminComments: comments || '',
        rejectionReason: reason || '',
        auditTrail: [...currentAuditTrail, auditEntry],
        updatedAt: now
      };

      await updateDoc(doc(db, collectionName, submissionId), updateData);

      // Send email notification to user
      await sendEmail(formatSubmissionStatusUpdateEmail({
        type: submissionType,
        title: submission.title,
        submitterName: submission.submitterName,
        submitterEmail: submission.submitterEmail,
        status: status as 'approved' | 'rejected',
        adminComments: comments,
        rejectionReason: reason,
        timestamp: new Date().toISOString()
      }));

      // Update local state
      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, status, adminComments: comments, rejectionReason: reason, isVisible: status === 'approved' } : s)
      );

      setReviewingSubmission(null);
      setAdminComments('');
      setRejectionReason('');

      alert(`Submission ${status} successfully!`);
    } catch (error) {
      console.error('Error updating submission status:', error);
      alert('Error updating submission status. Please try again.');
    }
  };

  const toggleSubmissionVisibility = async (submissionId: string, submissionType: 'project' | 'event', currentVisibility: boolean) => {
    try {
      const collectionName = submissionType === 'project' ? 'project_submissions' : 'event_submissions';
      const submission = submissions.find(s => s.id === submissionId);

      if (!submission) return;

      const newVisibility = !currentVisibility;

      const updateData: any = {
        isVisible: newVisibility,
        auditTrail: [
          ...submission.auditTrail,
          {
            action: newVisibility ? 'Made visible' : 'Hidden from public',
            performedBy: currentUser?.uid,
            performedAt: new Date(),
            details: `Visibility toggled by admin`,
            previousStatus: submission.status,
            newStatus: submission.status
          }
        ]
      };

      await updateDoc(doc(db, collectionName, submissionId), updateData);

      // Update local state
      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, isVisible: newVisibility } : s)
      );

      alert(`Submission ${newVisibility ? 'shown' : 'hidden'} successfully!`);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Error toggling visibility. Please try again.');
    }
  };

  const handleApproveEditRequest = async (requestId: string, type: 'project' | 'event') => {
    if (!confirm('Approve these changes? The original application/registration will be updated.')) {
      return;
    }

    try {
      const collectionName = type === 'project' ? 'project_application_edit_requests' : 'event_registration_edit_requests';
      const originalCollectionName = type === 'project' ? 'project_applications' : 'event_registrations';
      
      // Get the edit request
      const editRequestRef = doc(db, collectionName, requestId);
      const editRequestSnap = await getDoc(editRequestRef);
      
      if (!editRequestSnap.exists()) {
        alert('Edit request not found');
        return;
      }

      const editRequest = editRequestSnap.data();
      const originalId = editRequest.originalApplicationId || editRequest.originalRegistrationId;
      
      // Update the original record with requested changes
      const originalRef = doc(db, originalCollectionName, originalId);
      await updateDoc(originalRef, {
        ...editRequest.requestedChanges,
        updatedAt: serverTimestamp(),
      });

      // Mark edit request as approved
      await updateDoc(editRequestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: currentUser?.email || 'admin',
      });

      alert('Edit request approved and changes applied!');
      await fetchEditRequests();
      await fetchApplications();
    } catch (error) {
      console.error('Error approving edit request:', error);
      alert('Error approving edit request. Please try again.');
    }
  };

  const handleRejectEditRequest = async (requestId: string, type: 'project' | 'event', reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const collectionName = type === 'project' ? 'project_application_edit_requests' : 'event_registration_edit_requests';
      const editRequestRef = doc(db, collectionName, requestId);
      
      await updateDoc(editRequestRef, {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: currentUser?.email || 'admin',
        reviewNotes: reason,
      });

      alert('Edit request rejected');
      await fetchEditRequests();
    } catch (error) {
      console.error('Error rejecting edit request:', error);
      alert('Error rejecting edit request. Please try again.');
    }
  };

  const handleApproveSubmissionEditRequest = async (requestId: string, type: 'project' | 'event') => {
    if (!confirm('Approve these changes? The original submission will be updated.')) {
      return;
    }

    try {
      const editRequestCollectionName = type === 'project' ? 'project_edit_requests' : 'event_edit_requests';
      const submissionCollectionName = type === 'project' ? 'project_submissions' : 'event_submissions';
      
      // Get the edit request
      const editRequestRef = doc(db, editRequestCollectionName, requestId);
      const editRequestSnap = await getDoc(editRequestRef);
      
      if (!editRequestSnap.exists()) {
        alert('Edit request not found');
        return;
      }

      const editRequest = editRequestSnap.data();
      const submissionId = editRequest.submissionId;
      
      // Create reference to the original submission
      const submissionRef = doc(db, submissionCollectionName, submissionId);
      
      // Get the current submission to preserve its audit trail and get title
      const submissionSnap = await getDoc(submissionRef);
      const currentAuditTrail = submissionSnap.exists() ? (submissionSnap.data().auditTrail || []) : [];
      const submissionTitle = submissionSnap.exists() ? (submissionSnap.data().title || 'Your Submission') : 'Your Submission';
      
      // Update the original submission with edited data
      await updateDoc(submissionRef, {
        ...editRequest.editedData,
        updatedAt: serverTimestamp(),
        auditTrail: [
          ...currentAuditTrail,
          {
            action: 'Edit request approved',
            performedBy: currentUser?.email || 'admin',
            performedAt: new Date().toISOString(),
            details: `Changes approved from edit request by ${editRequest.requestedByName}`,
          }
        ]
      });

      // Mark edit request as approved
      await updateDoc(editRequestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: currentUser?.email || 'admin',
      });

      // Send approval email (Spark plan compatible - client-side)
      try {
        await sendEditRequestStatusEmail({
          email: editRequest.requestedByEmail || '',
          name: editRequest.requestedByName || 'User',
          submissionTitle: submissionTitle,
          type: type,
          status: 'approved'
        });
        console.log('Edit request approval email sent');
      } catch (emailError) {
        console.error('Failed to send edit request approval email:', emailError);
        // Don't fail the approval if email fails
      }

      alert('Edit request approved and changes applied!');
      await fetchEditRequests();
      await fetchSubmissions();
    } catch (error) {
      console.error('Error approving submission edit request:', error);
      alert('Error approving edit request. Please try again.');
    }
  };

  const handleRejectSubmissionEditRequest = async (requestId: string, type: 'project' | 'event', reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const collectionName = type === 'project' ? 'project_edit_requests' : 'event_edit_requests';
      const submissionCollectionName = type === 'project' ? 'project_submissions' : 'event_submissions';
      const editRequestRef = doc(db, collectionName, requestId);
      
      // Get the edit request for email
      const editRequestSnap = await getDoc(editRequestRef);
      if (editRequestSnap.exists()) {
        const editRequest = editRequestSnap.data();
        
        // Get submission title
        const submissionRef = doc(db, submissionCollectionName, editRequest.submissionId);
        const submissionSnap = await getDoc(submissionRef);
        const submissionTitle = submissionSnap.exists() ? (submissionSnap.data().title || 'Your Submission') : 'Your Submission';
        
        // Update edit request status
        await updateDoc(editRequestRef, {
          status: 'rejected',
          reviewedAt: serverTimestamp(),
          reviewedBy: currentUser?.email || 'admin',
          reviewNotes: reason,
        });

        // Send rejection email (Spark plan compatible - client-side)
        try {
          await sendEditRequestStatusEmail({
            email: editRequest.requestedByEmail || '',
            name: editRequest.requestedByName || 'User',
            submissionTitle: submissionTitle,
            type: type,
            status: 'rejected',
            rejectionReason: reason
          });
          console.log('Edit request rejection email sent');
        } catch (emailError) {
          console.error('Failed to send edit request rejection email:', emailError);
          // Don't fail the rejection if email fails
        }
      } else {
        await updateDoc(editRequestRef, {
          status: 'rejected',
          reviewedAt: serverTimestamp(),
          reviewedBy: currentUser?.email || 'admin',
          reviewNotes: reason,
        });
      }

      alert('Edit request rejected');
      await fetchEditRequests();
    } catch (error) {
      console.error('Error rejecting submission edit request:', error);
      alert('Error rejecting edit request. Please try again.');
    }
  };

  const handleMigrateVisibility = async () => {
    if (!confirm('This will set isVisible=true for all approved submissions. Continue?')) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await migrateApprovedSubmissions();
      alert(`Migration complete! Updated ${result.updatedProjects} projects and ${result.updatedEvents} events.`);
      await fetchSubmissions();
    } catch (error) {
      console.error('Migration error:', error);
      alert('Migration failed. Check console for details.');
    } finally {
      setIsMigrating(false);
    }
  };

  const deleteSubmission = async (submissionId: string, submissionType: 'project' | 'event') => {
    if (!confirm('Are you sure you want to permanently delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const collectionName = submissionType === 'project' ? 'project_submissions' : 'event_submissions';

      await deleteDoc(doc(db, collectionName, submissionId));

      // Update local state
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));

      alert('Submission deleted successfully!');
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Error deleting submission. Please try again.');
    }
  };

  const updateContent = async (contentId: string, newContent: string) => {
    try {
      await updateDoc(doc(db, 'editableContent', contentId), {
        content: newContent,
        lastUpdated: new Date()
      });
      
      setEditableContent(prev =>
        prev.map(c => c.id === contentId ? { ...c, content: newContent } : c)
      );
      
      setEditingContent(null);
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const addNewEvent = async () => {
    try {
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        createdAt: new Date(),
        status: 'active'
      });
      
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'Community'
      });
      setShowNewEventForm(false);
      
      alert('Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Error adding event. Please try again.');
    }
  };

  const exportResponses = () => {
    const csvContent = responses.map(response => ({
      Type: response.type,
      Status: response.status,
      Date: response.timestamp?.toDate?.()?.toLocaleDateString() || 'N/A',
      Data: JSON.stringify(response.data)
    }));

    const csv = [
      Object.keys(csvContent[0]).join(','),
      ...csvContent.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wasilah-responses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSubmissionStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionTypeColor = (type: 'project' | 'event') => {
    return type === 'project' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  if (!isOpen || !isAdmin) return null;

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'volunteer': return 'bg-green-100 text-green-800';
      case 'contact': return 'bg-blue-100 text-blue-800';
      case 'chat': return 'bg-purple-100 text-purple-800';
      case 'event': return 'bg-orange-100 text-orange-800';
      case 'project': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format emergency contact display
  const formatEmergencyContact = (emergencyContact: any, relation?: string) => {
    if (!emergencyContact) return '—';
    const name = emergencyContact.name || '';
    const phone = emergencyContact.phone || '';
    const rel = relation ? `(${relation})` : '';
    return `${name} ${rel} ${phone}`.trim() || '—';
  };

  return (
    <>
      {/* Backdrop - Z-INDEX: 60 */}
      <div 
        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Admin Panel Modal - Z-INDEX: 70 */}
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-6xl h-[95vh] md:h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Admin Panel</h2>
            <p className="text-xs md:text-base text-white/90 hidden sm:block font-medium">Manage your Wasilah website</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-300 bg-gray-100 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400">
          {[
            { id: 'responses', label: 'Responses', shortLabel: 'Resp', icon: MessageSquare },
            { id: 'submissions', label: 'Submissions', shortLabel: 'Sub', icon: FileText },
            { id: 'analytics', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3 },
            { id: 'applications', label: 'Applications', shortLabel: 'Apps', icon: Users },
            { id: 'edit-requests', label: 'Edit Requests', shortLabel: 'Edits', icon: RefreshCw },
            { id: 'registered', label: 'Registered Users', shortLabel: 'Reg', icon: Users },
            { id: 'chats', label: 'Chats', shortLabel: 'Chat', icon: MessageSquare },
            { id: 'kb', label: 'Knowledge Base', shortLabel: 'KB', icon: Database },
            { id: 'content', label: 'Edit Content', shortLabel: 'Edit', icon: Edit3 },
            { id: 'events', label: 'Manage Events', shortLabel: 'Events', icon: Calendar },
            { id: 'users', label: 'User Activity', shortLabel: 'Users', icon: Users },
            { id: 'settings', label: 'Settings', shortLabel: 'Set', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 md:px-6 py-3 md:py-4 font-bold transition-colors whitespace-nowrap text-sm md:text-base ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                  : 'text-gray-900 hover:text-purple-600'
              }`}
            >
              <tab.icon className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
              <span className="hidden sm:inline ml-2">{tab.label}</span>
              <span className="sm:hidden ml-1.5">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {/* Quick Actions Panel */}
          <div className="mb-4 md:mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-3 md:p-4 rounded-lg md:rounded-luxury border border-blue-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-luxury-heading text-black mb-1">Quick Actions</h3>
                <p className="text-xs md:text-sm text-black/70 hidden sm:block">Manage chatbot and website settings</p>
              </div>
              <Link
                to="/admin/kb-manager"
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg md:rounded-luxury hover:bg-blue-700 transition-colors font-medium text-sm md:text-base w-full sm:w-auto justify-center"
              >
                <Database className="w-4 h-4 md:w-5 md:h-5" />
                <span>KB Manager</span>
                <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
              </Link>
            </div>
          </div>

          {/* Responses Tab */}
          {activeTab === 'responses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-luxury-heading text-black">All Responses</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={exportResponses}
                    className="flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                  <button
                    onClick={fetchResponses}
                    className="flex items-center px-4 py-2 bg-logo-navy text-cream-elegant rounded-luxury hover:bg-logo-navy-light transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto"></div>
                  <p className="mt-4 text-black">Loading responses...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <div key={response.id} className="luxury-card bg-cream-white p-6 border-l-4 border-vibrant-orange">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getResponseTypeColor(response.type)}`}>
                            {response.type.charAt(0).toUpperCase() + response.type.slice(1)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(response.status)}`}>
                            {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {response.timestamp?.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateResponseStatus(response.id, 'reviewed')}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateResponseStatus(response.id, 'responded')}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-black">
                        {response.type === 'volunteer' && (
                          <div>
                            <p><strong>Name:</strong> {response.data.firstName} {response.data.lastName}</p>
                            <p><strong>Email:</strong> {response.data.email}</p>
                            <p><strong>Phone:</strong> {response.data.phone}</p>
                            <p><strong>City:</strong> {response.data.city}</p>
                            <p><strong>Skills:</strong> {response.data.skills?.join(', ') || 'None'}</p>
                            <p><strong>Interests:</strong> {response.data.interests?.join(', ') || 'None'}</p>
                          </div>
                        )}
                        
                        {response.type === 'contact' && (
                          <div>
                            <p><strong>Name:</strong> {response.data.name}</p>
                            <p><strong>Email:</strong> {response.data.email}</p>
                            <p><strong>Subject:</strong> {response.data.subject}</p>
                            <p><strong>Message:</strong> {response.data.message}</p>
                            <div className="mt-4">
                              <a
                                href={`mailto:${response.data.email}?subject=Re: ${encodeURIComponent(response.data.subject)}`}
                                className="inline-flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors text-sm"
                              >
                                <MailIcon className="w-4 h-4 mr-2" />
                                Reply via Email
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {response.type === 'chat' && (
                          <div>
                            <p><strong>Message:</strong> {response.data.message}</p>
                            <p><strong>Page:</strong> {response.data.page}</p>
                            {response.data.timestamp && (
                              <p className="text-xs text-gray-500 mt-2">
                                <strong>Time:</strong> {new Date(response.data.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'registered' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-luxury-heading text-black">Registered Users (Newsletter)</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => exportRegisteredToExcel()}
                    className="flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                  </button>
                  <button
                    onClick={fetchApplications}
                    className="flex items-center px-4 py-2 bg-logo-navy text-cream-elegant rounded-luxury hover:bg-logo-navy-light transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-left">
                      {['Email', 'Source', 'Subscribed'].map((h) => (
                        <th key={h} className="px-3 py-2 border-b text-black">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {newsletterSubscribers.map((n) => (
                      <tr key={n.id} className="odd:bg-white even:bg-gray-50">
                        <td className="px-3 py-2 border-b text-black">{n.email}</td>
                        <td className="px-3 py-2 border-b text-black">{n.source || '—'}</td>
                        <td className="px-3 py-2 border-b text-black">{formatTimestamp(n.subscribedAt)}</td>
                      </tr>
                    ))}
                    {newsletterSubscribers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-gray-600">No subscribers yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* KB Manager Tab */}
          {activeTab === 'kb' && (
            <div className="space-y-6">
              <p className="text-black/80">Enable the chatbot knowledge base and manage content.</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={async () => {
                    try {
                      const res = await seedKnowledgeBase();
                      alert(`Knowledge Base enabled. ${res.success.length} pages seeded${res.failed.length ? `, ${res.failed.length} failed` : ''}.`);
                    } catch (e: any) {
                      alert('Failed to enable Knowledge Base: ' + (e?.message || 'unknown error'));
                    }
                  }}
                  className="inline-flex items-center px-5 py-3 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-light transition-colors"
                >
                  Enable Knowledge Base
                </button>
                <a
                  href="/admin/kb-manager"
                  className="inline-flex items-center px-5 py-3 bg-logo-navy text-cream-elegant rounded-luxury hover:bg-logo-navy-light transition-colors"
                >
                  Go to KB Manager
                </a>
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'chats' && (
            <ChatsPanel />
          )}

          {activeTab === 'applications' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-luxury-heading text-black">Applications & Registrations</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => exportApplicationsToExcel()}
                    className="flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                  </button>
                  <button
                    onClick={fetchApplications}
                    className="flex items-center px-4 py-2 bg-logo-navy text-cream-elegant rounded-luxury hover:bg-logo-navy-light transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Project Users */}
              <section>
                <h4 className="text-xl font-luxury-heading text-black mb-4">Project Users</h4>
                {renderGroupedTable(
                  groupBy(projectApplications, (a) => a.projectTitle || 'Untitled Project'),
                  PROJECT_APPLICATION_COLUMNS,
                  (row) => [
                    row.projectId ? (<a href={`/projects/${row.projectId}`} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Open</a>) : '—',
                    row.name,
                    row.email,
                    row.phone,
                    (row.preferredRole || '—'),
                    (row.availability || '—'),
                    Array.isArray(row.skills) ? row.skills.join(', ') : '—',
                    Array.isArray(row.languageProficiency) ? row.languageProficiency.join(', ') : '—',
                    row.transportAvailable ? 'Yes' : 'No',
                    Array.isArray(row.equipment) ? row.equipment.join(', ') : '—',
                    row.accessibilityNeeds || '—',
                    formatEmergencyContact(row.emergencyContact, row.emergencyContactRelation),
                    row.consents ? [row.consents.liability ? 'Liability' : null, row.consents.photo ? 'Photo' : null, row.consents.backgroundCheck ? 'Background' : null].filter(Boolean).join(', ') || '—' : '—',
                    row.preferredContactMethod || '—',
                    Array.isArray(row.portfolioUrls) ? row.portfolioUrls.join(', ') : '—',
                    row.heardAboutUs || '—',
                    row.whatsappConsent ? 'Yes' : 'No',
                    row.experience || '—',
                    row.motivation || '—',
                    formatTimestamp(row.submittedAt),
                  ]
                )}
                {projectApplications.length === 0 && (
                  <div className="text-sm text-gray-600">No project applications yet.</div>
                )}
              </section>

              {/* Event Users */}
              <section>
                <h4 className="text-xl font-luxury-heading text-black mb-4">Event Users</h4>
                {renderGroupedTable(
                  groupBy(eventRegistrations, (a) => a.eventTitle || 'Untitled Event'),
                  EVENT_REGISTRATION_COLUMNS,
                  (row) => [
                    row.eventId ? (<a href={`/events/${row.eventId}`} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Open</a>) : '—',
                    row.name,
                    row.email,
                    row.phone,
                    row.emergencyContact || '—',
                    row.dietaryRestrictions || '—',
                    row.medicalConditions || '—',
                    row.shiftPreference || '—',
                    Array.isArray(row.sessionSelections) ? row.sessionSelections.join(', ') : '—',
                    row.teamPreference || '—',
                    row.tShirtSize || '—',
                    row.accessibilityNeeds || '—',
                    row.consents ? [row.consents.liability ? 'Liability' : null, row.consents.photo ? 'Photo' : null].filter(Boolean).join(', ') || '—' : '—',
                    row.preferredContactMethod || '—',
                    row.heardAboutUs || '—',
                    row.whatsappConsent ? 'Yes' : 'No',
                    row.experience || '—',
                    formatTimestamp(row.submittedAt),
                  ]
                )}
                {eventRegistrations.length === 0 && (
                  <div className="text-sm text-gray-600">No event registrations yet.</div>
                )}
              </section>

              {/* Join Us Responses */}
              <section>
                <h4 className="text-xl font-luxury-heading text-black mb-4">Join Us Responses</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead className="bg-gray-100">
                      <tr className="text-left">
                        {[
                          'First Name','Last Name','Email','Phone','Age','City','Occupation','Availability','Skills','Interests','Experience','Motivation','Submitted'
                        ].map((h) => (
                          <th key={h} className="px-3 py-2 border-b text-black">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {volunteerApplications.map((v) => (
                        <tr key={v.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2 border-b text-black">{v.firstName}</td>
                          <td className="px-3 py-2 border-b text-black">{v.lastName}</td>
                          <td className="px-3 py-2 border-b text-black">{v.email}</td>
                          <td className="px-3 py-2 border-b text-black">{v.phone}</td>
                          <td className="px-3 py-2 border-b text-black">{v.age || '—'}</td>
                          <td className="px-3 py-2 border-b text-black">{v.city}</td>
                          <td className="px-3 py-2 border-b text-black">{v.occupation || '—'}</td>
                          <td className="px-3 py-2 border-b text-black">{v.availability}</td>
                          <td className="px-3 py-2 border-b text-black break-words">{(v.skills || []).join(', ')}</td>
                          <td className="px-3 py-2 border-b text-black break-words">{(v.interests || []).join(', ')}</td>
                          <td className="px-3 py-2 border-b text-black whitespace-pre-wrap max-w-xs">{v.experience || '—'}</td>
                          <td className="px-3 py-2 border-b text-black whitespace-pre-wrap max-w-xs">{v.motivation || '—'}</td>
                          <td className="px-3 py-2 border-b text-black">{formatTimestamp(v.submittedAt)}</td>
                        </tr>
                      ))}
                      {volunteerApplications.length === 0 && (
                        <tr>
                          <td colSpan={13} className="px-3 py-6 text-center text-gray-600">No join us responses yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
          {activeTab === 'edit-requests' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-luxury-heading text-black">Edit Requests</h3>
                <button
                  onClick={fetchEditRequests}
                  className="flex items-center px-4 py-2 bg-logo-navy text-cream-elegant rounded-luxury hover:bg-logo-navy-light transition-colors"
                >
                  Refresh
                </button>
              </div>

              {/* Project Application Edit Requests */}
              <section>
                <h4 className="text-xl font-luxury-heading text-black mb-4">Project Application Edits</h4>
                {projectEditRequests.length === 0 ? (
                  <div className="text-sm text-gray-600">No pending edit requests for project applications.</div>
                ) : (
                  <div className="space-y-4">
                    {projectEditRequests.map((request) => (
                      <div key={request.id} className="luxury-card bg-cream-white p-6 border-l-4 border-vibrant-orange">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="text-lg font-luxury-semibold text-black">{request.projectTitle}</h5>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-black/70">User: {request.userEmail}</p>
                            <p className="text-sm text-black/70">Submitted: {formatTimestamp(request.submittedAt)}</p>
                          </div>
                        </div>

                        {/* Diff View */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="font-luxury-semibold text-black mb-2 text-sm">Original Data</h6>
                            <div className="bg-red-50 p-4 rounded-lg text-sm space-y-1">
                              {Object.entries(request.originalData || {}).map(([key, value]: [string, any]) => {
                                if (key === 'id' || key === 'submittedAt') return null;
                                const newValue = request.requestedChanges?.[key];
                                const hasChanged = JSON.stringify(value) !== JSON.stringify(newValue);
                                if (!hasChanged) return null;
                                
                                return (
                                  <div key={key} className="border-b border-red-200 pb-1">
                                    <span className="font-medium text-black">{key}:</span>{' '}
                                    <span className="text-black/80">{
                                      Array.isArray(value) ? value.join(', ') :
                                      typeof value === 'object' ? JSON.stringify(value) :
                                      String(value || '—')
                                    }</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <h6 className="font-luxury-semibold text-black mb-2 text-sm">Requested Changes</h6>
                            <div className="bg-green-50 p-4 rounded-lg text-sm space-y-1">
                              {Object.entries(request.requestedChanges || {}).map(([key, value]: [string, any]) => {
                                const oldValue = request.originalData?.[key];
                                const hasChanged = JSON.stringify(value) !== JSON.stringify(oldValue);
                                if (!hasChanged) return null;
                                
                                return (
                                  <div key={key} className="border-b border-green-200 pb-1">
                                    <span className="font-medium text-black">{key}:</span>{' '}
                                    <span className="text-black/80">{
                                      Array.isArray(value) ? value.join(', ') :
                                      typeof value === 'object' ? JSON.stringify(value) :
                                      String(value || '—')
                                    }</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {request.status === 'pending' && (
                          <div className="mt-4 flex space-x-3">
                            <button
                              onClick={() => handleApproveEditRequest(request.id, 'project')}
                              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-luxury hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Changes
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) handleRejectEditRequest(request.id, 'project', reason);
                              }}
                              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-luxury hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        )}

                        {request.status === 'rejected' && request.reviewNotes && (
                          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                            <p className="text-sm text-black"><strong>Rejection Reason:</strong> {request.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Event Registration Edit Requests */}
              <section>
                <h4 className="text-xl font-luxury-heading text-black mb-4">Event Registration Edits</h4>
                {eventEditRequests.length === 0 ? (
                  <div className="text-sm text-gray-600">No pending edit requests for event registrations.</div>
                ) : (
                  <div className="space-y-4">
                    {eventEditRequests.map((request) => (
                      <div key={request.id} className="luxury-card bg-cream-white p-6 border-l-4 border-vibrant-orange">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="text-lg font-luxury-semibold text-black">{request.eventTitle}</h5>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-black/70">User: {request.userEmail}</p>
                            <p className="text-sm text-black/70">Submitted: {formatTimestamp(request.submittedAt)}</p>
                          </div>
                        </div>

                        {/* Diff View */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="font-luxury-semibold text-black mb-2 text-sm">Original Data</h6>
                            <div className="bg-red-50 p-4 rounded-lg text-sm space-y-1">
                              {Object.entries(request.originalData || {}).map(([key, value]: [string, any]) => {
                                if (key === 'id' || key === 'submittedAt') return null;
                                const newValue = request.requestedChanges?.[key];
                                const hasChanged = JSON.stringify(value) !== JSON.stringify(newValue);
                                if (!hasChanged) return null;
                                
                                return (
                                  <div key={key} className="border-b border-red-200 pb-1">
                                    <span className="font-medium text-black">{key}:</span>{' '}
                                    <span className="text-black/80">{
                                      Array.isArray(value) ? value.join(', ') :
                                      typeof value === 'object' ? JSON.stringify(value) :
                                      String(value || '—')
                                    }</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <h6 className="font-luxury-semibold text-black mb-2 text-sm">Requested Changes</h6>
                            <div className="bg-green-50 p-4 rounded-lg text-sm space-y-1">
                              {Object.entries(request.requestedChanges || {}).map(([key, value]: [string, any]) => {
                                const oldValue = request.originalData?.[key];
                                const hasChanged = JSON.stringify(value) !== JSON.stringify(oldValue);
                                if (!hasChanged) return null;
                                
                                return (
                                  <div key={key} className="border-b border-green-200 pb-1">
                                    <span className="font-medium text-black">{key}:</span>{' '}
                                    <span className="text-black/80">{
                                      Array.isArray(value) ? value.join(', ') :
                                      typeof value === 'object' ? JSON.stringify(value) :
                                      String(value || '—')
                                    }</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {request.status === 'pending' && (
                          <div className="mt-4 flex space-x-3">
                            <button
                              onClick={() => handleApproveEditRequest(request.id, 'event')}
                              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-luxury hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Changes
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) handleRejectEditRequest(request.id, 'event', reason);
                              }}
                              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-luxury hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        )}

                        {request.status === 'rejected' && request.reviewNotes && (
                          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                            <p className="text-sm text-black"><strong>Rejection Reason:</strong> {request.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Project Submission Edit Requests (for editing projects themselves) */}
              <section>
                <h4 className="text-xl font-luxury-heading text-black mb-4">Project Submission Edits</h4>
                {projectSubmissionEditRequests.length === 0 ? (
                  <div className="text-sm text-gray-600">No pending edit requests for project submissions.</div>
                ) : (
                  <div className="space-y-4">
                    {projectSubmissionEditRequests.map((request) => (
                      <div key={request.id} className="luxury-card bg-cream-white p-6 border-l-4 border-vibrant-blue">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="text-lg font-luxury-semibold text-black">Edit Request for Project</h5>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-black/70">Requested by: {request.requestedByName} ({request.requestedByEmail})</p>
                            <p className="text-sm text-black/70">Submission ID: {request.submissionId}</p>
                            <p className="text-sm text-black/70">Submitted: {formatTimestamp(request.requestedAt)}</p>
                          </div>
                        </div>

                        {/* Edited Data Preview */}
                        <div className="mt-4">
                          <h6 className="font-luxury-semibold text-black mb-2 text-sm">Requested Changes:</h6>
                          <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2 max-h-96 overflow-y-auto">
                            {Object.entries(request.editedData || {}).map(([key, value]: [string, any]) => (
                              <div key={key} className="border-b border-blue-200 pb-2">
                                <span className="font-medium text-black capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                <span className="text-black/80">
                                  {Array.isArray(value) ? value.join(', ') :
                                   typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) :
                                   String(value || '—')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        {request.status === 'pending' && (
                          <div className="mt-4 flex space-x-3">
                            <button
                              onClick={() => handleApproveSubmissionEditRequest(request.id, 'project')}
                              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-luxury hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Changes
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) handleRejectSubmissionEditRequest(request.id, 'project', reason);
                              }}
                              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-luxury hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        )}

                        {request.status === 'rejected' && request.reviewNotes && (
                          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                            <p className="text-sm text-black"><strong>Rejection Reason:</strong> {request.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Event Submission Edit Requests (for editing events themselves) */}
              <section>
                <h4 className="text-xl font-luxury-heading text-black mb-4">Event Submission Edits</h4>
                {eventSubmissionEditRequests.length === 0 ? (
                  <div className="text-sm text-gray-600">No pending edit requests for event submissions.</div>
                ) : (
                  <div className="space-y-4">
                    {eventSubmissionEditRequests.map((request) => (
                      <div key={request.id} className="luxury-card bg-cream-white p-6 border-l-4 border-vibrant-blue">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="text-lg font-luxury-semibold text-black">Edit Request for Event</h5>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-black/70">Requested by: {request.requestedByName} ({request.requestedByEmail})</p>
                            <p className="text-sm text-black/70">Submission ID: {request.submissionId}</p>
                            <p className="text-sm text-black/70">Submitted: {formatTimestamp(request.requestedAt)}</p>
                          </div>
                        </div>

                        {/* Edited Data Preview */}
                        <div className="mt-4">
                          <h6 className="font-luxury-semibold text-black mb-2 text-sm">Requested Changes:</h6>
                          <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2 max-h-96 overflow-y-auto">
                            {Object.entries(request.editedData || {}).map(([key, value]: [string, any]) => (
                              <div key={key} className="border-b border-blue-200 pb-2">
                                <span className="font-medium text-black capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                <span className="text-black/80">
                                  {Array.isArray(value) ? value.join(', ') :
                                   typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) :
                                   String(value || '—')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        {request.status === 'pending' && (
                          <div className="mt-4 flex space-x-3">
                            <button
                              onClick={() => handleApproveSubmissionEditRequest(request.id, 'event')}
                              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-luxury hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Changes
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) handleRejectSubmissionEditRequest(request.id, 'event', reason);
                              }}
                              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-luxury hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        )}

                        {request.status === 'rejected' && request.reviewNotes && (
                          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                            <p className="text-sm text-black"><strong>Rejection Reason:</strong> {request.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-luxury-heading text-black">Content Submissions</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={handleMigrateVisibility}
                    disabled={isMigrating}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-luxury hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isMigrating ? 'animate-spin' : ''}`} />
                    {isMigrating ? 'Migrating...' : 'Fix Visibility'}
                  </button>
                  <button
                    onClick={fetchSubmissions}
                    className="flex items-center px-4 py-2 bg-logo-navy text-cream-elegant rounded-luxury hover:bg-logo-navy-light transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <AdvancedFilters
                onFilterChange={(criteria) => {
                  setFilterCriteria(criteria);
                }}
                onExport={(criteria) => {
                  const filtered = applyFilters(submissions, criteria);
                  try {
                    const workbook = XLSX.utils.book_new();
                    const worksheetData = filtered.map((item) => ({
                      Type: item.submissionType === 'project' ? 'Project' : 'Event',
                      ID: item.id,
                      Title: item.title,
                      Status: item.status,
                      Visibility: item.isVisible ? 'Visible' : 'Hidden',
                      Category: item.category,
                      Location: item.location,
                      Submitter: item.submitterName,
                      'Submitter Email': item.submitterEmail,
                      'Submitted At': item.submittedAt?.toDate?.()?.toISOString() || item.submittedAt,
                      'Reviewed At': item.reviewedAt?.toDate?.()?.toISOString() || item.reviewedAt,
                    }));
                    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
                    XLSX.writeFile(workbook, `submissions_export_${new Date().toISOString().split('T')[0]}.xlsx`);
                    alert(`Exported ${filtered.length} submission(s) to Excel`);
                  } catch (error) {
                    console.error('Error exporting:', error);
                    alert('Error exporting data');
                  }
                }}
                savedFilters={savedFilters}
                onSaveFilter={(filter) => {
                  const newFilter: SavedFilter = {
                    ...filter,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                  };
                  setSavedFilters([...savedFilters, newFilter]);
                }}
                onDeleteFilter={(filterId) => {
                  setSavedFilters(savedFilters.filter((f) => f.id !== filterId));
                }}
              />

              {/* Batch Operations */}
              {selectedSubmissions.length > 0 && (
                <BatchOperations
                  items={filteredSubmissions.map((s) => ({
                    id: s.id,
                    type: s.submissionType,
                    status: s.status,
                    isVisible: s.isVisible || false,
                    title: s.title,
                    submittedBy: s.submittedBy,
                    submitterEmail: s.submitterEmail,
                    submitterName: s.submitterName,
                  } as SelectableItem))}
                  selectedItems={selectedSubmissions}
                  onSelectionChange={setSelectedSubmissions}
                  onItemsUpdate={async (updatedItems) => {
                    // Refresh submissions after batch operations
                    await fetchSubmissions();
                    setSelectedSubmissions([]);
                  }}
                  currentUser={currentUser || undefined}
                />
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto"></div>
                  <p className="mt-4 text-black">Loading submissions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Showing {filteredSubmissions.length} of {submissions.length} submissions
                    {selectedSubmissions.length > 0 && ` (${selectedSubmissions.length} selected)`}
                  </div>
                  {filteredSubmissions.map((submission) => (
                    <div key={submission.id} className="luxury-card bg-cream-white p-6 border-l-4 border-vibrant-orange">
                      <div className="flex items-start space-x-3 mb-4">
                        {/* Checkbox for batch selection */}
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.includes(submission.id)}
                          onChange={() => {
                            if (selectedSubmissions.includes(submission.id)) {
                              setSelectedSubmissions(selectedSubmissions.filter((id) => id !== submission.id));
                            } else {
                              setSelectedSubmissions([...selectedSubmissions, submission.id]);
                            }
                          }}
                          className="mt-1 w-4 h-4 text-vibrant-orange rounded focus:ring-vibrant-orange"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubmissionTypeColor(submission.submissionType)}`}>
                                {submission.submissionType.charAt(0).toUpperCase() + submission.submissionType.slice(1)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubmissionStatusColor(submission.status)}`}>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </span>
                              {submission.isVisible !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${submission.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {submission.isVisible ? 'Visible' : 'Hidden'}
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {submission.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                              </span>
                            </div>

                            <div className="flex space-x-2">
                              {submission.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setReviewingSubmission(reviewingSubmission === submission.id ? null : submission.id)}
                                    className="text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 bg-blue-50 rounded-luxury"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Review
                                  </button>
                                  <button
                                    onClick={() => updateSubmissionStatus(submission.id, submission.submissionType, 'approved')}
                                    className="text-green-600 hover:text-green-800 flex items-center px-3 py-1 bg-green-50 rounded-luxury"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </button>
                                </>
                              )}

                              {submission.status === 'approved' && (
                                <button
                                  onClick={() => toggleSubmissionVisibility(submission.id, submission.submissionType, submission.isVisible || false)}
                                  className={`flex items-center px-3 py-1 rounded-luxury ${
                                    submission.isVisible
                                      ? 'text-gray-600 hover:text-gray-800 bg-gray-50'
                                      : 'text-green-600 hover:text-green-800 bg-green-50'
                                  }`}
                                  title={submission.isVisible ? 'Hide from public' : 'Show to public'}
                                >
                                  {submission.isVisible ? (
                                    <>
                                      <EyeOff className="w-4 h-4 mr-1" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-4 h-4 mr-1" />
                                      Show
                                    </>
                                  )}
                                </button>
                              )}

                              <button
                                onClick={() => deleteSubmission(submission.id, submission.submissionType)}
                                className="text-red-600 hover:text-red-800 flex items-center px-3 py-1 bg-red-50 rounded-luxury"
                                title="Delete submission"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="text-xl font-luxury-heading text-black mb-2">{submission.title}</h4>
                            <p className="text-black/70 font-luxury-body mb-2">{submission.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-black">
                              <div>
                                <strong>Category:</strong> {submission.category}
                              </div>
                              <div>
                                <strong>Location:</strong> {submission.location}
                              </div>
                              <div>
                                <strong>Submitted by:</strong> {submission.submitterName}
                              </div>
                              <div>
                                <strong>Contact:</strong> {submission.submitterEmail}
                              </div>
                            </div>
                          </div>

                          {/* Moderation Tools for pending submissions */}
                          {submission.status === 'pending' && reviewingSubmission === submission.id && (
                            <div className="mt-4">
                              <ModerationTools
                                item={submission as any}
                                onApprove={async (comments) => {
                                  await updateSubmissionStatus(submission.id, submission.submissionType, 'approved', comments);
                                  setReviewingSubmission(null);
                                  setAdminComments('');
                                  setRejectionReason('');
                                }}
                                onReject={async (reason, comments) => {
                                  await updateSubmissionStatus(submission.id, submission.submissionType, 'rejected', comments, reason);
                                  setReviewingSubmission(null);
                                  setAdminComments('');
                                  setRejectionReason('');
                                }}
                                currentUser={currentUser || undefined}
                              />
                            </div>
                          )}

                          {/* Legacy Review Form (kept for backward compatibility, can be removed later) */}
                          {reviewingSubmission === submission.id && submission.status === 'pending' && !selectedSubmissions.includes(submission.id) && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-luxury">
                          <h5 className="text-lg font-luxury-heading text-black mb-4">Review Submission</h5>

                          {/* Full Application Details */}
                          <div className="mb-6 space-y-6">
                            <div className="flex items-start gap-4">
                              {submission.image && (
                                <img
                                  src={submission.image}
                                  alt={submission.title}
                                  className="w-28 h-28 object-cover rounded-lg border"
                                />
                              )}
                              <div className="flex-1">
                                <h6 className="text-base font-luxury-heading text-black">Full Application</h6>
                                <p className="text-sm text-black/70">See all details submitted by the user</p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span className={`px-2 py-1 rounded-full ${getSubmissionTypeColor(submission.submissionType)}`}>{submission.submissionType}</span>
                                  <span className={`px-2 py-1 rounded-full ${getSubmissionStatusColor(submission.status)}`}>{submission.status}</span>
                                </div>
                              </div>
                            </div>

                            {/* Section: Public Information */}
                            <div className="bg-white p-4 rounded-luxury border">
                              <h6 className="text-sm font-luxury-heading text-black mb-3">Section 1: Public Information</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-black">
                                <div>
                                  <strong>Category:</strong> {submission.category || '—'}
                                </div>
                                <div>
                                  <strong>Location:</strong> {submission.location || '—'}
                                </div>
                                {submission.address && (
                                  <div className="md:col-span-2">
                                    <strong>Address:</strong> {submission.address}
                                  </div>
                                )}
                                {submission.submissionType === 'project' ? (
                                  <>
                                    <div>
                                      <strong>Expected Volunteers:</strong> {(submission as any).expectedVolunteers ?? '—'}
                                    </div>
                                    <div>
                                      <strong>Start Date:</strong> {(submission as any).startDate || '—'}
                                    </div>
                                    <div>
                                      <strong>End Date:</strong> {(submission as any).endDate || '—'}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <strong>Event Date:</strong> {(submission as any).date || '—'}
                                    </div>
                                    <div>
                                      <strong>Event Time:</strong> {(submission as any).time || '—'}
                                    </div>
                                    <div>
                                      <strong>Expected Attendees:</strong> {(submission as any).expectedAttendees ?? '—'}
                                    </div>
                                    <div>
                                      <strong>Cost:</strong> {(submission as any).cost || '—'}
                                    </div>
                                    {(submission as any).registrationDeadline && (
                                      <div>
                                        <strong>Registration Deadline:</strong> {(submission as any).registrationDeadline}
                                      </div>
                                    )}
                                  </>
                                )}
                                {(submission.latitude !== undefined && submission.longitude !== undefined) || submission.address ? (
                                  <div className="md:col-span-2">
                                    <a
                                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                      href={
                                        submission.latitude !== undefined && submission.longitude !== undefined
                                          ? `https://www.google.com/maps?q=${submission.latitude},${submission.longitude}`
                                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(submission.address || '')}`
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      View on Google Maps
                                    </a>
                                  </div>
                                ) : null}
                              </div>
                              {submission.description && (
                                <div className="mt-3 text-sm text-black/90">
                                  <strong>Description:</strong>
                                  <p className="mt-1 whitespace-pre-wrap">{submission.description}</p>
                                </div>
                              )}
                            </div>

                            {/* Section: Detailed Information */}
                            <div className="bg-white p-4 rounded-luxury border">
                              <h6 className="text-sm font-luxury-heading text-black mb-3">Section 2: Detailed Information</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-black">
                                {(submission as any).targetAudience && (
                                  <div>
                                    <strong>Target Audience:</strong> {(submission as any).targetAudience}
                                  </div>
                                )}
                                {(submission as any).durationEstimate && (
                                  <div>
                                    <strong>Duration Estimate:</strong> {(submission as any).durationEstimate}
                                  </div>
                                )}
                                {(submission as any).durationHours !== undefined && (
                                  <div>
                                    <strong>Duration (Hours):</strong> {(submission as any).durationHours}
                                  </div>
                                )}
                              </div>

                              {/* Lists */}
                              {Array.isArray((submission as any).requirements) && (submission as any).requirements.length > 0 && (
                                <div className="mt-3">
                                  <strong className="text-sm text-black">Requirements</strong>
                                  <ul className="list-disc list-inside mt-1 text-sm text-black/90 space-y-0.5">
                                    {(submission as any).requirements.map((item: string, idx: number) => (
                                      <li key={`req-${idx}`}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {submission.submissionType === 'project' && Array.isArray((submission as any).objectives) && (submission as any).objectives.length > 0 && (
                                <div className="mt-3">
                                  <strong className="text-sm text-black">Objectives</strong>
                                  <ul className="list-disc list-inside mt-1 text-sm text-black/90 space-y-0.5">
                                    {(submission as any).objectives.map((item: string, idx: number) => (
                                      <li key={`obj-${idx}`}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {submission.submissionType === 'event' && Array.isArray((submission as any).agenda) && (submission as any).agenda.length > 0 && (
                                <div className="mt-3">
                                  <strong className="text-sm text-black">Agenda</strong>
                                  <ul className="list-disc list-inside mt-1 text-sm text-black/90 space-y-0.5">
                                    {(submission as any).agenda.map((item: string, idx: number) => (
                                      <li key={`agenda-${idx}`}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {Array.isArray((submission as any).activities) && (submission as any).activities.length > 0 && (
                                <div className="mt-3">
                                  <strong className="text-sm text-black">Activities</strong>
                                  <ul className="list-disc list-inside mt-1 text-sm text-black/90 space-y-0.5">
                                    {(submission as any).activities.map((item: string, idx: number) => (
                                      <li key={`act-${idx}`}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {(submission as any).notes && (
                                <div className="mt-3">
                                  <strong className="text-sm text-black">Notes</strong>
                                  <p className="mt-1 text-sm text-black/90 whitespace-pre-wrap">{(submission as any).notes}</p>
                                </div>
                              )}
                            </div>

                            {/* Task Checklist */}
                            {Array.isArray((submission as any).checklist) && (submission as any).checklist.length > 0 && (
                              <div className="bg-white p-4 rounded-luxury border">
                                <h6 className="text-sm font-luxury-heading text-black mb-3">Task Checklist</h6>
                                <ul className="space-y-1 text-sm">
                                  {(submission as any).checklist.map((item: any) => (
                                    <li key={item.id} className="flex items-center gap-2">
                                      <span className={`inline-flex w-4 h-4 rounded border ${item.completed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`} />
                                      <span className="text-black/90">{item.text}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Reminders */}
                            {Array.isArray((submission as any).reminders) && (submission as any).reminders.length > 0 && (
                              <div className="bg-white p-4 rounded-luxury border">
                                <h6 className="text-sm font-luxury-heading text-black mb-3">Reminders</h6>
                                <ul className="space-y-1 text-sm text-black/90">
                                  {(submission as any).reminders.map((r: any) => (
                                    <li key={r.id} className="flex flex-col md:flex-row md:items-center md:gap-2">
                                      <span className="font-medium">{r.title}</span>
                                      <span className="text-black/70">{r.reminderDate} {r.reminderTime}</span>
                                      {Array.isArray(r.notifyEmails) && r.notifyEmails.length > 0 && (
                                        <span className="text-black/70">→ {r.notifyEmails.join(', ')}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Heads / Organizers */}
                            {Array.isArray(submission.heads) && submission.heads.length > 0 && (
                              <div className="bg-white p-4 rounded-luxury border">
                                <h6 className="text-sm font-luxury-heading text-black mb-3">{submission.submissionType === 'project' ? 'Project Heads' : 'Event Organizers'}</h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {submission.heads.map((h) => (
                                    <div key={h.id} className="flex items-center gap-3 p-2 rounded-lg border">
                                      {h.image ? (
                                        <img src={h.image} alt={h.name} className="w-10 h-10 rounded-full object-cover border" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                          {h.name?.charAt(0) || '?'}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium text-black truncate">{h.name}</div>
                                        <div className="text-xs text-black/70 truncate">{h.designation}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Admin-only Information */}
                            {(submission as any).budget || (submission as any).fundingSource || (submission as any).sponsorInfo || (submission as any).internalNotes ? (
                              <div className="bg-white p-4 rounded-luxury border">
                                <h6 className="text-sm font-luxury-heading text-black mb-3">Section 3: Admin-Only Information</h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-black">
                                  {(submission as any).budget && (
                                    <div>
                                      <strong>Budget:</strong> {(submission as any).budget}
                                    </div>
                                  )}
                                  {submission.submissionType === 'project' && (submission as any).fundingSource && (
                                    <div>
                                      <strong>Funding Source:</strong> {(submission as any).fundingSource}
                                    </div>
                                  )}
                                  {submission.submissionType === 'event' && (submission as any).sponsorInfo && (
                                    <div>
                                      <strong>Sponsor Info:</strong> {(submission as any).sponsorInfo}
                                    </div>
                                  )}
                                </div>
                                {(submission as any).internalNotes && (
                                  <div className="mt-2">
                                    <strong className="text-sm text-black">Internal Notes</strong>
                                    <p className="mt-1 text-sm text-black/90 whitespace-pre-wrap">{(submission as any).internalNotes}</p>
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {/* Contact Information */}
                            <div className="bg-white p-4 rounded-luxury border">
                              <h6 className="text-sm font-luxury-heading text-black mb-3">Contact Information</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-black">
                                <div>
                                  <strong>Email:</strong> {submission.contactEmail || '—'}
                                </div>
                                <div>
                                  <strong>Phone:</strong> {submission.contactPhone || '—'}
                                </div>
                              </div>
                            </div>

                            {/* Audit Trail */}
                            {Array.isArray(submission.auditTrail) && submission.auditTrail.length > 0 && (
                              <div className="bg-white p-4 rounded-luxury border">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="text-sm font-luxury-heading text-black">Audit Trail</h6>
                                  <button
                                    type="button"
                                    onClick={() => setShowAuditTrail((v) => !v)}
                                    className="text-xs text-vibrant-orange hover:underline"
                                  >
                                    {showAuditTrail ? 'Hide' : 'Show'}
                                  </button>
                                </div>
                                {showAuditTrail && (
                                  <ul className="space-y-1 text-sm text-black/90">
                                    {submission.auditTrail.map((a, idx) => (
                                      <li key={`audit-${idx}`} className="flex flex-col md:flex-row md:items-center md:gap-2">
                                        <span className="font-medium">{a.action}</span>
                                        {a.details && <span className="text-black/70">— {a.details}</span>}
                                        {a.performedAt && (
                                          <span className="text-black/60">@ {typeof a.performedAt === 'string' ? a.performedAt : (a.performedAt?.toDate?.()?.toLocaleString?.() || '')}</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {/* Raw JSON toggle */}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setShowRawJson((v) => !v)}
                                className="text-xs text-gray-600 hover:text-gray-800"
                              >
                                {showRawJson ? 'Hide raw JSON' : 'Show raw JSON'}
                              </button>
                              <div className="text-xs text-gray-500">
                                Submitted: {submission.submittedAt?.toDate?.()?.toLocaleString?.() || '—'}
                              </div>
                            </div>
                            {showRawJson && (
                              <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-auto text-black">
                                {JSON.stringify(submission, null, 2)}
                              </pre>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block font-luxury-medium text-black mb-2">Admin Comments</label>
                              <textarea
                                value={adminComments}
                                onChange={(e) => setAdminComments(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-luxury font-luxury-body"
                                rows={3}
                                placeholder="Add comments for the submitter..."
                              />
                            </div>
                            
                            <div>
                              <label className="block font-luxury-medium text-black mb-2">Rejection Reason (if rejecting)</label>
                              <input
                                type="text"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-luxury font-luxury-body"
                                placeholder="Brief reason for rejection..."
                              />
                            </div>
                            
                            <div className="flex space-x-3">
                              <button
                                onClick={() => updateSubmissionStatus(submission.id, submission.submissionType, 'approved', adminComments)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-luxury hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </button>
                              <button
                                onClick={() => updateSubmissionStatus(submission.id, submission.submissionType, 'rejected', adminComments, rejectionReason)}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-luxury hover:bg-red-700 transition-colors"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setReviewingSubmission(null);
                                  setAdminComments('');
                                  setRejectionReason('');
                                }}
                                className="flex items-center px-4 py-2 bg-gray-300 text-black rounded-luxury hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show admin comments and rejection reason if exists */}
                      {(submission.adminComments || submission.rejectionReason) && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-luxury">
                          {submission.adminComments && (
                            <div className="mb-2">
                              <strong className="text-black">Admin Comments:</strong>
                              <p className="text-black/70">{submission.adminComments}</p>
                            </div>
                          )}
                          {submission.rejectionReason && (
                            <div>
                              <strong className="text-red-700">Rejection Reason:</strong>
                              <p className="text-red-600">{submission.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredSubmissions.length === 0 && submissions.length > 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-luxury-heading text-black mb-2">No Submissions Match Filters</h3>
                      <p className="text-gray-600">Try adjusting your filters to see more results.</p>
                    </div>
                  )}
                  
                  {submissions.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-luxury-heading text-black mb-2">No Submissions Yet</h3>
                      <p className="text-black/70">User submissions will appear here for review.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <AnalyticsOverview />
            </div>
          )}

          {/* Content Management Tab */}
          {activeTab === 'content' && (
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Edit Website Content</h3>
              
              <div className="space-y-6">
                {editableContent.map((content) => (
                  <div key={content.id} className="luxury-card bg-cream-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-luxury-heading text-black">{content.section}</h4>
                      <button
                        onClick={() => setEditingContent(editingContent === content.id ? null : content.id)}
                        className="flex items-center px-3 py-1 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </div>
                    
                    {editingContent === content.id ? (
                      <div>
                        <textarea
                          value={content.content}
                          onChange={(e) => setEditableContent(prev =>
                            prev.map(c => c.id === content.id ? { ...c, content: e.target.value } : c)
                          )}
                          className="w-full h-32 p-3 border border-gray-300 rounded-luxury font-luxury-body"
                        />
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => updateContent(content.id, content.content)}
                            className="flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingContent(null)}
                            className="flex items-center px-4 py-2 bg-gray-300 text-black rounded-luxury hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-black font-luxury-body">
                        {content.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Management Tab */}
          {activeTab === 'events' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-luxury-heading text-black">Manage Events</h3>
                <button
                  onClick={() => setShowNewEventForm(true)}
                  className="flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Event
                </button>
              </div>

              {showNewEventForm && (
                <div className="luxury-card bg-cream-white p-6 mb-6">
                  <h4 className="text-lg font-luxury-heading text-black mb-4">Add New Event</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Event Title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-luxury font-luxury-body"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-luxury font-luxury-body"
                    />
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-luxury font-luxury-body"
                    />
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-luxury font-luxury-body"
                    />
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, category: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-luxury font-luxury-body"
                    >
                      <option value="Community">Community</option>
                      <option value="Health">Health</option>
                      <option value="Education">Education</option>
                      <option value="Environment">Environment</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Event Description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-luxury font-luxury-body h-24"
                  />
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={addNewEvent}
                      className="flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Event
                    </button>
                    <button
                      onClick={() => setShowNewEventForm(false)}
                      className="flex items-center px-4 py-2 bg-gray-300 text-black rounded-luxury hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* System Tab - Migration & Maintenance */}
          {activeTab === 'system' && (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-luxury-heading text-black mb-2">System Maintenance</h3>
                <p className="text-gray-600">
                  Run system maintenance tasks and migrations to keep data up-to-date
                </p>
              </div>

              {/* Migration Button */}
              <MigrationButton />

              {/* System Info */}
              <div className="bg-blue-50 rounded-2xl shadow-lg p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-black mb-4">
                  📊 Stats System Information
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Stats Tracking:</strong> Active - All approved/completed submissions count toward user stats
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Real-time Updates:</strong> Enabled - Stats update automatically when submissions are approved
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Impact Formula:</strong> (Projects × 10) + (Events × 5) + (Hours ÷ 2)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Hour Tracking:</strong> Based on durationHours field in submissions
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white rounded-lg border border-blue-300">
                  <h4 className="font-bold text-black mb-2">📝 How to Track User Participation:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      <strong>For Projects:</strong> Add user ID to <code className="px-2 py-1 bg-gray-100 rounded">participantIds</code> array
                    </li>
                    <li>
                      <strong>For Events:</strong> Add user ID to <code className="px-2 py-1 bg-gray-100 rounded">attendeeIds</code> array
                    </li>
                    <li>
                      <strong>Approve/Complete:</strong> Change status to <code className="px-2 py-1 bg-gray-100 rounded">approved</code> or <code className="px-2 py-1 bg-gray-100 rounded">completed</code>
                    </li>
                    <li>
                      <strong>Stats Update:</strong> User's Dashboard stats will update automatically in real-time
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;

// Helpers
function formatTimestamp(ts: any): string {
  if (!ts) return '—';
  try {
    if (typeof ts === 'string') return new Date(ts).toLocaleString();
    if (typeof ts?.toDate === 'function') return ts.toDate().toLocaleString();
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
  } catch {}
  return '—';
}

function groupBy<T>(items: T[], keyFn: (t: T) => string): Record<string, T[]> {
  return items.reduce((acc: Record<string, T[]>, item) => {
    const key = keyFn(item) || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function renderGroupedTable<T>(
  groups: Record<string, T[]>,
  headers: string[],
  rowFn: (row: any) => (string | number | undefined)[],
) {
  const groupNames = Object.keys(groups);
  if (groupNames.length === 0) return (
    <div className="text-sm text-gray-600">No data.</div>
  );
  return (
    <div className="space-y-6">
      {groupNames.map((group) => (
        <div key={group} className="luxury-card bg-cream-white p-4">
          <h5 className="text-lg font-luxury-heading text-black mb-3">{group}</h5>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left">
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 border-b text-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups[group].map((row: any, idx: number) => (
                  <tr key={idx} className="odd:bg-white even:bg-gray-50">
                    {rowFn(row).map((cell, i) => (
                      <td key={i} className="px-3 py-2 border-b text-black">
                        {cell as any}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// removed unused stub