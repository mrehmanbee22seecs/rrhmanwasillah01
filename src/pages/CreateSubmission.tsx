import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Save, Send, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../contexts/AuthContext';
import { ProjectSubmission, EventSubmission, SubmissionType, ChecklistItem, Reminder, HeadInfo } from '../types/submissions';
import { sendEmail, formatSubmissionReceivedEmail } from '../utils/emailService';
import InteractiveMap from '../components/InteractiveMap';
import ChecklistBuilder from '../components/ChecklistBuilder';
import ReminderManager from '../components/ReminderManager';
import { scheduleReminderEmails, formatReminderEmail } from '../utils/emailService';
import ImageUploadField from '../components/ImageUploadField';
import HeadsManager from '../components/HeadsManager';

const CreateSubmission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, userData, isAdmin } = useAuth();
  const [submissionType, setSubmissionType] = useState<SubmissionType>('project');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    const draftParam = searchParams.get('draft');
    const editParam = searchParams.get('edit');
    const prefillProjectId = searchParams.get('prefillProjectId');
    const prefillAffiliationName = searchParams.get('prefillAffiliationName');
    const prefillAffiliationType = searchParams.get('prefillAffiliationType');

    if (typeParam === 'event' || typeParam === 'project') {
      setSubmissionType(typeParam as SubmissionType);
    }

    // Handle edit mode
    if (editParam) {
      setEditId(editParam);
      setIsEditMode(true);
      loadExistingSubmission(editParam, typeParam as SubmissionType);
    }
    // Handle draft mode
    else if (draftParam) {
      setDraftId(draftParam);
      loadDraft(draftParam, typeParam as SubmissionType);
    }

    if (prefillProjectId) {
      setSubmissionType('event');
      setEventData(prev => ({
        ...prev,
        projectId: prefillProjectId,
        affiliation: {
          ...prev.affiliation,
          name: prefillAffiliationName || prev.affiliation.name,
          type: prefillAffiliationType || prev.affiliation.type || 'University Club'
        }
      }));

      // Validate project link early and provide friendly errors
      (async () => {
        try {
          const parentProjectRef = doc(db, 'project_submissions', prefillProjectId);
          const parentSnap = await getDoc(parentProjectRef);
          if (!parentSnap.exists()) {
            alert('Project not found. The project you are linking to may have been removed.');
            setEventData(prev => ({ ...prev, projectId: '' }));
            return;
          }
          const parent = parentSnap.data();
          const isOwner = currentUser && parent.submittedBy === currentUser.uid;
          if (!isOwner && !isAdmin) {
            alert('You are not allowed to add an event to this project.');
            setEventData(prev => ({ ...prev, projectId: '' }));
          }
        } catch (e) {
          console.warn('Project prefill validation failed:', e);
        }
      })();
    }
  }, [searchParams]);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [projectData, setProjectData] = useState({
    title: '',
    shortSummary: '',
    category: 'Education',
    image: '',
    location: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    expectedVolunteers: 10,
    peopleImpacted: undefined as number | undefined,
    startDate: '',
    endDate: '',
    description: '',
    targetAudience: '',
    durationEstimate: '',
    durationHours: undefined as number | undefined,
    requirements: [''],
    objectives: [''],
    activities: [''],
    contactEmail: userData?.email || '',
    contactPhone: '',
    budget: '',
    fundingSource: '',
    internalNotes: '',
    timeline: '',
    notes: '',
    checklist: [] as ChecklistItem[],
    reminders: [] as Reminder[],
    heads: [] as HeadInfo[],
    affiliation: { type: '', customType: '', name: '' },
    // New comprehensive fields
    perks: [''] as string[], // Benefits/certificates
    materialsList: [''] as string[], // What to bring
    safetyNotes: '',
    accessibilityInfo: '',
    requiredSkills: [''] as string[],
    preferredSkills: [''] as string[],
    sponsors: [''] as string[],
    donationLink: '',
    faq: [] as Array<{ question: string; answer: string }>
  });

  const [eventData, setEventData] = useState({
    title: '',
    shortSummary: '',
    category: 'Community',
    image: '',
    date: '',
    time: '',
    location: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    expectedAttendees: 50,
    peopleImpacted: undefined as number | undefined,
    cost: 'Free',
    registrationDeadline: '',
    description: '',
    targetAudience: '',
    durationEstimate: '',
    durationHours: undefined as number | undefined,
    requirements: [''],
    agenda: [''],
    activities: [''],
    contactEmail: userData?.email || '',
    contactPhone: '',
    budget: '',
    sponsorInfo: '',
    internalNotes: '',
    notes: '',
    checklist: [] as ChecklistItem[],
    reminders: [] as Reminder[],
    heads: [] as HeadInfo[],
    affiliation: { type: '', customType: '', name: '' },
    projectId: '',
    // New comprehensive fields
    servicesIncluded: [''] as string[], // What's provided
    materialsList: [''] as string[], // What to bring
    parkingInfo: '',
    accessibilityInfo: '',
    childcareAvailable: false,
    certifications: [''] as string[], // Certificates offered
    partners: [''] as string[],
    faq: [] as Array<{ question: string; answer: string }>
  });

  const projectCategories = ['Education', 'Healthcare', 'Environment', 'Technology', 'Community Development', 'Youth Programs'];
  const eventCategories = ['Community', 'Health', 'Education', 'Training', 'Environment', 'Fundraising'];

  const loadExistingSubmission = async (id: string, type: SubmissionType) => {
    setIsLoadingDraft(true);
    try {
      const collectionName = type === 'project' ? 'project_submissions' : 'event_submissions';
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if user has permission to edit
        if (!isAdmin && data.submittedBy !== currentUser?.uid) {
          alert('You do not have permission to edit this submission.');
          navigate('/dashboard');
          return;
        }
        
        // Check if submission is approved
        if (data.status !== 'approved') {
          alert('Only approved submissions can be edited. Please wait for admin approval first.');
          navigate('/dashboard');
          return;
        }

        // Load the data (same as draft loading)
        if (type === 'project') {
          setProjectData({
            title: data.title || '',
            shortSummary: data.shortSummary || '',
            category: data.category || 'Education',
            image: data.image || '',
            location: data.location || '',
            address: data.address || '',
            latitude: data.latitude,
            longitude: data.longitude,
            expectedVolunteers: data.expectedVolunteers || 10,
            peopleImpacted: data.peopleImpacted || undefined,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            description: data.description || '',
            targetAudience: data.targetAudience || '',
            durationEstimate: data.durationEstimate || '',
            durationHours: data.durationHours,
            requirements: data.requirements?.length > 0 ? data.requirements : [''],
            objectives: data.objectives?.length > 0 ? data.objectives : [''],
            activities: data.activities?.length > 0 ? data.activities : [''],
            contactEmail: data.contactEmail || userData?.email || '',
            contactPhone: data.contactPhone || '',
            budget: data.budget || '',
            fundingSource: data.fundingSource || '',
            internalNotes: data.internalNotes || '',
            timeline: data.timeline || '',
            notes: data.notes || '',
            checklist: data.checklist || [],
            reminders: data.reminders || [],
            heads: data.heads || [],
            affiliation: data.affiliation || { type: '', customType: '', name: '' },
            perks: data.perks?.length > 0 ? data.perks : [''],
            materialsList: data.materialsList?.length > 0 ? data.materialsList : [''],
            safetyNotes: data.safetyNotes || '',
            accessibilityInfo: data.accessibilityInfo || '',
            requiredSkills: data.requiredSkills?.length > 0 ? data.requiredSkills : [''],
            preferredSkills: data.preferredSkills?.length > 0 ? data.preferredSkills : [''],
            sponsors: data.sponsors?.length > 0 ? data.sponsors : [''],
            donationLink: data.donationLink || '',
            faq: data.faq || []
          });
        } else {
          setEventData({
            title: data.title || '',
            shortSummary: data.shortSummary || '',
            category: data.category || 'Community',
            image: data.image || '',
            date: data.date || '',
            time: data.time || '',
            location: data.location || '',
            address: data.address || '',
            latitude: data.latitude,
            longitude: data.longitude,
            expectedAttendees: data.expectedAttendees || 50,
            peopleImpacted: data.peopleImpacted || undefined,
            cost: data.cost || 'Free',
            registrationDeadline: data.registrationDeadline || '',
            description: data.description || '',
            targetAudience: data.targetAudience || '',
            durationEstimate: data.durationEstimate || '',
            durationHours: data.durationHours,
            requirements: data.requirements?.length > 0 ? data.requirements : [''],
            agenda: data.agenda?.length > 0 ? data.agenda : [''],
            contactEmail: data.contactEmail || userData?.email || '',
            contactPhone: data.contactPhone || '',
            notes: data.notes || '',
            checklist: data.checklist || [],
            reminders: data.reminders || [],
            heads: data.heads || [],
            projectId: data.projectId || '',
            affiliation: data.affiliation || { type: '', customType: '', name: '' },
            servicesIncluded: data.servicesIncluded?.length > 0 ? data.servicesIncluded : [''],
            materialsList: data.materialsList?.length > 0 ? data.materialsList : [''],
            parkingInfo: data.parkingInfo || '',
            accessibilityInfo: data.accessibilityInfo || '',
            childcareAvailable: data.childcareAvailable || false,
            certifications: data.certifications?.length > 0 ? data.certifications : [''],
            partners: data.partners?.length > 0 ? data.partners : [''],
            faq: data.faq || []
          });
        }
      } else {
        alert('Submission not found.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading submission for edit:', error);
      alert('Failed to load submission for editing.');
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const loadDraft = async (id: string, type: SubmissionType) => {
    setIsLoadingDraft(true);
    try {
      const collectionName = type === 'project' ? 'project_submissions' : 'event_submissions';
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (type === 'project') {
          setProjectData({
            title: data.title || '',
            shortSummary: data.shortSummary || '',
            category: data.category || 'Education',
            image: data.image || '',
            location: data.location || '',
            address: data.address || '',
            latitude: data.latitude,
            longitude: data.longitude,
            expectedVolunteers: data.expectedVolunteers || 10,
            peopleImpacted: data.peopleImpacted || undefined,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            description: data.description || '',
            targetAudience: data.targetAudience || '',
            durationEstimate: data.durationEstimate || '',
            durationHours: data.durationHours,
            requirements: data.requirements?.length > 0 ? data.requirements : [''],
            objectives: data.objectives?.length > 0 ? data.objectives : [''],
            activities: data.activities?.length > 0 ? data.activities : [''],
            contactEmail: data.contactEmail || userData?.email || '',
            contactPhone: data.contactPhone || '',
            budget: data.budget || '',
            fundingSource: data.fundingSource || '',
            internalNotes: data.internalNotes || '',
            timeline: data.timeline || '',
            notes: data.notes || '',
            checklist: data.checklist || [],
            reminders: data.reminders || [],
            heads: data.heads || [],
            affiliation: data.affiliation || { type: '', customType: '', name: '' },
            perks: data.perks?.length > 0 ? data.perks : [''],
            materialsList: data.materialsList?.length > 0 ? data.materialsList : [''],
            safetyNotes: data.safetyNotes || '',
            accessibilityInfo: data.accessibilityInfo || '',
            requiredSkills: data.requiredSkills?.length > 0 ? data.requiredSkills : [''],
            preferredSkills: data.preferredSkills?.length > 0 ? data.preferredSkills : [''],
            sponsors: data.sponsors?.length > 0 ? data.sponsors : [''],
            donationLink: data.donationLink || '',
            faq: data.faq || []
          });
        } else {
          setEventData({
            title: data.title || '',
            shortSummary: data.shortSummary || '',
            category: data.category || 'Community',
            image: data.image || '',
            date: data.date || '',
            time: data.time || '',
            location: data.location || '',
            address: data.address || '',
            latitude: data.latitude,
            longitude: data.longitude,
            expectedAttendees: data.expectedAttendees || 50,
            peopleImpacted: data.peopleImpacted || undefined,
            cost: data.cost || 'Free',
            registrationDeadline: data.registrationDeadline || '',
            description: data.description || '',
            targetAudience: data.targetAudience || '',
            durationEstimate: data.durationEstimate || '',
            durationHours: data.durationHours,
            requirements: data.requirements?.length > 0 ? data.requirements : [''],
            agenda: data.agenda?.length > 0 ? data.agenda : [''],
            activities: data.activities?.length > 0 ? data.activities : [''],
            contactEmail: data.contactEmail || userData?.email || '',
            contactPhone: data.contactPhone || '',
            budget: data.budget || '',
            sponsorInfo: data.sponsorInfo || '',
            internalNotes: data.internalNotes || '',
            notes: data.notes || '',
            checklist: data.checklist || [],
            reminders: data.reminders || [],
            heads: data.heads || [],
            affiliation: data.affiliation || { type: '', customType: '', name: '' },
            projectId: data.projectId || '',
            servicesIncluded: data.servicesIncluded?.length > 0 ? data.servicesIncluded : [''],
            materialsList: data.materialsList?.length > 0 ? data.materialsList : [''],
            parkingInfo: data.parkingInfo || '',
            accessibilityInfo: data.accessibilityInfo || '',
            childcareAvailable: data.childcareAvailable || false,
            certifications: data.certifications?.length > 0 ? data.certifications : [''],
            partners: data.partners?.length > 0 ? data.partners : [''],
            faq: data.faq || []
          });
        }
      } else {
        alert('Draft not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      alert('Failed to load draft');
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (submissionType === 'project') {
      setProjectData(prev => ({ ...prev, [field]: value }));
    } else {
      setEventData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayFieldChange = (field: 'requirements' | 'objectives' | 'agenda' | 'activities' | 'perks' | 'materialsList' | 'requiredSkills' | 'preferredSkills' | 'sponsors' | 'servicesIncluded' | 'certifications' | 'partners', index: number, value: string) => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newArray = [...(data[field] as string[])];
    newArray[index] = value;
    handleInputChange(field, newArray);
  };

  const addArrayField = (field: 'requirements' | 'objectives' | 'agenda' | 'activities' | 'perks' | 'materialsList' | 'requiredSkills' | 'preferredSkills' | 'sponsors' | 'servicesIncluded' | 'certifications' | 'partners') => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newArray = [...(data[field] as string[]), ''];
    handleInputChange(field, newArray);
  };

  const removeArrayField = (field: 'requirements' | 'objectives' | 'agenda' | 'activities' | 'perks' | 'materialsList' | 'requiredSkills' | 'preferredSkills' | 'sponsors' | 'servicesIncluded' | 'certifications' | 'partners', index: number) => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newArray = (data[field] as string[]).filter((_, i) => i !== index);
    handleInputChange(field, newArray);
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newFaq = [...data.faq];
    newFaq[index] = { ...newFaq[index], [field]: value };
    handleInputChange('faq', newFaq);
  };

  const addFaqItem = () => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newFaq = [...data.faq, { question: '', answer: '' }];
    handleInputChange('faq', newFaq);
  };

  const removeFaqItem = (index: number) => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newFaq = data.faq.filter((_, i) => i !== index);
    handleInputChange('faq', newFaq);
  };

  const validateForm = () => {
    const data = submissionType === 'project' ? projectData : eventData;
    const requiredFields = submissionType === 'project'
      ? ['title', 'shortSummary', 'category', 'location', 'startDate', 'endDate', 'description', 'contactEmail']
      : ['title', 'shortSummary', 'category', 'date', 'time', 'location', 'description', 'contactEmail'];

    return requiredFields.every(field => data[field as keyof typeof data]);
  };

  const handleEditSubmission = async (status: 'draft' | 'pending') => {
    if (!currentUser || !userData || !editId) return;

    try {
      const collectionName = submissionType === 'project' ? 'project_submissions' : 'event_submissions';
      const editRequestCollection = submissionType === 'project' ? 'project_edit_requests' : 'event_edit_requests';
      
      // Prepare the edited data
      let editedData: any;
      if (submissionType === 'project') {
        editedData = {
          title: projectData.title,
          shortSummary: projectData.shortSummary,
          category: projectData.category,
          image: projectData.image,
          location: projectData.location,
          address: projectData.address,
          latitude: projectData.latitude,
          longitude: projectData.longitude,
          expectedVolunteers: projectData.expectedVolunteers,
          peopleImpacted: projectData.peopleImpacted ?? null,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          description: projectData.description,
          targetAudience: projectData.targetAudience,
          durationEstimate: projectData.durationEstimate,
          durationHours: projectData.durationHours,
          requirements: projectData.requirements.filter(r => r.trim() !== ''),
          objectives: projectData.objectives.filter(o => o.trim() !== ''),
          activities: projectData.activities.filter(a => a.trim() !== ''),
          contactEmail: projectData.contactEmail,
          contactPhone: projectData.contactPhone,
          budget: projectData.budget,
          fundingSource: projectData.fundingSource,
          internalNotes: projectData.internalNotes,
          timeline: projectData.timeline,
          notes: projectData.notes,
          heads: projectData.heads,
          affiliation: projectData.affiliation,
          perks: projectData.perks.filter(p => p.trim() !== ''),
          materialsList: projectData.materialsList.filter(m => m.trim() !== ''),
          safetyNotes: projectData.safetyNotes,
          accessibilityInfo: projectData.accessibilityInfo,
          requiredSkills: projectData.requiredSkills.filter(s => s.trim() !== ''),
          preferredSkills: projectData.preferredSkills.filter(s => s.trim() !== ''),
          sponsors: projectData.sponsors.filter(s => s.trim() !== ''),
          donationLink: projectData.donationLink,
          faq: projectData.faq
        };
      } else {
        editedData = {
          title: eventData.title,
          shortSummary: eventData.shortSummary,
          category: eventData.category,
          image: eventData.image,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          address: eventData.address,
          latitude: eventData.latitude,
          longitude: eventData.longitude,
          expectedAttendees: eventData.expectedAttendees,
          peopleImpacted: eventData.peopleImpacted ?? null,
          cost: eventData.cost,
          registrationDeadline: eventData.registrationDeadline,
          description: eventData.description,
          targetAudience: eventData.targetAudience,
          durationEstimate: eventData.durationEstimate,
          durationHours: eventData.durationHours,
          requirements: eventData.requirements.filter(r => r.trim() !== ''),
          agenda: eventData.agenda.filter(a => a.trim() !== ''),
          contactEmail: eventData.contactEmail,
          contactPhone: eventData.contactPhone,
          notes: eventData.notes,
          heads: eventData.heads,
          projectId: eventData.projectId,
          affiliation: eventData.affiliation,
          servicesIncluded: eventData.servicesIncluded.filter(s => s.trim() !== ''),
          materialsList: eventData.materialsList.filter(m => m.trim() !== ''),
          parkingInfo: eventData.parkingInfo,
          accessibilityInfo: eventData.accessibilityInfo,
          childcareAvailable: eventData.childcareAvailable,
          certifications: eventData.certifications.filter(c => c.trim() !== ''),
          partners: eventData.partners.filter(p => p.trim() !== ''),
          faq: eventData.faq
        };
      }

      // If admin, apply changes immediately
      if (isAdmin) {
        await updateDoc(doc(db, collectionName, editId), {
          ...editedData,
          lastEditedAt: serverTimestamp(),
          lastEditedBy: currentUser.uid
        });
        
        alert(`${submissionType === 'project' ? 'Project' : 'Event'} updated successfully!`);
        navigate(submissionType === 'project' ? `/projects/${editId}` : `/events/${editId}`);
      } else {
        // For regular users, create an edit request
        await addDoc(collection(db, editRequestCollection), {
          submissionId: editId,
          submissionType,
          editedData,
          requestedBy: currentUser.uid,
          requestedByName: userData.displayName || 'Unknown User',
          requestedByEmail: userData.email || '',
          status: 'pending',
          requestedAt: serverTimestamp()
        });
        
        alert(`Edit request submitted! Your changes will be live once an admin approves them.`);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting edit:', error);
      alert('Failed to submit edit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'pending') => {
    if (!currentUser || !userData) return;

    setLoading(true);
    try {
      // Handle edit mode differently
      if (isEditMode && editId) {
        await handleEditSubmission(status);
        return;
      }

      const finalStatus = isAdmin && status === 'pending' ? 'approved' : status;
      let collectionName: string;
      let insertData: any;

      if (submissionType === 'project') {
        collectionName = 'project_submissions';
        insertData = {
          title: projectData.title,
          shortSummary: projectData.shortSummary,
          category: projectData.category,
          image: projectData.image,
          location: projectData.location,
          address: projectData.address,
          latitude: projectData.latitude,
          longitude: projectData.longitude,
          expectedVolunteers: projectData.expectedVolunteers,
          peopleImpacted: projectData.peopleImpacted ?? null,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          description: projectData.description,
          targetAudience: projectData.targetAudience,
          durationEstimate: projectData.durationEstimate,
          durationHours: projectData.durationHours,
          requirements: projectData.requirements.filter(r => r.trim() !== ''),
          objectives: projectData.objectives.filter(o => o.trim() !== ''),
          activities: projectData.activities.filter(a => a.trim() !== ''),
          contactEmail: projectData.contactEmail,
          contactPhone: projectData.contactPhone,
          budget: projectData.budget,
          fundingSource: projectData.fundingSource,
          internalNotes: projectData.internalNotes,
          timeline: projectData.timeline,
          notes: projectData.notes,
          heads: projectData.heads,
          affiliation: projectData.affiliation,
          perks: projectData.perks.filter(p => p.trim() !== ''),
          materialsList: projectData.materialsList.filter(m => m.trim() !== ''),
          safetyNotes: projectData.safetyNotes,
          accessibilityInfo: projectData.accessibilityInfo,
          requiredSkills: projectData.requiredSkills.filter(s => s.trim() !== ''),
          preferredSkills: projectData.preferredSkills.filter(s => s.trim() !== ''),
          sponsors: projectData.sponsors.filter(s => s.trim() !== ''),
          donationLink: projectData.donationLink,
          faq: projectData.faq,
          submittedBy: currentUser.uid,
          submitterName: userData.displayName || 'Unknown User',
          submitterEmail: userData.email || '',
          status: finalStatus,
          isVisible: finalStatus === 'approved',
          auditTrail: [],
          submittedAt: serverTimestamp(),
          participantIds: [currentUser.uid] // Start with submitter as participant
        };
      } else {
        collectionName = 'event_submissions';
        // If linking to a project, verify permissions client-side: only admins or the
        // owner of the project may add an event to that project.
        if (eventData.projectId) {
          try {
            const parentProjectRef = doc(db, 'project_submissions', eventData.projectId);
            const parentSnap = await getDoc(parentProjectRef);
            if (!parentSnap.exists()) {
              throw new Error('Parent project not found');
            }
            const parent = parentSnap.data();
            const isOwner = parent.submittedBy === currentUser.uid;
            if (!isOwner && !isAdmin) {
              throw new Error('You are not allowed to add an event to this project');
            }
          } catch (permErr: any) {
            console.error('Authorization failed for adding event to project:', permErr);
            alert(permErr?.message || 'You are not allowed to add an event to this project.');
            setLoading(false);
            return;
          }
        }

        insertData = {
          title: eventData.title,
          shortSummary: eventData.shortSummary,
          category: eventData.category,
          image: eventData.image,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          address: eventData.address,
          latitude: eventData.latitude,
          longitude: eventData.longitude,
          expectedAttendees: eventData.expectedAttendees,
          peopleImpacted: eventData.peopleImpacted ?? null,
          cost: eventData.cost,
          registrationDeadline: eventData.registrationDeadline,
          description: eventData.description,
          targetAudience: eventData.targetAudience,
          durationEstimate: eventData.durationEstimate,
          durationHours: eventData.durationHours,
          requirements: eventData.requirements.filter(r => r.trim() !== ''),
          agenda: eventData.agenda.filter(a => a.trim() !== ''),
          activities: eventData.activities.filter(a => a.trim() !== ''),
          contactEmail: eventData.contactEmail,
          contactPhone: eventData.contactPhone,
          budget: eventData.budget,
          sponsorInfo: eventData.sponsorInfo,
          internalNotes: eventData.internalNotes,
          notes: eventData.notes,
          heads: eventData.heads,
          affiliation: eventData.affiliation,
          projectId: eventData.projectId,
          servicesIncluded: eventData.servicesIncluded.filter(s => s.trim() !== ''),
          materialsList: eventData.materialsList.filter(m => m.trim() !== ''),
          parkingInfo: eventData.parkingInfo,
          accessibilityInfo: eventData.accessibilityInfo,
          childcareAvailable: eventData.childcareAvailable,
          certifications: eventData.certifications.filter(c => c.trim() !== ''),
          partners: eventData.partners.filter(p => p.trim() !== ''),
          faq: eventData.faq,
          submittedBy: currentUser.uid,
          submitterName: userData.displayName || 'Unknown User',
          submitterEmail: userData.email || '',
          status: finalStatus,
          isVisible: finalStatus === 'approved',
          auditTrail: [],
          attendeeIds: [currentUser.uid], // Start with submitter as attendee
          submittedAt: serverTimestamp()
        };
      }

      console.log('Submitting to Firebase collection:', collectionName);
      console.log('Data to be inserted:', insertData);

      if (draftId) {
        await updateDoc(doc(db, collectionName, draftId), insertData);
        console.log(`${submissionType} draft updated with ID:`, draftId);
      } else {
        const docRef = await addDoc(collection(db, collectionName), insertData);
        console.log(`${submissionType} successfully saved with ID:`, docRef.id);
      }

      // Show user feedback immediately (no waiting for emails)
      if (finalStatus === 'pending') {
        setShowConfirmation(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else if (isAdmin && finalStatus === 'approved') {
        alert(`${submissionType === 'project' ? 'Project' : 'Event'} has been created and automatically approved!`);
        navigate(submissionType === 'project' ? '/projects' : '/events');
      } else if (status === 'draft') {
        alert('Draft saved successfully!');
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }

      // Fire-and-forget: send confirmation email and schedule reminders
      try {
        const when = submissionType === 'project'
          ? `${projectData.startDate || ''}${projectData.endDate ? ' - ' + projectData.endDate : ''}`
          : `${eventData.date || ''}${eventData.time ? ' @ ' + eventData.time : ''}`;
        sendEmail(formatSubmissionReceivedEmail({
          type: submissionType,
          title: submissionType === 'project' ? projectData.title : eventData.title,
          submitterName: userData.displayName || 'Friend',
          submitterEmail: userData.email || '',
          summary: submissionType === 'project' ? projectData.shortSummary : eventData.shortSummary,
          when
        })).catch((e) => console.warn('Email send failed (non-blocking):', e));

        const reminders = submissionType === 'project' ? projectData.reminders : eventData.reminders;
        for (const rem of reminders) {
          const sendAt = new Date(`${rem.reminderDate}T${rem.reminderTime}`);
          const html = formatReminderEmail({
            to: '',
            title: rem.title,
            description: rem.description,
            when: sendAt.toLocaleString(),
            submissionTitle: submissionType === 'project' ? projectData.title : eventData.title,
            submissionType: submissionType,
          }).html;
          scheduleReminderEmails({
            recipients: rem.notifyEmails,
            subject: `Reminder: ${rem.title}`,
            html,
            sendAtISO: sendAt.toISOString(),
          }).catch((e) => console.warn('Reminder schedule failed (non-blocking):', e));
        }
      } catch (e) {
        console.warn('Background tasks failed (non-blocking):', e);
      }
    } catch (error: any) {
      console.error('Error submitting:', error);
      let msg = 'Error submitting. Please try again.';
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'permission-denied':
            msg = 'You do not have permission to perform this action.';
            break;
          case 'not-found':
            msg = 'The requested document was not found.';
            break;
          case 'unauthenticated':
            msg = 'You must be signed in to perform this action.';
            break;
          default:
            msg = `An error occurred: ${error.message}`;
        }
      } else if (typeof error?.message === 'string') {
        msg = error.message;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingDraft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
          <p className="text-xl font-luxury-heading text-black">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || userData?.isGuest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-luxury-heading text-black mb-4">Authentication Required</h2>
          <p className="text-black font-luxury-body mb-6">You need to be signed in to create submissions.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-luxury-primary px-6 py-3"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="luxury-card bg-cream-white p-12 text-center max-w-md">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-luxury-heading text-black mb-4">Submission Received!</h2>
          <p className="text-black font-luxury-body mb-6">
            Your {submissionType} has been submitted for review. You'll receive an email notification once it's been reviewed by our team.
          </p>
          <div className="animate-pulse text-vibrant-orange font-luxury-semibold">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-vibrant-orange hover:text-vibrant-orange-dark mb-4 font-luxury-semibold"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-luxury-display text-black mb-4">
            {isEditMode ? 'Edit' : draftId ? 'Edit' : 'Create New'} {submissionType === 'project' ? 'Project' : 'Event'}
          </h1>
          <p className="text-xl text-black font-luxury-body">
            {draftId ? 'Continue editing your draft and submit when ready.' : 'Submit your ' + submissionType + ' idea for review and approval by our team.'}
          </p>
        </div>

        <div className="luxury-card bg-cream-white p-6 mb-8">
          <h3 className="text-xl font-luxury-heading text-black mb-4">What would you like to create?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSubmissionType('project')}
              className={`p-6 rounded-luxury border-2 transition-all ${
                submissionType === 'project'
                  ? 'border-vibrant-orange bg-vibrant-orange/5'
                  : 'border-gray-200 hover:border-vibrant-orange/50'
              }`}
            >
              <h4 className="text-lg font-luxury-heading text-black mb-2">Project</h4>
              <p className="text-black/70 font-luxury-body">Long-term initiatives that create lasting impact</p>
            </button>

            <button
              onClick={() => setSubmissionType('event')}
              className={`p-6 rounded-luxury border-2 transition-all ${
                submissionType === 'event'
                  ? 'border-vibrant-orange bg-vibrant-orange/5'
                  : 'border-gray-200 hover:border-vibrant-orange/50'
              }`}
            >
              <h4 className="text-lg font-luxury-heading text-black mb-2">Event</h4>
              <p className="text-black/70 font-luxury-body">One-time activities and community gatherings</p>
            </button>
          </div>
        </div>

        <div className="luxury-card bg-cream-white p-8">
          <form className="space-y-8">
            <div className="border-b-2 border-vibrant-orange/30 pb-8">
              <h3 className="text-2xl font-luxury-heading text-black mb-2">Section 1: Public Information</h3>
              <p className="text-sm text-gray-600 mb-6">This info appears on the main listing page for all visitors</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block font-luxury-medium text-black mb-2">Title *</label>
                  <input
                    type="text"
                    value={submissionType === 'project' ? projectData.title : eventData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder={`Enter ${submissionType} title`}
                  />
                </div>

                {/* Affiliation */}
                <div className="md:col-span-2">
                  <h4 className="text-xl font-luxury-heading text-black mb-2">Organization/Community Affiliation 🏢</h4>
                  <p className="text-sm text-gray-600 mb-3 font-luxury-body">
                    Are you organizing this {submissionType} on behalf of an organization or community group? This information will be displayed publicly.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={(submissionType === 'project' ? projectData.affiliation.type : eventData.affiliation.type) || ''}
                      onChange={(e) => handleInputChange('affiliation', {
                        ...(submissionType === 'project' ? projectData.affiliation : eventData.affiliation),
                        type: e.target.value
                      })}
                      className="px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury"
                    >
                      <option value="">Select organization type</option>
                      <option value="NGO">NGO</option>
                      <option value="University Club">University Club</option>
                      <option value="Company">Company</option>
                      <option value="Community Group">Community Group</option>
                      <option value="Religious Organization">Religious Organization</option>
                      <option value="Government">Government</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Custom type (if 'Other' selected)"
                      value={(submissionType === 'project' ? projectData.affiliation.customType : eventData.affiliation.customType) || ''}
                      onChange={(e) => handleInputChange('affiliation', {
                        ...(submissionType === 'project' ? projectData.affiliation : eventData.affiliation),
                        customType: e.target.value
                      })}
                      className="px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury"
                    />
                    <input
                      type="text"
                      placeholder="Organization name"
                      value={(submissionType === 'project' ? projectData.affiliation.name : eventData.affiliation.name) || ''}
                      onChange={(e) => handleInputChange('affiliation', {
                        ...(submissionType === 'project' ? projectData.affiliation : eventData.affiliation),
                        name: e.target.value
                      })}
                      className="px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-luxury-medium text-black mb-2">Category *</label>
                  <select
                    value={submissionType === 'project' ? projectData.category : eventData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  >
                    {(submissionType === 'project' ? projectCategories : eventCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-luxury-medium text-black mb-2">
                    Expected {submissionType === 'project' ? 'Volunteers' : 'Attendees'} *
                  </label>
                  <input
                    type="number"
                    value={submissionType === 'project' ? projectData.expectedVolunteers : eventData.expectedAttendees}
                    onChange={(e) => handleInputChange(
                      submissionType === 'project' ? 'expectedVolunteers' : 'expectedAttendees',
                      parseInt(e.target.value)
                    )}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    min="1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-luxury-medium text-black mb-2">
                    How many people are you hoping to impact? 🎯
                  </label>
                  <input
                    type="number"
                    value={submissionType === 'project' ? (projectData.peopleImpacted ?? '') : (eventData.peopleImpacted ?? '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleInputChange('peopleImpacted', undefined);
                      } else {
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num >= 0) {
                          handleInputChange('peopleImpacted', num);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    min="0"
                    placeholder="Enter estimated number of people who will benefit from this project/event"
                  />
                  <p className="text-sm text-gray-600 mt-1 font-luxury-body">
                    This includes direct beneficiaries, families, and communities affected by your {submissionType}. This helps us measure the broader social impact.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <InteractiveMap
                    location={submissionType === 'project' ? projectData.location : eventData.location}
                    address={submissionType === 'project' ? projectData.address : eventData.address}
                    latitude={submissionType === 'project' ? projectData.latitude : eventData.latitude}
                    longitude={submissionType === 'project' ? projectData.longitude : eventData.longitude}
                    onLocationChange={(value) => handleInputChange('location', value)}
                    onAddressChange={(value) => handleInputChange('address', value)}
                    onCoordinatesChange={(lat, lng) => {
                      handleInputChange('latitude', lat);
                      handleInputChange('longitude', lng);
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-luxury-medium text-black mb-2">Short Summary *</label>
                  <textarea
                    rows={2}
                    value={submissionType === 'project' ? projectData.shortSummary : eventData.shortSummary}
                    onChange={(e) => handleInputChange('shortSummary', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="Brief summary for card display (2-3 sentences)"
                  />
                </div>

                <div className="md:col-span-2">
                  <ImageUploadField
                    label="Cover Image *"
                    value={submissionType === 'project' ? projectData.image : eventData.image}
                    onChange={(url) => handleInputChange('image', url)}
                    folder={submissionType === 'project' ? 'projects' : 'events'}
                  />
                </div>
              </div>
            </div>

            {submissionType === 'project' ? (
              <div>
                <h3 className="text-2xl font-luxury-heading text-black mb-6">Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Start Date *</label>
                    <input
                      type="date"
                      value={projectData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    />
                  </div>
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">End Date *</label>
                    <input
                      type="date"
                      value={projectData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-luxury-medium text-black mb-2">Timeline Description</label>
                    <textarea
                      rows={3}
                      value={projectData.timeline}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder="Describe the project timeline and milestones"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-luxury-heading text-black mb-6">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Event Date *</label>
                    <input
                      type="date"
                      value={eventData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    />
                  </div>
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Event Time *</label>
                    <input
                      type="time"
                      value={eventData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    />
                  </div>
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Registration Deadline</label>
                    <input
                      type="date"
                      value={eventData.registrationDeadline}
                      onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    />
                  </div>
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Cost</label>
                    <input
                      type="text"
                      value={eventData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder="e.g., Free, $10, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border-b-2 border-vibrant-orange/30 pb-8">
              <h3 className="text-2xl font-luxury-heading text-black mb-2">Section 2: Detailed Information</h3>
              <p className="text-sm text-gray-600 mb-6">Shown when users click "Learn More"</p>

              <div className="space-y-6">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Full Description *</label>
                  <textarea
                    rows={5}
                    value={submissionType === 'project' ? projectData.description : eventData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="Detailed description of your project/event"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Target Audience</label>
                    <input
                      type="text"
                      value={submissionType === 'project' ? projectData.targetAudience : eventData.targetAudience}
                      onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder="e.g., Youth ages 12-18, Senior citizens"
                    />
                  </div>
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Duration Estimate</label>
                    <input
                      type="text"
                      value={submissionType === 'project' ? projectData.durationEstimate : eventData.durationEstimate}
                      onChange={(e) => handleInputChange('durationEstimate', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder="e.g., 3 hours, Full day, 6 months"
                    />
                  </div>
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">
                      Duration (Hours) *
                      <span className="text-sm text-gray-600 font-normal ml-2">For volunteer stats tracking</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={submissionType === 'project' ? projectData.durationHours || '' : eventData.durationHours || ''}
                      onChange={(e) => handleInputChange('durationHours', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder="e.g., 2.5, 8, 40"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      This will count toward volunteer hours when the {submissionType} is completed
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-luxury-heading text-black mb-4">Requirements</h4>
                  <div className="space-y-4">
                    {(submissionType === 'project' ? projectData.requirements : eventData.requirements).map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                          placeholder={`Requirement ${index + 1}`}
                        />
                        {(submissionType === 'project' ? projectData.requirements : eventData.requirements).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField('requirements', index)}
                            className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayField('requirements')}
                      className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Requirement
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-luxury-heading text-black mb-4">Objectives</h4>
                  <div className="space-y-4">
                    {(submissionType === 'project' ? projectData.objectives : eventData.agenda || ['']).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayFieldChange(submissionType === 'project' ? 'objectives' : 'agenda', index, e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                          placeholder={`Objective ${index + 1}`}
                        />
                        {(submissionType === 'project' ? projectData.objectives : eventData.agenda || ['']).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField(submissionType === 'project' ? 'objectives' : 'agenda', index)}
                            className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayField(submissionType === 'project' ? 'objectives' : 'agenda')}
                      className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Objective
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-luxury-heading text-black mb-4">Activities</h4>
                  <div className="space-y-4">
                    {(submissionType === 'project' ? projectData.activities : eventData.activities).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayFieldChange('activities', index, e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                          placeholder={`Activity ${index + 1}`}
                        />
                        {(submissionType === 'project' ? projectData.activities : eventData.activities).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField('activities', index)}
                            className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayField('activities')}
                      className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-luxury-medium text-black mb-2">Notes</label>
                  <textarea
                    rows={3}
                    value={submissionType === 'project' ? projectData.notes : eventData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="Any additional notes or special considerations"
                  />
                </div>
              </div>
            </div>

            {/* New Comprehensive Section */}
            <div className="border-b-2 border-vibrant-orange/30 pb-8">
              <h3 className="text-2xl font-luxury-heading text-black mb-2">🎯 Section 3: Additional Details & Benefits</h3>
              <p className="text-sm text-gray-600 mb-6">Help participants understand what they'll gain and what to expect</p>

              <div className="space-y-6">
                {/* Certificates/Perks for Projects, Certifications for Events */}
                {submissionType === 'project' ? (
                  <div>
                    <h4 className="text-xl font-luxury-heading text-black mb-4">🏆 Benefits & Recognition</h4>
                    <p className="text-sm text-gray-600 mb-3">What will volunteers receive? (certificates, skills, experience, etc.)</p>
                    <div className="space-y-4">
                      {projectData.perks.map((perk, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={perk}
                            onChange={(e) => handleArrayFieldChange('perks', index, e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                            placeholder={`e.g., Certificate of completion, Skill training, Community service hours`}
                          />
                          {projectData.perks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField('perks', index)}
                              className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayField('perks')}
                        className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Benefit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xl font-luxury-heading text-black mb-4">🎓 Certifications Offered</h4>
                    <p className="text-sm text-gray-600 mb-3">Will attendees receive any certificates or credentials?</p>
                    <div className="space-y-4">
                      {eventData.certifications.map((cert, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) => handleArrayFieldChange('certifications', index, e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                            placeholder={`e.g., Attendance certificate, Professional development certificate`}
                          />
                          {eventData.certifications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField('certifications', index)}
                              className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayField('certifications')}
                        className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Certification
                      </button>
                    </div>
                  </div>
                )}

                {/* Skills Section for Projects */}
                {submissionType === 'project' && (
                  <>
                    <div>
                      <h4 className="text-xl font-luxury-heading text-black mb-4">💼 Skills Required</h4>
                      <p className="text-sm text-gray-600 mb-3">What skills are essential for this project?</p>
                      <div className="space-y-4">
                        {projectData.requiredSkills.map((skill, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={skill}
                              onChange={(e) => handleArrayFieldChange('requiredSkills', index, e.target.value)}
                              className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                              placeholder={`e.g., First aid training, Teaching experience, Technical skills`}
                            />
                            {projectData.requiredSkills.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayField('requiredSkills', index)}
                                className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayField('requiredSkills')}
                          className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Required Skill
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xl font-luxury-heading text-black mb-4">✨ Preferred Skills (Nice to Have)</h4>
                      <p className="text-sm text-gray-600 mb-3">What skills would be helpful but not mandatory?</p>
                      <div className="space-y-4">
                        {projectData.preferredSkills.map((skill, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={skill}
                              onChange={(e) => handleArrayFieldChange('preferredSkills', index, e.target.value)}
                              className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                              placeholder={`e.g., Photography, Social media management, Event planning`}
                            />
                            {projectData.preferredSkills.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayField('preferredSkills', index)}
                                className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayField('preferredSkills')}
                          className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Preferred Skill
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* What to Bring / Materials */}
                <div>
                  <h4 className="text-xl font-luxury-heading text-black mb-4">🎒 What to Bring</h4>
                  <p className="text-sm text-gray-600 mb-3">What should {submissionType === 'project' ? 'volunteers' : 'attendees'} bring with them?</p>
                  <div className="space-y-4">
                    {(submissionType === 'project' ? projectData.materialsList : eventData.materialsList).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayFieldChange('materialsList', index, e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                          placeholder={`e.g., Water bottle, Comfortable shoes, Notebook, Laptop`}
                        />
                        {(submissionType === 'project' ? projectData.materialsList : eventData.materialsList).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField('materialsList', index)}
                            className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayField('materialsList')}
                      className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Services Included for Events */}
                {submissionType === 'event' && (
                  <div>
                    <h4 className="text-xl font-luxury-heading text-black mb-4">✅ What's Included</h4>
                    <p className="text-sm text-gray-600 mb-3">What services or amenities will be provided?</p>
                    <div className="space-y-4">
                      {eventData.servicesIncluded.map((service, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={service}
                            onChange={(e) => handleArrayFieldChange('servicesIncluded', index, e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                            placeholder={`e.g., Lunch, Materials, Parking, WiFi, Refreshments`}
                          />
                          {eventData.servicesIncluded.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField('servicesIncluded', index)}
                              className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayField('servicesIncluded')}
                        className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service
                      </button>
                    </div>
                  </div>
                )}

                {/* Safety & Accessibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {submissionType === 'project' ? (
                    <div>
                      <label className="block font-luxury-medium text-black mb-2">🛡️ Safety Notes</label>
                      <textarea
                        rows={3}
                        value={projectData.safetyNotes}
                        onChange={(e) => handleInputChange('safetyNotes', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                        placeholder="Safety guidelines, protective equipment needed, health precautions..."
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-luxury-medium text-black mb-2">🚗 Parking Information</label>
                      <textarea
                        rows={3}
                        value={eventData.parkingInfo}
                        onChange={(e) => handleInputChange('parkingInfo', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                        placeholder="Parking availability, location, cost, public transport options..."
                      />
                    </div>
                  )}
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">♿ Accessibility Information</label>
                    <textarea
                      rows={3}
                      value={submissionType === 'project' ? projectData.accessibilityInfo : eventData.accessibilityInfo}
                      onChange={(e) => handleInputChange('accessibilityInfo', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder="Wheelchair access, sign language, special accommodations available..."
                    />
                  </div>
                </div>

                {/* Childcare for Events */}
                {submissionType === 'event' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="childcareAvailable"
                      checked={eventData.childcareAvailable}
                      onChange={(e) => handleInputChange('childcareAvailable', e.target.checked)}
                      className="w-5 h-5 text-vibrant-orange rounded focus:ring-vibrant-orange"
                    />
                    <label htmlFor="childcareAvailable" className="font-luxury-medium text-black">
                      👶 Childcare services available at this event
                    </label>
                  </div>
                )}

                {/* Sponsors/Partners */}
                <div>
                  <h4 className="text-xl font-luxury-heading text-black mb-4">🤝 {submissionType === 'project' ? 'Sponsors' : 'Partners'}</h4>
                  <p className="text-sm text-gray-600 mb-3">Organizations or companies supporting this {submissionType}</p>
                  <div className="space-y-4">
                    {(submissionType === 'project' ? projectData.sponsors : eventData.partners).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayFieldChange(submissionType === 'project' ? 'sponsors' : 'partners', index, e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                          placeholder={`Organization name`}
                        />
                        {(submissionType === 'project' ? projectData.sponsors : eventData.partners).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField(submissionType === 'project' ? 'sponsors' : 'partners', index)}
                            className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayField(submissionType === 'project' ? 'sponsors' : 'partners')}
                      className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add {submissionType === 'project' ? 'Sponsor' : 'Partner'}
                    </button>
                  </div>
                </div>

                {/* Donation Link for Projects */}
                {submissionType === 'project' && (
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">💝 Donation Link (Optional)</label>
                    <input
                      type="url"
                      value={projectData.donationLink}
                      onChange={(e) => handleInputChange('donationLink', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder="https://..."
                    />
                    <p className="text-sm text-gray-600 mt-1">Link to donation page or fundraising campaign</p>
                  </div>
                )}

                {/* FAQ Section */}
                <div>
                  <h4 className="text-xl font-luxury-heading text-black mb-4">❓ Frequently Asked Questions</h4>
                  <p className="text-sm text-gray-600 mb-3">Help participants get answers to common questions</p>
                  <div className="space-y-6">
                    {(submissionType === 'project' ? projectData.faq : eventData.faq).map((item, index) => (
                      <div key={index} className="p-4 bg-cream-elegant rounded-luxury border-2 border-vibrant-orange/20">
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-semibold"
                            placeholder="Question"
                          />
                          <textarea
                            rows={2}
                            value={item.answer}
                            onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                            placeholder="Answer"
                          />
                          <button
                            type="button"
                            onClick={() => removeFaqItem(index)}
                            className="px-4 py-2 bg-red-500 text-white rounded-luxury hover:bg-red-600 text-sm"
                          >
                            Remove FAQ
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFaqItem}
                      className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add FAQ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Task Checklist</h3>
              <ChecklistBuilder
                items={submissionType === 'project' ? projectData.checklist : eventData.checklist}
                onChange={(items) => handleInputChange('checklist', items)}
              />
            </div>

            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Reminders</h3>
              <ReminderManager
                reminders={submissionType === 'project' ? projectData.reminders : eventData.reminders}
                onChange={(reminders) => handleInputChange('reminders', reminders)}
                defaultEmail={submissionType === 'project' ? projectData.contactEmail : eventData.contactEmail}
              />
            </div>

            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">
                {submissionType === 'project' ? 'Project Heads' : 'Event Organizers'}
              </h3>
              <p className="text-black/70 font-luxury-body mb-4">
                Add information about the people leading this {submissionType}. You can add multiple heads/organizers.
              </p>
              <HeadsManager
                heads={submissionType === 'project' ? projectData.heads : eventData.heads}
                onChange={(heads) => handleInputChange('heads', heads)}
                folder={submissionType === 'project' ? 'project-heads' : 'event-organizers'}
                label={submissionType === 'project' ? 'Project Heads' : 'Event Organizers'}
              />
            </div>

            <div className="border-t-2 border-red-300 pt-8">
              <h3 className="text-2xl font-luxury-heading text-black mb-2">Section 4: Admin-Only Information</h3>
              <p className="text-sm text-red-600 mb-6">Confidential - Only visible to administrators</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Budget</label>
                  <input
                    type="text"
                    value={submissionType === 'project' ? projectData.budget : eventData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="Estimated budget"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-black mb-2">
                    {submissionType === 'project' ? 'Funding Source' : 'Sponsor Information'}
                  </label>
                  <input
                    type="text"
                    value={submissionType === 'project' ? projectData.fundingSource : eventData.sponsorInfo}
                    onChange={(e) => handleInputChange(submissionType === 'project' ? 'fundingSource' : 'sponsorInfo', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder={submissionType === 'project' ? 'Where funding comes from' : 'Sponsor details'}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-luxury-medium text-black mb-2">Internal Notes</label>
                  <textarea
                    rows={3}
                    value={submissionType === 'project' ? projectData.internalNotes : eventData.internalNotes}
                    onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="Internal notes, sensitive information, etc."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Contact Email *</label>
                  <input
                    type="email"
                    value={submissionType === 'project' ? projectData.contactEmail : eventData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={submissionType === 'project' ? projectData.contactPhone : eventData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmit('pending')}
                disabled={loading || !validateForm()}
                className="flex-1 btn-luxury-primary py-3 px-6 flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-5 h-5 mr-2" />
                {loading ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? (isAdmin ? 'Update' : 'Submit Edit Request') : 'Submit for Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSubmission;
