import React, { useEffect, useState } from 'react';
import { Users, Target, Heart, Award, CheckCircle, Globe, Lightbulb, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { useAuth } from '../contexts/AuthContext';
import ContentEditor from '../components/ContentEditor';
import EditButton from '../components/EditButton';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

const AboutEditable = () => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { isAdmin } = useAuth();

  const { data: headerData, upsertContent: saveHeader } = useContent('about_header', 'main');
  const { data: missionData, upsertContent: saveMission } = useContent('about_mission', 'main');
  const { data: visionData, upsertContent: saveVision } = useContent('about_vision', 'main');
  const { data: values, createContent: createValue, updateContent: updateValue, deleteContent: deleteValue } = useContent('about_values');
  const { data: whatWeDoData, createContent: createWhatWeDo, updateContent: updateWhatWeDo, deleteContent: deleteWhatWeDo } = useContent('about_what_we_do');
  const { data: team, createContent: createTeamMember, updateContent: updateTeamMember, deleteContent: deleteTeamMember } = useContent('about_team');
  const { data: impactData, upsertContent: saveImpact } = useContent('about_impact', 'main');
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = { Heart, Shield, Users, Globe, Target, Award, Lightbulb };
    return icons[iconName] || Heart;
  };

  const defaultHeader = {
    title: 'About Wasilah',
    subtitle: 'Discover our story, mission, and the passionate team working to empower communities and build brighter futures together.'
  };

  const defaultMission = {
    title: 'Our Mission',
    description1: 'To serve as a bridge connecting individuals with meaningful opportunities to make a positive impact in their communities through volunteer work, charitable projects, and social initiatives.',
    description2: 'We believe that every person has unique talents and resources that, when channeled effectively, can create transformative change in the world around them.'
  };

  const defaultVision = {
    title: 'Our Vision',
    description1: 'To create a world where every individual has the opportunity to contribute to the betterment of society, fostering a culture of empathy, collaboration, and sustainable positive change.',
    description2: 'We envision thriving communities where people support one another, where resources are shared equitably, and where collective action leads to lasting solutions for social challenges.'
  };

  const defaultValues = [
    {
      icon: 'Heart',
      title: 'Community First',
      description: 'Every decision we make prioritizes the needs and wellbeing of the communities we serve.',
      order: 1
    },
    {
      icon: 'Shield',
      title: 'Transparency',
      description: 'We maintain open communication and accountability in all our operations and initiatives.',
      order: 2
    },
    {
      icon: 'Users',
      title: 'Inclusive Participation',
      description: 'We welcome and value diverse perspectives, ensuring everyone has a voice in our mission.',
      order: 3
    },
    {
      icon: 'Globe',
      title: 'Sustainable Impact',
      description: 'We focus on creating long-term solutions that continue to benefit communities over time.',
      order: 4
    }
  ];

  const defaultWhatWeDo = [
    {
      icon: 'Users',
      title: 'Volunteer Coordination',
      description: 'We match volunteers with suitable projects based on their skills, interests, and availability to maximize impact and personal fulfillment.',
      bgColor: 'bg-cream-elegant',
      order: 1
    },
    {
      icon: 'Target',
      title: 'Project Management',
      description: 'We organize and oversee community projects from conception to completion, ensuring effective resource utilization and measurable outcomes.',
      bgColor: 'bg-logo-navy',
      textColor: 'text-cream-elegant',
      order: 2
    },
    {
      icon: 'Award',
      title: 'Community Building',
      description: 'We foster a sense of community through events, workshops, and ongoing engagement opportunities that strengthen social bonds and collective action.',
      bgColor: 'bg-cream-elegant',
      order: 3
    }
  ];

  const defaultTeam = [
    {
      name: 'Dr. Amina Hassan',
      role: 'Executive Director',
      image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Leading community development initiatives for over 15 years with a focus on sustainable change.',
      email: 'amina.hassan@wasilah.org',
      phone: '',
      order: 1
    },
    {
      name: 'Ahmed Malik',
      role: 'Program Manager',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Expert in project coordination and volunteer management with a passion for social impact.',
      email: 'ahmed.malik@wasilah.org',
      phone: '',
      order: 2
    },
    {
      name: 'Fatima Khan',
      role: 'Community Outreach Lead',
      image: 'https://images.pexels.com/photos/3763152/pexels-photo-3763152.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Dedicated to building bridges between communities and creating meaningful connections.',
      email: 'fatima.khan@wasilah.org',
      phone: '',
      order: 3
    },
    {
      name: 'Omar Sheikh',
      role: 'Operations Director',
      image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Ensuring efficient operations and strategic planning for maximum community impact.',
      email: 'omar.sheikh@wasilah.org',
      phone: '',
      order: 4
    }
  ];

  const defaultImpact = {
    title: 'Our Impact',
    subtitle: 'Measurable results from our commitment to community empowerment',
    volunteers: '5000+',
    projects: '120+',
    communities: '50+',
    lives: '25K+',
    achievements: [
      'Established education support programs in 15 schools',
      'Organized health awareness campaigns reaching 5,000+ people',
      'Coordinated disaster relief efforts for flood-affected areas',
      'Launched digital literacy workshops for 500+ seniors'
    ]
  };

  const header = headerData || defaultHeader;
  const mission = missionData || defaultMission;
  const vision = visionData || defaultVision;
  const coreValues = (values && values.length > 0) ? values : defaultValues;
  const whatWeDo = (whatWeDoData && whatWeDoData.length > 0) ? whatWeDoData : defaultWhatWeDo;
  const teamMembers = (team && team.length > 0) ? team : defaultTeam;
  const impact = impactData || defaultImpact;

  // Load FAQs to display on About page
  useEffect(() => {
    const faqsRef = collection(db, 'faqs');
    const q = query(faqsRef, orderBy('question', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Array<{ id: string; question: string; answer: string }> = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (data?.question && data?.answer) {
          items.push({ id: doc.id, question: data.question, answer: data.answer });
        }
      });
      setFaqs(items);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="py-12">
      <section className="hero-luxury-bg text-cream-elegant py-24 relative overflow-hidden">
        {isAdmin && <EditButton onClick={() => { setEditingSection('header'); setEditingItem(header); }} />}

        <div className="floating-3d-luxury"></div>
        <div className="floating-3d-luxury"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-6xl md:text-7xl font-luxury-display mb-8 animate-cinematic-fade">{header.title}</h1>
          <p className="text-2xl font-luxury-body max-w-4xl mx-auto leading-relaxed">
            {header.subtitle}
          </p>
        </div>
      </section>

      <section className="py-24 bg-cream-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="text-center lg:text-left animate-slide-up-luxury">
              {isAdmin && <EditButton onClick={() => { setEditingSection('mission'); setEditingItem(mission); }} />}
              <div className="service-icon-luxury w-24 h-24 flex items-center justify-center mb-10 mx-auto lg:mx-0">
                <Target className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-5xl font-luxury-display text-black mb-8">{mission.title}</h2>
              <p className="text-xl text-black font-luxury-body leading-relaxed mb-8">
                {mission.description1}
              </p>
              <p className="text-xl text-black font-luxury-body leading-relaxed">
                {mission.description2}
              </p>
            </div>

            <div className="text-center lg:text-left animate-slide-up-luxury">
              {isAdmin && <EditButton onClick={() => { setEditingSection('vision'); setEditingItem(vision); }} />}
              <div className="service-icon-luxury w-24 h-24 flex items-center justify-center mb-10 mx-auto lg:mx-0">
                <Lightbulb className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-5xl font-luxury-display text-black mb-8">{vision.title}</h2>
              <p className="text-xl text-black font-luxury-body leading-relaxed mb-8">
                {vision.description1}
              </p>
              <p className="text-xl text-black font-luxury-body leading-relaxed">
                {vision.description2}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-cream-soft">
        {isAdmin && <EditButton onClick={() => { setEditingSection('values-list'); setEditingItem(null); }} />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display text-black mb-8">
              Our Core Values
            </h2>
            <p className="text-2xl text-black font-luxury-body max-w-4xl mx-auto">
              The principles that guide every decision we make and every action we take
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {coreValues.map((value: any) => {
              const IconComponent = getIcon(value.icon);
              return (
                <div key={value.id || value.title} className="luxury-card bg-cream-white p-10 text-center luxury-hover-scale relative">
                  {isAdmin && <EditButton onClick={() => { setEditingSection('value'); setEditingItem(value); }} />}
                  <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mx-auto mb-8">
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-luxury-heading text-black mb-6">{value.title}</h3>
                  <p className="text-black font-luxury-body text-lg leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-cream-white">
        {isAdmin && <EditButton onClick={() => { setEditingSection('whatwedo-list'); setEditingItem(null); }} />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display text-logo-navy mb-8">
              What We Do
            </h2>
            <p className="text-2xl text-text-medium font-luxury-body max-w-4xl mx-auto">
              We facilitate meaningful connections between volunteers and community needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {whatWeDo.map((item: any) => {
              const IconComponent = getIcon(item.icon);
              return (
                <div key={item.id || item.title} className={`luxury-card ${item.bgColor || 'bg-cream-elegant'} p-10 luxury-hover-scale relative ${item.textColor || ''}`}>
                  {isAdmin && <EditButton onClick={() => { setEditingSection('whatwedo'); setEditingItem(item); }} />}
                  <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mb-8">
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <h3 className={`text-3xl font-luxury-heading mb-6 ${item.textColor || 'text-text-dark'}`}>{item.title}</h3>
                  <p className={`font-luxury-body text-lg leading-relaxed ${item.textColor ? 'text-cream-soft/80' : 'text-text-medium'}`}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-cream-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display text-logo-navy mb-8">
              Meet Our Team
            </h2>
            <p className="text-2xl text-text-medium font-luxury-body max-w-4xl mx-auto">
              The passionate individuals driving our mission forward every day
            </p>
            {isAdmin && (
              <button
                onClick={() => { setEditingSection('team-member'); setEditingItem(null); }}
                className="mt-8 px-6 py-3 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-light transition-colors font-luxury-semibold"
              >
                + Add New Team Member
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {teamMembers.map((member: any) => (
              <div key={member.id || member.name} className="luxury-card bg-cream-white rounded-luxury-lg overflow-hidden luxury-hover-scale relative">
                {isAdmin && <EditButton onClick={() => { setEditingSection('team-member'); setEditingItem(member); }} />}
                <div className="h-80 bg-gray-200 relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/20 to-transparent"></div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-luxury-heading text-navy-deep mb-3">{member.name}</h3>
                  <p className="text-vibrant-orange font-luxury-semibold mb-4 text-lg">{member.role}</p>
                  <p className="text-text-medium font-luxury-body leading-relaxed mb-4">{member.bio}</p>
                  {(member.email || member.phone) && (
                    <div className="text-sm text-text-medium font-luxury-body space-y-1 pt-4 border-t border-gray-200">
                      {member.email && (
                        <p className="truncate">
                          <span className="font-semibold">Email:</span> {member.email}
                        </p>
                      )}
                      {member.phone && (
                        <p>
                          <span className="font-semibold">Phone:</span> {member.phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-logo-navy text-cream-elegant relative overflow-hidden">
        {isAdmin && <EditButton onClick={() => { setEditingSection('impact'); setEditingItem(impact); }} />}
        <div className="absolute inset-0">
          <div className="floating-3d-luxury opacity-20"></div>
          <div className="floating-3d-luxury opacity-15"></div>
          <div className="luxury-particle"></div>
          <div className="luxury-particle"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display mb-8">{impact.title}</h2>
            <p className="text-2xl text-cream-soft/80 font-luxury-body max-w-4xl mx-auto">
              {impact.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
            <div className="text-center luxury-hover-scale">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4">{impact.volunteers}</div>
              <div className="text-cream-elegant/80 font-luxury-body text-xl">Active Volunteers</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4">{impact.projects}</div>
              <div className="text-cream-elegant/80 font-luxury-body text-xl">Projects Completed</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4">{impact.communities}</div>
              <div className="text-cream-elegant/80 font-luxury-body text-xl">Communities Served</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4">{impact.lives}</div>
              <div className="text-cream-elegant/80 font-luxury-body text-xl">Lives Impacted</div>
            </div>
          </div>

          <div className="luxury-card bg-logo-navy-light/60 rounded-luxury-lg p-12 backdrop-blur-luxury border-2 border-vibrant-orange/20">
            <h3 className="text-3xl font-luxury-heading mb-10 text-center text-vibrant-orange-light">Recent Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {impact.achievements?.map((achievement: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-4">
                  <CheckCircle className="w-7 h-7 text-vibrant-orange flex-shrink-0 mt-1" />
                  <p className="text-cream-elegant/80 font-luxury-body text-lg">{achievement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="py-24 bg-cream-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-luxury-display text-black mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-text-medium font-luxury-body">Answers to common questions about Wasilah</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="border border-gray-200 rounded-luxury-lg bg-white overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between text-left px-5 py-4 hover:bg-cream-soft/60 transition-colors"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    >
                      <span className="text-lg font-luxury-heading text-black pr-4">{faq.question}</span>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-text-medium" /> : <ChevronDown className="w-5 h-5 text-text-medium" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-0 text-text-medium font-luxury-body whitespace-pre-line">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ContentEditor
        isOpen={editingSection === 'header'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title="Edit About Header"
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', required: true }
        ]}
        initialData={editingItem || {}}
        onSave={(data) => saveHeader('main', data)}
      />

      <ContentEditor
        isOpen={editingSection === 'mission'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title="Edit Mission"
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description1', label: 'First Paragraph', type: 'textarea', required: true },
          { name: 'description2', label: 'Second Paragraph', type: 'textarea', required: true }
        ]}
        initialData={editingItem || {}}
        onSave={(data) => saveMission('main', data)}
      />

      <ContentEditor
        isOpen={editingSection === 'vision'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title="Edit Vision"
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description1', label: 'First Paragraph', type: 'textarea', required: true },
          { name: 'description2', label: 'Second Paragraph', type: 'textarea', required: true }
        ]}
        initialData={editingItem || {}}
        onSave={(data) => saveVision('main', data)}
      />

      <ContentEditor
        isOpen={editingSection === 'value'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title={editingItem?.id ? 'Edit Value' : 'Add Value'}
        fields={[
          { name: 'icon', label: 'Icon Name', type: 'select', options: ['Heart', 'Shield', 'Users', 'Globe'], required: true },
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'order', label: 'Display Order', type: 'number', required: true }
        ]}
        initialData={editingItem || { order: (coreValues?.length || 0) + 1 }}
        onSave={(data) => editingItem?.id ? updateValue(editingItem.id, data) : createValue(data)}
        onDelete={editingItem?.id ? () => deleteValue(editingItem.id) : undefined}
      />

      <ContentEditor
        isOpen={editingSection === 'whatwedo'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title={editingItem?.id ? 'Edit What We Do Item' : 'Add What We Do Item'}
        fields={[
          { name: 'icon', label: 'Icon Name', type: 'select', options: ['Users', 'Target', 'Award', 'Heart'], required: true },
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'bgColor', label: 'Background Color', type: 'text', placeholder: 'e.g., bg-cream-elegant', required: true },
          { name: 'textColor', label: 'Text Color', type: 'text', placeholder: 'e.g., text-cream-elegant', required: false },
          { name: 'order', label: 'Display Order', type: 'number', required: true }
        ]}
        initialData={editingItem || { order: (whatWeDo?.length || 0) + 1 }}
        onSave={(data) => editingItem?.id ? updateWhatWeDo(editingItem.id, data) : createWhatWeDo(data)}
        onDelete={editingItem?.id ? () => deleteWhatWeDo(editingItem.id) : undefined}
      />

      <ContentEditor
        isOpen={editingSection === 'team-member'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title={editingItem?.id ? 'Edit Team Member' : 'Add Team Member'}
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'role', label: 'Role/Title', type: 'text', required: true },
          { name: 'bio', label: 'Bio', type: 'textarea', required: true },
          { name: 'image', label: 'Profile Image', type: 'image', required: true },
          { name: 'email', label: 'Email Address', type: 'text', required: false, placeholder: 'name@wasilah.org' },
          { name: 'phone', label: 'Phone Number', type: 'text', required: false, placeholder: '+1 (555) 123-4567' },
          { name: 'order', label: 'Display Order', type: 'number', required: true }
        ]}
        initialData={editingItem || { order: (teamMembers?.length || 0) + 1, email: '', phone: '' }}
        onSave={(data) => editingItem?.id ? updateTeamMember(editingItem.id, data) : createTeamMember(data)}
        onDelete={editingItem?.id ? () => deleteTeamMember(editingItem.id) : undefined}
      />

      <ContentEditor
        isOpen={editingSection === 'impact'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title="Edit Impact Section"
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'subtitle', label: 'Subtitle', type: 'text', required: true },
          { name: 'volunteers', label: 'Volunteers Count', type: 'text', required: true },
          { name: 'projects', label: 'Projects Count', type: 'text', required: true },
          { name: 'communities', label: 'Communities Count', type: 'text', required: true },
          { name: 'lives', label: 'Lives Impacted Count', type: 'text', required: true },
          { name: 'achievements', label: 'Achievements (JSON array)', type: 'textarea', required: true, placeholder: '["Achievement 1", "Achievement 2"]' }
        ]}
        initialData={editingItem ? { ...editingItem, achievements: JSON.stringify(editingItem.achievements || [], null, 2) } : {}}
        onSave={(data) => {
          const parsedData = {
            ...data,
            achievements: typeof data.achievements === 'string' ? JSON.parse(data.achievements) : data.achievements
          };
          return saveImpact('main', parsedData);
        }}
      />
    </div>
  );
};

export default AboutEditable;
