import { db } from '../config/firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

const defaultHeroContent = {
  title: 'Empowering Communities,',
  titleHighlight: 'Building Futures',
  subtitle: 'Where compassion meets action. Join our mission to transform lives, strengthen communities, and create lasting positive change through collective service and unwavering dedication.',
  logoIcon: 'Heart',
  arabicName: 'وسیلہ',
  englishName: 'Waseela',
  updatedAt: new Date()
};

const defaultAboutContent = {
  title: 'Who We Are',
  description1: 'Wasilah is more than a platform—we\'re a movement of passionate individuals dedicated to creating positive change. Through collaborative service and meaningful action, we connect communities with the resources and support they need to thrive.',
  description2: 'Our mission is simple: empower communities to build their own futures through sustainable development, education, and collective action.',
  cardTitle: 'Community at Heart',
  cardDescription: 'Every action we take is driven by our commitment to building stronger, more connected communities.',
  updatedAt: new Date()
};

const defaultImpactContent = {
  stats: [
    { number: '5000+', label: 'Active Volunteers', icon: 'Users', key: 'volunteers', target: 5000 },
    { number: '120+', label: 'Projects Completed', icon: 'Target', key: 'projects', target: 120 },
    { number: '50+', label: 'Communities Served', icon: 'Heart', key: 'communities', target: 50 },
    { number: '25K+', label: 'Lives Impacted', icon: 'Award', key: 'lives', target: 25000 },
  ],
  updatedAt: new Date()
};

const defaultPrograms = [
  {
    title: 'Education Support',
    description: 'Providing quality education resources and tutoring to underserved communities.',
    icon: '📚',
    color: 'bg-cream-elegant',
    textColor: 'text-dark-readable',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Healthcare Access',
    description: 'Organizing health camps and awareness programs for better community health.',
    icon: '🏥',
    color: 'bg-logo-navy',
    textColor: 'text-cream-elegant',
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Skills Development',
    description: 'Vocational training and skill-building workshops for economic empowerment.',
    icon: '🛠️',
    color: 'bg-cream-elegant',
    textColor: 'text-dark-readable',
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Environmental Action',
    description: 'Community-driven environmental conservation and sustainability initiatives.',
    icon: '🌱',
    color: 'bg-logo-navy',
    textColor: 'text-cream-elegant',
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

const defaultTestimonials = [
  {
    name: 'Sarah Ahmed',
    role: 'Community Volunteer',
    image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150',
    quote: 'Wasilah has given me the platform to make a real difference in my community. The impact we create together is truly inspiring.',
    rating: 5,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Muhammad Hassan',
    role: 'Project Coordinator',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    quote: 'Working with Wasilah has been transformative. We are building stronger, more resilient communities every day.',
    rating: 5,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Fatima Khan',
    role: 'Education Volunteer',
    image: 'https://images.pexels.com/photos/3763152/pexels-photo-3763152.jpeg?auto=compress&cs=tinysrgb&w=150',
    quote: 'The education programs have changed countless lives. I am proud to be part of this incredible movement.',
    rating: 5,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

const defaultCtaContent = {
  title: 'Together, We Can Build',
  titleHighlight: 'Stronger Communities',
  description: 'Be part of something bigger. Join our movement and help create the positive change our communities need and deserve.',
  buttonText: 'Become a Volunteer',
  buttonLink: '/volunteer',
  updatedAt: new Date()
};

export const initializeDefaultContent = async () => {
  try {
    console.log('Initializing default content...');

    // Check if content already exists
    const contentRef = collection(db, 'content');
    const contentSnapshot = await getDocs(contentRef);

    if (contentSnapshot.empty) {
      // Initialize Hero Content
      await setDoc(doc(db, 'content', 'hero_content_main'), {
        section: 'hero_content',
        slug: 'main',
        data: defaultHeroContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Hero content initialized');

      // Initialize About Content
      await setDoc(doc(db, 'content', 'about_content_main'), {
        section: 'about_content',
        slug: 'main',
        data: defaultAboutContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('About content initialized');

      // Initialize Impact Content
      await setDoc(doc(db, 'content', 'impact_content_main'), {
        section: 'impact_content',
        slug: 'main',
        data: defaultImpactContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Impact content initialized');

      // Initialize Programs
      for (let i = 0; i < defaultPrograms.length; i++) {
        const program = defaultPrograms[i];
        await setDoc(doc(db, 'content', `programs_item_${Date.now()}_${i}`), {
          section: 'programs',
          slug: `item_${Date.now()}_${i}`,
          data: program,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Programs initialized');

      // Initialize Testimonials
      for (let i = 0; i < defaultTestimonials.length; i++) {
        const testimonial = defaultTestimonials[i];
        await setDoc(doc(db, 'content', `testimonials_item_${Date.now()}_${i}`), {
          section: 'testimonials',
          slug: `item_${Date.now()}_${i}`,
          data: testimonial,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Testimonials initialized');

      // Initialize CTA Content
      await setDoc(doc(db, 'content', 'cta_content_main'), {
        section: 'cta_content',
        slug: 'main',
        data: defaultCtaContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('CTA content initialized');

      console.log('All default content initialized successfully!');
    } else {
      console.log('Content already exists. Skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing default content:', error);
    throw error;
  }
};
