import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, Award, Heart, CheckCircle, Star, Quote, Plus } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import EditButton from '../components/EditButton';
import ContentEditor from '../components/ContentEditor';
import { initializeDefaultContent } from '../utils/initializeContent';
import ThemedHeroSection from '../components/ThemedHeroSection';
import ThemedSection from '../components/ThemedSection';

const HomeEditable = () => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [contentInitialized, setContentInitialized] = useState(false);

  useEffect(() => {
    const initContent = async () => {
      if (!contentInitialized) {
        try {
          await initializeDefaultContent();
          setContentInitialized(true);
        } catch (error) {
          console.error('Failed to initialize content:', error);
        }
      }
    };
    initContent();
  }, []);

  const { data: heroData, upsertContent: saveHero } = useContent('hero_content', 'main');
  const { data: aboutData, upsertContent: saveAbout } = useContent('about_content', 'main');
  const { data: impactData, upsertContent: saveImpact } = useContent('impact_content', 'main');
  const { data: programs, createContent: createProgram, updateContent: updateProgram, deleteContent: deleteProgram } = useContent('programs');
  const { data: testimonials, createContent: createTestimonial, updateContent: updateTestimonial, deleteContent: deleteTestimonial } = useContent('testimonials');
  const { data: ctaData, upsertContent: saveCta } = useContent('cta_content', 'main');

  const [counters, setCounters] = useState({
    volunteers: 0,
    projects: 0,
    communities: 0,
    lives: 0
  });

  const impactStats = impactData?.stats || [
    { number: '5000+', label: 'Active Volunteers', icon: 'Users', key: 'volunteers', target: 5000 },
    { number: '120+', label: 'Projects Completed', icon: 'Target', key: 'projects', target: 120 },
    { number: '50+', label: 'Communities Served', icon: 'Heart', key: 'communities', target: 50 },
    { number: '25K+', label: 'Lives Impacted', icon: 'Award', key: 'lives', target: 25000 },
  ];

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = { Users, Target, Award, Heart };
    return icons[iconName] || Heart;
  };

  useEffect(() => {
    const animateCounters = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;

      impactStats.forEach(stat => {
        let current = 0;
        const increment = stat.target / steps;

        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.target) {
            current = stat.target;
            clearInterval(timer);
          }

          setCounters(prev => ({
            ...prev,
            [stat.key]: Math.floor(current)
          }));
        }, stepDuration);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.disconnect();
        }
      });
    });

    const statsSection = document.getElementById('impact-stats');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, [impactData]);

  const defaultHero = {
    title: 'Empowering Communities,',
    titleHighlight: 'Building Futures',
    subtitle: 'Where compassion meets action. Join our mission to transform lives, strengthen communities, and create lasting positive change through collective service and unwavering dedication.',
    logoIcon: 'Heart',
    arabicName: 'وسیلہ',
    englishName: 'Waseela'
  };

  const defaultAbout = {
    title: 'Who We Are',
    description1: 'Wasilah is more than a platform—we\'re a movement of passionate individuals dedicated to creating positive change. Through collaborative service and meaningful action, we connect communities with the resources and support they need to thrive.',
    description2: 'Our mission is simple: empower communities to build their own futures through sustainable development, education, and collective action.',
    cardTitle: 'Community at Heart',
    cardDescription: 'Every action we take is driven by our commitment to building stronger, more connected communities.'
  };

  const defaultCta = {
    title: 'Together, We Can Build',
    titleHighlight: 'Stronger Communities',
    description: 'Be part of something bigger. Join our movement and help create the positive change our communities need and deserve.',
    buttonText: 'Become a Volunteer',
    buttonLink: '/volunteer'
  };

  const hero = heroData || defaultHero;
  const about = aboutData || defaultAbout;
  const cta = ctaData || defaultCta;

  return (
    <div>
      {/* Hero Section */}
      <ThemedHeroSection className="text-center">
        <EditButton onClick={() => { setEditingSection('hero'); setEditingItem(hero); }} />

        <div className="animate-cinematic-fade">
            <div className="mb-12">
              <div className="w-32 h-32 mx-auto mb-8">
                <img
                  src="/logo.jpeg"
                  alt="Wasilah Logo"
                  className="w-full h-full object-cover rounded-3xl shadow-luxury-glow-lg animate-luxury-glow"
                />
              </div>
              <h2 className="text-4xl font-arabic text-cream-elegant mb-4">{hero.arabicName}</h2>
              <h3 className="text-2xl font-luxury-heading text-vibrant-orange-light">{hero.englishName}</h3>
            </div>

            <h1 className="text-6xl md:text-8xl font-luxury-display text-cream-elegant mb-8 leading-tight">
              {hero.title}
              <br />
              <span className="luxury-gradient-text animate-text-shimmer">{hero.titleHighlight}</span>
            </h1>
            <p className="text-2xl md:text-3xl text-cream-elegant/90 mb-12 max-w-4xl mx-auto font-luxury-body leading-relaxed">
              {hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Link
                to="/volunteer"
                className="btn-luxury-primary text-xl px-12 py-6 inline-flex items-center"
              >
                <Users className="mr-3 w-6 h-6" />
                Join Our Mission
                <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
              <Link
                to="/about"
                className="btn-luxury-secondary text-xl px-12 py-6 inline-flex items-center"
              >
                Learn More
                <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
            </div>
          </div>
      </ThemedHeroSection>

      {/* Impact Highlights */}
      <ThemedSection id="impact-stats" className="py-24 relative overflow-hidden" backgroundType="community" bgColor="bg-cream-white">
        <EditButton onClick={() => { setEditingSection('impact'); setEditingItem(impactData || { stats: impactStats }); }} />

        <div className="absolute inset-0 bg-gradient-to-br from-cream-elegant/50 to-cream-white"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display text-logo-navy mb-8 animate-slide-up-luxury">
              Our Impact in Numbers
            </h2>
            <p className="text-2xl text-text-medium font-luxury-body max-w-4xl mx-auto">
              See the tangible difference we're making in communities across the region
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {impactStats.map((stat, index) => {
              const IconComponent = getIcon(stat.icon);
              return (
                <div key={index} className="text-center luxury-hover-scale luxury-card p-10 group">
                  <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mx-auto mb-8">
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-5xl font-luxury-display impact-counter mb-4 animate-counter text-logo-navy">
                    {stat.key === 'lives' ? `${Math.floor(counters[stat.key] / 1000)}K+` : `${counters[stat.key]}+`}
                  </h3>
                  <p className="text-text-medium font-luxury-medium text-lg">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </ThemedSection>

      {/* Who We Are Section */}
      <ThemedSection className="py-24 relative overflow-hidden" backgroundType="helping" bgColor="bg-cream-elegant">
        <EditButton onClick={() => { setEditingSection('about'); setEditingItem(about); }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="luxury-card bg-logo-navy p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/20 to-transparent"></div>
                <div className="service-icon-luxury w-32 h-32 flex items-center justify-center mx-auto mb-8">
                  <Heart className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-3xl font-luxury-heading text-cream-elegant mb-6 relative z-10">
                  {about.cardTitle}
                </h3>
                <p className="text-cream-elegant/80 font-luxury-body text-lg relative z-10 leading-relaxed">
                  {about.cardDescription}
                </p>
              </div>
            </div>

            <div className="animate-slide-up-luxury">
              <h2 className="text-5xl md:text-6xl font-luxury-display text-black mb-8">
                {about.title}
              </h2>
              <p className="text-xl text-black font-luxury-body mb-8 leading-relaxed">
                {about.description1}
              </p>
              <p className="text-xl text-black font-luxury-body mb-10 leading-relaxed">
                {about.description2}
              </p>
              <Link
                to="/about"
                className="btn-luxury-primary text-lg inline-flex items-center"
              >
                Learn More About Us
                <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </ThemedSection>

      {/* Programs & Services */}
      <ThemedSection className="py-24 relative overflow-hidden" backgroundType="education" bgColor="bg-cream-white">
        <EditButton onClick={() => { setEditingSection('programs-list'); setEditingItem(null); }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display text-black mb-8">
              Our Programs
            </h2>
            <p className="text-2xl text-black font-luxury-body max-w-4xl mx-auto">
              Comprehensive initiatives designed to address community needs and create lasting impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {(programs || []).map((program: any, index: number) => (
              <div key={program.id} className={`${program.color} ${program.textColor} p-12 rounded-luxury-lg luxury-hover-scale luxury-card group relative overflow-hidden`}>
                <EditButton onClick={() => { setEditingSection('program'); setEditingItem(program); }} />

                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="text-7xl mb-8 relative z-10">{program.icon}</div>
                <h3 className="text-3xl font-luxury-heading mb-6 group-hover:text-vibrant-orange transition-colors duration-300 relative z-10">
                  {program.title}
                </h3>
                <p className={`font-luxury-body text-lg leading-relaxed relative z-10 ${program.color?.includes('navy') ? 'text-cream-elegant/80' : 'text-black'}`}>
                  {program.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ThemedSection>

      {/* Testimonials Slider */}
      <ThemedSection className="py-24 relative overflow-hidden" backgroundType="teamwork" bgColor="bg-cream-elegant">
        <EditButton onClick={() => { setEditingSection('testimonials-list'); setEditingItem(null); }} />

        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display mb-8" style={{color: '#000000'}}>
              What Our Community Says
            </h2>
            <p className="text-2xl font-luxury-body max-w-4xl mx-auto" style={{color: '#000000'}}>
              Hear from the volunteers and community members who make our mission possible
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {(testimonials || []).map((testimonial: any) => (
              <div key={testimonial.id} className="testimonial-card p-10 luxury-hover-scale relative">
                <EditButton onClick={() => { setEditingSection('testimonial'); setEditingItem(testimonial); }} />

                <div className="flex items-center mb-8">
                  <div className="relative">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-vibrant-orange/30"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-vibrant-orange rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-6">
                    <h4 className="text-xl font-luxury-heading" style={{color: '#000000'}}>
                      {testimonial.name}
                    </h4>
                    <p className="font-luxury-body" style={{color: '#1A1A1A'}}>{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex mb-6">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-vibrant-orange fill-current" />
                  ))}
                </div>

                <Quote className="w-10 h-10 text-vibrant-orange mb-6" />
                <p className="font-luxury-body text-lg leading-relaxed luxury-quote" style={{color: '#000000'}}>
                  {testimonial.quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ThemedSection>

      {/* Call-to-Action Section */}
      <ThemedSection className="cta-parallax py-24 text-cream-elegant relative overflow-hidden" backgroundType="donation">
        <EditButton onClick={() => { setEditingSection('cta'); setEditingItem(cta); }} />

        <div className="absolute inset-0">
          <div className="floating-3d-luxury opacity-30"></div>
          <div className="floating-3d-luxury opacity-20"></div>
          <div className="floating-3d-luxury opacity-25"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-slide-up-luxury">
            <h2 className="text-5xl md:text-7xl font-luxury-display mb-8 leading-tight">
              {cta.title}
              <br />
              <span className="luxury-gradient-text">{cta.titleHighlight}</span>
            </h2>
            <p className="text-2xl font-luxury-body mb-12 max-w-4xl mx-auto leading-relaxed text-cream-elegant/90">
              {cta.description}
            </p>
            <Link
              to={cta.buttonLink}
              className="bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light text-white px-16 py-6 rounded-luxury font-luxury-semibold text-xl hover:from-vibrant-orange-light hover:to-vibrant-orange transition-all duration-400 inline-flex items-center shadow-luxury-glow-lg hover:scale-105 hover:-translate-y-2"
            >
              {cta.buttonText}
              <ArrowRight className="ml-4 w-7 h-7" />
            </Link>
          </div>
        </div>
      </ThemedSection>

      {/* Content Editors */}
      <ContentEditor
        isOpen={editingSection === 'hero'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title="Edit Hero Section"
        fields={[
          { name: 'arabicName', label: 'Arabic Name', type: 'text', required: true },
          { name: 'englishName', label: 'English Name', type: 'text', required: true },
          { name: 'title', label: 'Main Title', type: 'text', required: true },
          { name: 'titleHighlight', label: 'Highlighted Title', type: 'text', required: true },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', required: true }
        ]}
        initialData={editingItem || {}}
        onSave={(data) => saveHero('main', data)}
      />

      <ContentEditor
        isOpen={editingSection === 'about'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title="Edit About Section"
        fields={[
          { name: 'title', label: 'Section Title', type: 'text', required: true },
          { name: 'description1', label: 'First Paragraph', type: 'textarea', required: true },
          { name: 'description2', label: 'Second Paragraph', type: 'textarea', required: true },
          { name: 'cardTitle', label: 'Card Title', type: 'text', required: true },
          { name: 'cardDescription', label: 'Card Description', type: 'textarea', required: true }
        ]}
        initialData={editingItem || {}}
        onSave={(data) => saveAbout('main', data)}
      />

      <ContentEditor
        isOpen={editingSection === 'program'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title={editingItem?.id ? 'Edit Program' : 'Add Program'}
        fields={[
          { name: 'title', label: 'Program Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'icon', label: 'Emoji Icon', type: 'text', placeholder: 'e.g., 📚', required: true },
          { name: 'color', label: 'Background Color Class', type: 'text', placeholder: 'e.g., bg-cream-elegant', required: true },
          { name: 'textColor', label: 'Text Color Class', type: 'text', placeholder: 'e.g., text-dark-readable', required: true },
          { name: 'order', label: 'Display Order', type: 'number', required: true }
        ]}
        initialData={editingItem || { order: (programs?.length || 0) + 1 }}
        onSave={(data) => editingItem?.id ? updateProgram(editingItem.id, data) : createProgram(data)}
        onDelete={editingItem?.id ? () => deleteProgram(editingItem.id) : undefined}
      />

      <ContentEditor
        isOpen={editingSection === 'testimonial'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title={editingItem?.id ? 'Edit Testimonial' : 'Add Testimonial'}
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'role', label: 'Role/Title', type: 'text', required: true },
          { name: 'quote', label: 'Testimonial Quote', type: 'textarea', required: true },
          { name: 'image', label: 'Profile Image', type: 'image', required: true },
          { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
          { name: 'order', label: 'Display Order', type: 'number', required: true }
        ]}
        initialData={editingItem || { rating: 5, order: (testimonials?.length || 0) + 1 }}
        onSave={(data) => editingItem?.id ? updateTestimonial(editingItem.id, data) : createTestimonial(data)}
        onDelete={editingItem?.id ? () => deleteTestimonial(editingItem.id) : undefined}
      />

      <ContentEditor
        isOpen={editingSection === 'impact'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title="Edit Impact Statistics"
        fields={[
          { name: 'stats', label: 'Impact Stats (JSON format)', type: 'textarea', required: true, placeholder: 'Paste stats array here' }
        ]}
        initialData={editingItem || { stats: JSON.stringify(impactStats, null, 2) }}
        onSave={(data) => {
          const parsedData = {
            stats: typeof data.stats === 'string' ? JSON.parse(data.stats) : data.stats
          };
          return saveImpact('main', parsedData);
        }}
      />

      <ContentEditor
        isOpen={editingSection === 'cta'}
        onClose={() => { setEditingSection(null); setEditingItem(null); }}
        title="Edit Call-to-Action Section"
        fields={[
          { name: 'title', label: 'Main Title', type: 'text', required: true },
          { name: 'titleHighlight', label: 'Highlighted Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'buttonText', label: 'Button Text', type: 'text', required: true },
          { name: 'buttonLink', label: 'Button Link', type: 'text', required: true }
        ]}
        initialData={editingItem || {}}
        onSave={(data) => saveCta('main', data)}
      />

      {/* Add New Items Buttons */}
      {editingSection === 'programs-list' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-cream-white rounded-luxury-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-luxury-heading text-black mb-6">Manage Programs</h3>
            <button
              onClick={() => { setEditingSection('program'); setEditingItem(null); }}
              className="w-full btn-luxury-primary py-4 mb-4 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Program
            </button>
            <button
              onClick={() => setEditingSection(null)}
              className="w-full border-2 border-gray-300 text-black rounded-luxury py-4 hover:bg-gray-50 font-luxury-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editingSection === 'testimonials-list' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-cream-white rounded-luxury-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-luxury-heading text-black mb-6">Manage Testimonials</h3>
            <button
              onClick={() => { setEditingSection('testimonial'); setEditingItem(null); }}
              className="w-full btn-luxury-primary py-4 mb-4 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Testimonial
            </button>
            <button
              onClick={() => setEditingSection(null)}
              className="w-full border-2 border-gray-300 text-black rounded-luxury py-4 hover:bg-gray-50 font-luxury-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeEditable;
