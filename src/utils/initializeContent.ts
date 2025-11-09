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

// Header content
const defaultHeaderContent = {
  logoText: 'Wasilah',
  arabicName: 'وسیلہ',
  navigation: [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Projects', path: '/projects' },
    { label: 'Events', path: '/events' },
    { label: 'Volunteer', path: '/volunteer' },
    { label: 'Contact', path: '/contact' }
  ],
  updatedAt: new Date()
};

// Footer content
const defaultFooterContent = {
  description: 'Empowering communities through collaborative service and meaningful action.',
  copyright: '© 2024 Wasilah. All rights reserved.',
  socialLinks: {
    facebook: '#',
    twitter: '#',
    instagram: '#',
    linkedin: '#'
  },
  quickLinks: [
    { label: 'About Us', path: '/about' },
    { label: 'Projects', path: '/projects' },
    { label: 'Events', path: '/events' },
    { label: 'Contact', path: '/contact' }
  ],
  updatedAt: new Date()
};

// About page content
const defaultAboutHeaderContent = {
  title: 'About Wasilah',
  subtitle: 'Building bridges, transforming communities',
  updatedAt: new Date()
};

const defaultAboutMissionContent = {
  title: 'Our Mission',
  description: 'To empower communities through collaborative service, education, and sustainable development initiatives that create lasting positive change.',
  updatedAt: new Date()
};

const defaultAboutVisionContent = {
  title: 'Our Vision',
  description: 'A world where every community has the resources, support, and opportunities needed to thrive and build a better future together.',
  updatedAt: new Date()
};

const defaultAboutImpactContent = {
  title: 'Our Impact',
  description: 'Through dedication and collective action, we have made a meaningful difference in communities across the region.',
  stats: [
    { number: '5000+', label: 'Volunteers' },
    { number: '120+', label: 'Projects' },
    { number: '50+', label: 'Communities' },
    { number: '25K+', label: 'Lives Impacted' }
  ],
  updatedAt: new Date()
};

export const initializeDefaultContent = async () => {
  try {
    // Check if we already initialized in this session (prevents multiple writes)
    const sessionKey = 'wasilah_content_initialized';
    if (sessionStorage.getItem(sessionKey) === 'true') {
      console.log('Content already initialized in this session. Skipping.');
      return;
    }

    console.log('Initializing default content...');

    // Check if content already exists
    const contentRef = collection(db, 'content');
    const contentSnapshot = await getDocs(contentRef);

    if (contentSnapshot.empty) {
      // Batch writes to reduce write operations
      const writes: Promise<void>[] = [];
      
      // Initialize Header Content
      writes.push(setDoc(doc(db, 'content', 'header_content_main'), {
        section: 'header_content',
        slug: 'main',
        data: defaultHeaderContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Initialize Footer Content
      writes.push(setDoc(doc(db, 'content', 'footer_content_main'), {
        section: 'footer_content',
        slug: 'main',
        data: defaultFooterContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      // Initialize Hero Content
      writes.push(setDoc(doc(db, 'content', 'hero_content_main'), {
        section: 'hero_content',
        slug: 'main',
        data: defaultHeroContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Initialize About Content
      writes.push(setDoc(doc(db, 'content', 'about_content_main'), {
        section: 'about_content',
        slug: 'main',
        data: defaultAboutContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Initialize About Page Header
      writes.push(setDoc(doc(db, 'content', 'about_header_main'), {
        section: 'about_header',
        slug: 'main',
        data: defaultAboutHeaderContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Initialize About Page Mission
      writes.push(setDoc(doc(db, 'content', 'about_mission_main'), {
        section: 'about_mission',
        slug: 'main',
        data: defaultAboutMissionContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Initialize About Page Vision
      writes.push(setDoc(doc(db, 'content', 'about_vision_main'), {
        section: 'about_vision',
        slug: 'main',
        data: defaultAboutVisionContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Initialize About Page Impact
      writes.push(setDoc(doc(db, 'content', 'about_impact_main'), {
        section: 'about_impact',
        slug: 'main',
        data: defaultAboutImpactContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Initialize Impact Content
      writes.push(setDoc(doc(db, 'content', 'impact_content_main'), {
        section: 'impact_content',
        slug: 'main',
        data: defaultImpactContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Initialize Programs
      for (let i = 0; i < defaultPrograms.length; i++) {
        const program = defaultPrograms[i];
        writes.push(setDoc(doc(db, 'content', `programs_item_${Date.now()}_${i}`), {
          section: 'programs',
          slug: `item_${Date.now()}_${i}`,
          data: program,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }

      // Initialize Testimonials
      for (let i = 0; i < defaultTestimonials.length; i++) {
        const testimonial = defaultTestimonials[i];
        writes.push(setDoc(doc(db, 'content', `testimonials_item_${Date.now()}_${i}`), {
          section: 'testimonials',
          slug: `item_${Date.now()}_${i}`,
          data: testimonial,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }

      // Initialize CTA Content
      writes.push(setDoc(doc(db, 'content', 'cta_content_main'), {
        section: 'cta_content',
        slug: 'main',
        data: defaultCtaContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Execute all writes with small delays between batches to prevent exhaustion
      const batchSize = 3; // Process 3 writes at a time
      for (let i = 0; i < writes.length; i += batchSize) {
        const batch = writes.slice(i, i + batchSize);
        await Promise.all(batch);
        // Small delay between batches to prevent overwhelming Firestore
        if (i + batchSize < writes.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('All default content initialized successfully!');
      sessionStorage.setItem(sessionKey, 'true');
    } else {
      console.log('Content already exists. Skipping initialization.');
      sessionStorage.setItem(sessionKey, 'true');
    }
  } catch (error) {
    console.error('Error initializing default content:', error);
    // Don't throw error - allow app to continue even if content init fails
  }
};
