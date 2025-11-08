import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ProjectLeader, EventOrganizer } from '../types/leaders';
import LeaderProfileCard from './LeaderProfileCard';
import ImageUploadField from './ImageUploadField';

interface LeaderManagerProps {
  type: 'project' | 'event';
  entityId: string;
  isAdmin?: boolean;
}

const LeaderManager: React.FC<LeaderManagerProps> = ({ type, entityId, isAdmin }) => {
  const [leaders, setLeaders] = useState<(ProjectLeader | EventOrganizer)[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLeader, setEditingLeader] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    profileImage: '',
    email: '',
    phone: '',
    linkedIn: '',
    twitter: '',
    specialization: '',
    yearsOfExperience: 0,
    department: '',
    responsibilities: [] as string[]
  });

  useEffect(() => {
    fetchLeaders();
  }, [type, entityId]);

  const fetchLeaders = async () => {
    try {
      const collectionName = type === 'project' ? 'project_leaders' : 'event_organizers';
      const leadersRef = collection(db, collectionName);
      const idField = type === 'project' ? 'projectId' : 'eventId';

      const q = query(
        leadersRef,
        where(idField, '==', entityId),
        orderBy('order', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const leadersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (ProjectLeader | EventOrganizer)[];

      setLeaders(leadersData);
    } catch (error) {
      console.error('Error fetching leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearsOfExperience' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const collectionName = type === 'project' ? 'project_leaders' : 'event_organizers';
      const idField = type === 'project' ? 'projectId' : 'eventId';

      const leaderData: any = {
        name: formData.name,
        role: formData.role,
        bio: formData.bio,
        profileImage: formData.profileImage,
        email: formData.email,
        phone: formData.phone,
        linkedIn: formData.linkedIn || null,
        twitter: formData.twitter || null,
        [idField]: entityId,
        order: leaders.length,
        updatedAt: new Date().toISOString()
      };

      if (type === 'project') {
        leaderData.specialization = formData.specialization || null;
        leaderData.yearsOfExperience = formData.yearsOfExperience || 0;
      } else {
        leaderData.department = formData.department || null;
        leaderData.responsibilities = formData.responsibilities.filter(r => r.trim());
      }

      if (editingLeader) {
        await updateDoc(doc(db, collectionName, editingLeader), leaderData);
      } else {
        leaderData.createdAt = new Date().toISOString();
        await addDoc(collection(db, collectionName), leaderData);
      }

      resetForm();
      fetchLeaders();
    } catch (error) {
      console.error('Error saving leader:', error);
      alert('Error saving leader profile. Please try again.');
    }
  };

  const handleEdit = (leader: ProjectLeader | EventOrganizer) => {
    setEditingLeader(leader.id);
    setFormData({
      name: leader.name,
      role: leader.role,
      bio: leader.bio,
      profileImage: leader.profileImage,
      email: leader.email,
      phone: leader.phone,
      linkedIn: leader.linkedIn || '',
      twitter: leader.twitter || '',
      specialization: 'specialization' in leader ? leader.specialization || '' : '',
      yearsOfExperience: 'yearsOfExperience' in leader ? leader.yearsOfExperience || 0 : 0,
      department: 'department' in leader ? leader.department || '' : '',
      responsibilities: 'responsibilities' in leader ? leader.responsibilities || [] : []
    });
    setShowForm(true);
  };

  const handleDelete = async (leaderId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const collectionName = type === 'project' ? 'project_leaders' : 'event_organizers';
      await deleteDoc(doc(db, collectionName, leaderId));
      fetchLeaders();
    } catch (error) {
      console.error('Error deleting leader:', error);
      alert('Error deleting profile. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      bio: '',
      profileImage: '',
      email: '',
      phone: '',
      linkedIn: '',
      twitter: '',
      specialization: '',
      yearsOfExperience: 0,
      department: '',
      responsibilities: []
    });
    setEditingLeader(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-luxury-heading text-black">
          {type === 'project' ? 'Project Leaders' : 'Event Organizers'}
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-luxury-primary px-4 py-2 inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add {type === 'project' ? 'Leader' : 'Organizer'}
          </button>
        )}
      </div>

      {leaders.length === 0 && !showForm && (
        <div className="text-center py-12 luxury-card bg-cream-white">
          <p className="text-black font-luxury-body text-lg">
            No {type === 'project' ? 'leaders' : 'organizers'} added yet.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaders.map((leader) => (
          <div key={leader.id} className="relative">
            <LeaderProfileCard
              leader={leader}
              onEdit={() => handleEdit(leader)}
              isAdmin={isAdmin}
            />
            {isAdmin && (
              <button
                onClick={() => handleDelete(leader.id)}
                className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="luxury-card bg-cream-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-luxury-heading text-black">
                {editingLeader ? 'Edit' : 'Add'} {type === 'project' ? 'Leader' : 'Organizer'}
              </h3>
              <button
                onClick={resetForm}
                className="text-black hover:text-vibrant-orange text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <ImageUploadField
                label="Profile Image"
                value={formData.profileImage}
                onChange={(url) => setFormData(prev => ({ ...prev, profileImage: url }))}
                folder="leaders"
              />

              <div>
                <label className="block font-luxury-medium text-black mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                />
              </div>

              <div>
                <label className="block font-luxury-medium text-black mb-2">Role/Title *</label>
                <input
                  type="text"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="e.g., Project Lead, Event Coordinator"
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                />
              </div>

              <div>
                <label className="block font-luxury-medium text-black mb-2">Bio *</label>
                <textarea
                  name="bio"
                  required
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Brief biography and background..."
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                  />
                </div>

                <div>
                  <label className="block font-luxury-medium text-black mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedIn"
                    value={formData.linkedIn}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                  />
                </div>

                <div>
                  <label className="block font-luxury-medium text-black mb-2">Twitter URL</label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/..."
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                  />
                </div>
              </div>

              {type === 'project' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      placeholder="e.g., Education, Healthcare"
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                    />
                  </div>

                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Years of Experience</label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      min="0"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                    />
                  </div>
                </div>
              )}

              {type === 'event' && (
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Logistics, Communications"
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange font-luxury-body"
                  />
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-luxury-primary py-3 px-6"
                >
                  {editingLeader ? 'Update' : 'Add'} {type === 'project' ? 'Leader' : 'Organizer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderManager;
