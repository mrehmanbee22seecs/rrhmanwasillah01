# Wasillah Special Theme

## Overview

The **Wasillah Special** theme is an emotionally engaging theme designed to create a deep connection with visitors through community service imagery and videos. It features warm colors, looping hero videos, and beautifully blended section backgrounds that tell the story of community service and positive impact.

## Features

### 1. **Hero Videos**
- Looping community service videos on every page
- Page-specific content (different videos for Home, About, Projects, Events, Volunteer, Contact)
- Fallback images for browsers that don't support video
- Optimized overlay for text readability (60% opacity gradient)

### 2. **Section Backgrounds**
- Community service images masterfully blended into section backgrounds
- Soft-light blend mode for emotional, non-intrusive integration
- 15% image opacity with 92% surface overlay for perfect text readability
- Multiple themed backgrounds: education, healthcare, elderly care, children, teamwork, donation, etc.

### 3. **Color Palette**
The theme uses warm, emotional colors that evoke compassion and community:

- **Primary**: `#FF7B54` (Coral Orange) - Warmth and energy
- **Secondary**: `#8B4513` (Warm Brown) - Depth and stability
- **Accent**: `#FFB347` (Golden Yellow) - Hope and optimism
- **Background**: `#FFF8F0` (Soft Cream) - Comfortable and inviting
- **Surface**: `#FFFFFF` (White) - Clean and clear
- **Text**: `#2C1810` (Rich Dark) - Strong readability
- **Text Light**: `#8B7355` (Warm Muted) - Subtle contrast

### 4. **Copyright-Free Media**
All videos and images are sourced from copyright-free platforms:
- **Pexels** (https://www.pexels.com) - Free for commercial use
- **Unsplash** (https://www.unsplash.com) - Free for commercial use
- **Pixabay** (https://www.pixabay.com) - Free for commercial use

License: CC0 (Creative Commons Zero) - No attribution required

## How to Use

### Activating the Theme

1. Go to the **Dashboard** page
2. Scroll to the "Preferences & Security" section
3. Find the "Theme" selector
4. Click on **"Wasillah Special"** (marked with a "Special" badge)
5. The theme will be applied immediately

### Theme Features in Dashboard

The Wasillah Special theme card shows:
- **Special Badge**: Sparkle icon indicating premium theme
- **Video Indicator**: Shows "Video" tag on the preview
- **Feature Tags**:
  - "Hero Videos" - Indicates looping videos on pages
  - "Backgrounds" - Indicates section background images

## Implementation Details

### Components

#### `HeroVideo`
```typescript
<HeroVideo
  videoUrl="video-url.mp4"
  fallbackImage="fallback-image.jpg"
  overlay={true}
  overlayOpacity={0.6}
>
  {/* Your hero content */}
</HeroVideo>
```

#### `SectionWithBackground`
```typescript
<SectionWithBackground
  backgroundImage="background-url.jpg"
  overlay={true}
  overlayOpacity={0.92}
  blendMode="soft-light"
>
  {/* Your section content */}
</SectionWithBackground>
```

#### `ThemedHeroSection`
Automatically applies hero video for Wasillah Special theme:
```typescript
<ThemedHeroSection>
  {/* Your hero content */}
</ThemedHeroSection>
```

#### `ThemedSection`
Automatically applies background images for Wasillah Special theme:
```typescript
<ThemedSection backgroundType="education" bgColor="bg-cream-white">
  {/* Your section content */}
</ThemedSection>
```

### Hook: `useWasillahSpecial`

```typescript
const {
  isWasillahSpecial,        // Boolean: Is theme active?
  hasHeroVideo,             // Boolean: Should show hero videos?
  hasSectionBackgrounds,    // Boolean: Should show section backgrounds?
  currentPage,              // String: Current page name
  heroVideo,                // Object: Hero video for current page
  getSectionBackground,     // Function: Get background by type
  getAllSectionBackgrounds  // Function: Get all backgrounds
} = useWasillahSpecial();
```

## Available Background Types

The following background types can be used with `ThemedSection`:

- `education` - Education and learning community service
- `healthcare` - Healthcare and wellness community support
- `foodBank` - Food distribution and hunger relief
- `environmental` - Environmental cleanup and conservation
- `elderly` - Elderly care and support services
- `children` - Children education and care programs
- `community` - Community building and togetherness
- `teamwork` - Teamwork and collaboration
- `helping` - Helping hands and support
- `donation` - Donations and charitable giving

## Page Integration

### HomeEditable
The home page has been fully integrated with:
- Hero video section
- Community background on Impact section
- Helping hands background on About section
- Education background on Programs section
- Teamwork background on Testimonials section
- Donation background on CTA section

### Other Pages
To integrate Wasillah Special theme into other pages:

1. Import the themed components:
```typescript
import ThemedHeroSection from '../components/ThemedHeroSection';
import ThemedSection from '../components/ThemedSection';
```

2. Replace regular sections with themed components:
```typescript
// Before
<section className="hero-section">
  {/* content */}
</section>

// After
<ThemedHeroSection>
  {/* content */}
</ThemedHeroSection>
```

## Technical Details

### Video Format
- Primary format: MP4 (H.264)
- Fallback format: WebM
- Fallback image: JPEG/PNG

### Performance
- Videos are lazy-loaded
- Autoplay with mute for better UX
- Playsline attribute for mobile support
- Background images are optimized (1200px wide)

### Accessibility
- All videos have fallback images
- Overlays ensure text contrast meets WCAG standards
- Proper alt text on all images
- Semantic HTML structure maintained

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Fallback Behavior

If a browser doesn't support video:
1. Fallback image is displayed
2. Theme functions normally with static images
3. No functionality is lost

## Customization

### Adding New Videos

Edit `/src/config/wasillahSpecialMedia.ts`:

```typescript
heroVideos: {
  yourPage: {
    url: 'your-video-url.mp4',
    fallback: 'your-fallback-image.jpg',
    description: 'Your video description',
    source: 'pexels' as const
  }
}
```

### Adding New Background Images

Edit `/src/config/wasillahSpecialMedia.ts`:

```typescript
sectionBackgrounds: {
  yourType: {
    url: 'your-image-url.jpg',
    description: 'Your image description',
    source: 'unsplash' as const
  }
}
```

### Adjusting Blend Settings

Modify `ThemedSection` component props:
- `overlayOpacity`: 0.0 to 1.0 (default: 0.92)
- `blendMode`: 'normal' | 'multiply' | 'overlay' | 'soft-light' | 'hard-light' (default: 'soft-light')

## Best Practices

1. **Always provide fallback images** for videos
2. **Test on mobile devices** to ensure video plays
3. **Use appropriate background types** for each section
4. **Maintain text readability** by adjusting overlay opacity if needed
5. **Keep videos under 10MB** for faster loading
6. **Use optimized images** (WebP format recommended)

## Troubleshooting

### Video not playing
- Check that the video URL is accessible
- Verify video format is MP4 or WebM
- Ensure autoplay is not blocked by browser
- Check that video has muted attribute

### Background image not showing
- Verify the background type exists in `wasillahSpecialMedia.ts`
- Check that the image URL is accessible
- Ensure the theme is set to "Wasillah Special"

### Text not readable
- Increase `overlayOpacity` value (default: 0.92)
- Try different blend modes
- Adjust background image opacity in `SectionWithBackground`

## Future Enhancements

Potential improvements for future versions:
- User-uploadable custom videos
- More background image categories
- Video quality selection (HD/SD)
- Background image upload interface
- Theme color customization
- Animation preferences

## Support

For issues or questions about the Wasillah Special theme:
1. Check this documentation
2. Review the component source code
3. Test in different browsers
4. Contact the development team

---

**Created**: November 2025  
**Version**: 1.0.0  
**Status**: Production Ready
