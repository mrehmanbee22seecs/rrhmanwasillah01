# Admin Content Management System (CMS) Guide

## Overview

This website now includes a comprehensive, easy-to-use Content Management System that allows administrators to edit all website content directly through the web interface without any coding knowledge or developer intervention.

## Getting Started

### 1. Admin Access

- **Login as Admin**: Sign in with an admin account (accounts with `isAdmin: true` flag in Firebase)
- **Admin Badge**: When logged in as admin, you'll see an "Admin" badge in the header
- **Edit Mode Toggle**: A floating button appears in the bottom-right corner to enable/disable edit mode

### 2. Enabling Edit Mode

1. Log in with your admin account
2. Click the **"Edit Mode"** button in the bottom-right corner
3. The button will turn green and display **"Editing"** when active
4. Settings icons (⚙️) will now appear on every editable section

### 3. Editing Content

When edit mode is active:
- Look for the **⚙️ settings icon** in the top-right corner of each section
- Click the icon to open the content editor for that section
- Make your changes in the editor modal
- Click **"Save Changes"** to publish immediately
- Click **"Cancel"** to discard changes

## Editable Sections

### Hero Section
**Location**: Top of homepage

**Editable Content**:
- Arabic name (وسیلہ)
- English name (Waseela)
- Main headline
- Highlighted headline text
- Subtitle/description

**How to Edit**:
1. Enable edit mode
2. Click ⚙️ icon in hero section
3. Update text fields
4. Save changes

---

### About/Who We Are Section
**Location**: Third section on homepage

**Editable Content**:
- Section title
- Two paragraphs of description text
- Card title
- Card description

**How to Edit**:
1. Click ⚙️ icon in About section
2. Edit text fields
3. Save changes

---

### Our Impact in Numbers Section
**Location**: Second section on homepage

**Editable Content**:
- Statistics (volunteers, projects, communities, lives impacted)
- Each stat includes: number, label, icon, and target value for animation

**How to Edit**:
1. Click ⚙️ icon in Impact section
2. Update statistics as needed
3. Note: Stats are stored as an array in Firebase

**Future Enhancement**: A dedicated interface for editing individual statistics will be added.

---

### Our Programs Section
**Location**: Fourth section on homepage

**Editable Content**:
- Program title
- Program description
- Emoji icon
- Background color (Tailwind CSS class)
- Text color (Tailwind CSS class)
- Display order

**How to Edit Existing Program**:
1. Click ⚙️ icon on the specific program card
2. Modify any fields
3. Save changes or delete the program

**How to Add New Program**:
1. Click ⚙️ icon at the section level
2. Click "Add New Program"
3. Fill in all fields
4. Set display order (1, 2, 3, etc.)
5. Save

**Available Color Classes**:
- Background: `bg-cream-elegant`, `bg-logo-navy`
- Text: `text-dark-readable`, `text-cream-elegant`

---

### Testimonials Section
**Location**: Fifth section on homepage

**Editable Content**:
- Person's name
- Role/title
- Testimonial quote
- Profile image (upload or URL)
- Star rating (1-5)
- Display order

**How to Edit Existing Testimonial**:
1. Click ⚙️ icon on the specific testimonial card
2. Modify text fields
3. Upload new image if needed
4. Save or delete

**How to Add New Testimonial**:
1. Click ⚙️ icon at the section level
2. Click "Add New Testimonial"
3. Fill in all fields
4. Upload profile image
5. Set display order
6. Save

**Image Upload**:
- Supported formats: JPG, PNG, GIF, WebP
- Images are automatically uploaded to Firebase Storage
- Old images can be removed before uploading new ones

---

### Call-to-Action (CTA) Section
**Location**: Bottom section on homepage

**Editable Content**:
- Main title
- Highlighted title text
- Description text
- Button text
- Button link/URL

**How to Edit**:
1. Click ⚙️ icon in CTA section
2. Update any text
3. Modify button destination URL if needed
4. Save changes

---

## Content Management Features

### Image Upload System
- **Drag and drop** or click to upload images
- **Automatic storage** in Firebase Storage
- **Preview** uploaded images before saving
- **Delete** old images easily
- **Supported formats**: JPG, PNG, GIF, WebP

### Content Versioning
- All content changes are timestamped with `updatedAt` field
- Original content is preserved in Firebase
- **Future enhancement**: Full version history and rollback capability

### Safety Features
- **Confirmation dialogs** for destructive actions (delete)
- **Cancel option** to discard changes
- **Real-time preview** of changes before publishing
- **Validation** for required fields

### Database Structure

Content is stored in Firebase Firestore with the following collections:

```
hero_content/
  main/
    - arabicName
    - englishName
    - title
    - titleHighlight
    - subtitle
    - updatedAt

about_content/
  main/
    - title
    - description1
    - description2
    - cardTitle
    - cardDescription
    - updatedAt

impact_content/
  main/
    - stats[] (array of stat objects)
    - updatedAt

programs/
  {programId}/
    - title
    - description
    - icon
    - color
    - textColor
    - order
    - createdAt
    - updatedAt

testimonials/
  {testimonialId}/
    - name
    - role
    - quote
    - image
    - rating
    - order
    - createdAt
    - updatedAt

cta_content/
  main/
    - title
    - titleHighlight
    - description
    - buttonText
    - buttonLink
    - updatedAt
```

## Best Practices

### Content Guidelines
1. **Keep headlines concise** (under 10 words)
2. **Use clear, simple language** for broader audience
3. **Maintain consistent tone** across sections
4. **Test button links** after updating
5. **Preview changes** before publishing

### Image Guidelines
1. **Use high-quality images** (at least 800px wide)
2. **Optimize file sizes** (under 500KB recommended)
3. **Use relevant, professional photos**
4. **Maintain consistent image style**
5. **Use proper aspect ratios**:
   - Testimonial photos: Square (1:1)
   - Program images: Wide (16:9)

### Display Order
- Lower numbers appear first (1, 2, 3, etc.)
- Leave gaps (10, 20, 30) for easy reordering
- Update order field to rearrange items

## Troubleshooting

### Edit Mode Not Working
- **Solution**: Ensure you're logged in as admin
- **Check**: Admin badge appears in header
- **Try**: Log out and log back in

### Changes Not Saving
- **Check**: All required fields are filled
- **Check**: Internet connection is stable
- **Try**: Refresh the page and try again

### Images Not Uploading
- **Check**: File size (should be under 5MB)
- **Check**: File format (JPG, PNG, GIF, WebP)
- **Try**: Use a different browser
- **Check**: Firebase Storage permissions

### Section Not Appearing
- **Check**: Content exists in Firebase
- **Solution**: Content is auto-initialized on first load
- **Try**: Refresh the page

## Security

### Admin Access Control
- Only users with `isAdmin: true` in Firebase can access edit features
- Edit mode must be manually enabled each session
- All changes are logged with timestamps

### Content Backup
- Firebase automatically backs up data
- Consider exporting content periodically
- **Future enhancement**: Built-in backup/export feature

## Support

For technical issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Check Firebase console for data issues
4. Contact system administrator

## Future Enhancements

Planned improvements:
- [ ] Dedicated interface for editing impact statistics
- [ ] Full version history with rollback
- [ ] Content export/import functionality
- [ ] Bulk content operations
- [ ] Advanced rich text editor with formatting
- [ ] Media library for managing uploaded images
- [ ] Content scheduling (publish at specific time)
- [ ] Multi-language support
- [ ] Content approval workflow
- [ ] Analytics for content performance

---

## Quick Reference

### Keyboard Shortcuts
- Press `Esc` to close any open editor
- Press `Enter` in single-line text fields to save

### Common Tasks

**Change Hero Headline**:
1. Enable edit mode
2. Click ⚙️ on hero section
3. Edit "Main Title" or "Highlighted Title"
4. Save

**Add New Program**:
1. Enable edit mode
2. Click ⚙️ on "Our Programs" heading
3. Click "Add New Program"
4. Fill all fields
5. Save

**Update Testimonial**:
1. Enable edit mode
2. Click ⚙️ on testimonial card
3. Edit any field
4. Save or Delete

**Change Button Text**:
1. Enable edit mode
2. Click ⚙️ on CTA section
3. Update "Button Text"
4. Save

---

**Last Updated**: October 2025
**Version**: 1.0.0
