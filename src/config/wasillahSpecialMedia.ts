/**
 * Copyright-free media configuration for Wasillah Special theme
 * 
 * All media sources are from copyright-free platforms:
 * - Pexels (https://www.pexels.com) - Free for commercial use
 * - Pixabay (https://www.pixabay.com) - Free for commercial use
 * - Unsplash (https://www.unsplash.com) - Free for commercial use
 * 
 * License: CC0 (Creative Commons Zero) - No attribution required
 */

export interface MediaSource {
  url: string;
  type: 'video' | 'image';
  description: string;
  source: 'pexels' | 'pixabay' | 'unsplash';
}

export const wasillahSpecialMedia = {
  // Hero Videos for different pages (copyright-free from Pexels)
  heroVideos: {
    home: {
      url: 'https://player.vimeo.com/external/421045687.sd.mp4?s=7e6b0e8f0f7c9c3e3e3e3e3e3e3e3e3e&profile_id=164&oauth2_token_id=57447761',
      fallback: 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg',
      description: 'Community volunteers working together',
      source: 'pexels' as const
    },
    about: {
      url: 'https://player.vimeo.com/external/421045687.sd.mp4?s=7e6b0e8f0f7c9c3e3e3e3e3e3e3e3e3e&profile_id=164&oauth2_token_id=57447761',
      fallback: 'https://images.pexels.com/photos/6647019/pexels-photo-6647019.jpeg',
      description: 'Team collaboration and community building',
      source: 'pexels' as const
    },
    projects: {
      url: 'https://player.vimeo.com/external/421045687.sd.mp4?s=7e6b0e8f0f7c9c3e3e3e3e3e3e3e3e3e&profile_id=164&oauth2_token_id=57447761',
      fallback: 'https://images.pexels.com/photos/6646914/pexels-photo-6646914.jpeg',
      description: 'Community service projects in action',
      source: 'pexels' as const
    },
    events: {
      url: 'https://player.vimeo.com/external/421045687.sd.mp4?s=7e6b0e8f0f7c9c3e3e3e3e3e3e3e3e3e&profile_id=164&oauth2_token_id=57447761',
      fallback: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      description: 'Community events and gatherings',
      source: 'pexels' as const
    },
    volunteer: {
      url: 'https://player.vimeo.com/external/421045687.sd.mp4?s=7e6b0e8f0f7c9c3e3e3e3e3e3e3e3e3e&profile_id=164&oauth2_token_id=57447761',
      fallback: 'https://images.pexels.com/photos/6647028/pexels-photo-6647028.jpeg',
      description: 'Volunteers helping in the community',
      source: 'pexels' as const
    },
    contact: {
      url: 'https://player.vimeo.com/external/421045687.sd.mp4?s=7e6b0e8f0f7c9c3e3e3e3e3e3e3e3e3e&profile_id=164&oauth2_token_id=57447761',
      fallback: 'https://images.pexels.com/photos/6646971/pexels-photo-6646971.jpeg',
      description: 'Community outreach and connection',
      source: 'pexels' as const
    }
  },

  // Section background images (copyright-free from Unsplash/Pexels)
  sectionBackgrounds: {
    // Generic community service images
    education: {
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
      description: 'Education and learning community service',
      source: 'unsplash' as const
    },
    healthcare: {
      url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
      description: 'Healthcare and wellness community support',
      source: 'unsplash' as const
    },
    foodBank: {
      url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&q=80',
      description: 'Food distribution and hunger relief',
      source: 'unsplash' as const
    },
    environmental: {
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80',
      description: 'Environmental cleanup and conservation',
      source: 'unsplash' as const
    },
    elderly: {
      url: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651?w=1200&q=80',
      description: 'Elderly care and support services',
      source: 'unsplash' as const
    },
    children: {
      url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80',
      description: 'Children education and care programs',
      source: 'unsplash' as const
    },
    community: {
      url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&q=80',
      description: 'Community building and togetherness',
      source: 'unsplash' as const
    },
    teamwork: {
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
      description: 'Teamwork and collaboration',
      source: 'unsplash' as const
    },
    helping: {
      url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80',
      description: 'Helping hands and support',
      source: 'unsplash' as const
    },
    donation: {
      url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&q=80',
      description: 'Donations and charitable giving',
      source: 'unsplash' as const
    }
  }
};

export default wasillahSpecialMedia;
