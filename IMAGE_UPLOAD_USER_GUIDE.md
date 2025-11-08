# Image Upload User Guide

## Where to Upload Images

### 1. Project & Event Submissions
**Location:** Create New Project/Event page

**What you can upload:**
- Cover image for your project or event
- Profile photos for project heads/event organizers

**Requirements:**
- Image formats: JPEG, PNG, GIF, or WebP
- Maximum size: 5MB
- Must be logged in

**Steps:**
1. Navigate to Dashboard → Create New
2. Fill in project/event details
3. Scroll to "Cover Image" section
4. Click "Click to upload image"
5. Select your image file
6. Wait for upload to complete (progress bar will show)
7. You'll see a success message and preview

---

### 2. Meet Our Team Section
**Location:** Admin Panel → Team Management

**What you can upload:**
- Profile photos for team leaders

**Requirements:**
- Image formats: JPEG, PNG, GIF, or WebP
- Maximum size: 5MB
- Must be admin

**Steps:**
1. Log in as admin
2. Navigate to team member profile
3. Click "Add Leader" or edit existing
4. Click "Click to upload image" in Profile Image section
5. Select your image file
6. Wait for upload completion
7. Click Save

---

### 3. What Our Community Says (Testimonials)
**Location:** Admin Panel → Home Page Editor

**What you can upload:**
- Profile photos for testimonials

**Requirements:**
- Image formats: JPEG, PNG, GIF, or WebP
- Maximum size: 5MB
- Must be admin

**Steps:**
1. Enable admin mode (click admin toggle)
2. Navigate to Home page
3. Click edit button on "What Our Community Says" section
4. Click "Add Testimonial" or edit existing
5. Upload image in Profile Image field
6. Add name, role, and testimonial text
7. Click Save Changes

---

## Upload Process

### What happens when you upload:
1. ✅ File is validated for format and size
2. ✅ Upload progress is shown (0-100%)
3. ✅ File is securely uploaded to Firebase Storage
4. ✅ Success message is displayed
5. ✅ Preview is shown immediately

### If upload fails:
- ❌ Error message will explain the problem
- ❌ Common issues: file too large, wrong format, network error
- ❌ Try again after fixing the issue

---

## Troubleshooting

### "File size must be less than 5MB"
**Solution:** Compress or resize your image before uploading
- Use online tools like TinyPNG or Squoosh
- Or use image editing software to reduce size

### "Please upload a valid image file"
**Solution:** Make sure your file is:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### "Failed to upload image"
**Solution:**
1. Check your internet connection
2. Make sure you're logged in
3. Try refreshing the page
4. Try a different image
5. Contact support if problem persists

### Upload stuck at 30% or 70%
**Solution:**
1. Wait a moment (large files take time)
2. Check internet connection
3. If stuck for more than 2 minutes, refresh and try again

### Image preview not showing
**Solution:**
1. Make sure upload completed (100% + success message)
2. Refresh the page
3. Check if image URL is valid

---

## Best Practices

### Image Quality
- ✅ Use high-quality images (but under 5MB)
- ✅ Recommended resolution: 1920x1080 or higher for covers
- ✅ Recommended resolution: 500x500 for profile photos
- ✅ Use clear, well-lit photos

### File Format
- ✅ JPEG for photos (best compression)
- ✅ PNG for graphics with transparency
- ✅ WebP for modern browsers (best quality/size ratio)
- ❌ Avoid BMP, TIFF (not supported)

### File Size
- ✅ Aim for 1-2MB for cover images
- ✅ Aim for 200-500KB for profile photos
- ✅ Compress images before uploading
- ❌ Don't upload RAW or uncompressed files

---

## Security & Privacy

### Who can upload where:
- **Projects/Events:** Any authenticated user
- **Team Members:** Admin only
- **Testimonials:** Admin only
- **CMS Content:** Admin only

### Image Storage:
- All images stored securely in Firebase Storage
- Images accessible via secure HTTPS URLs
- Automatic CDN delivery for fast loading
- Images cannot be deleted by non-admins

---

## Need Help?

If you encounter any issues:
1. Check this guide first
2. Verify you meet all requirements
3. Try the troubleshooting steps
4. Contact your administrator
5. Check browser console for technical errors

---

## Quick Reference

| Section | Max Size | Formats | Who Can Upload |
|---------|----------|---------|----------------|
| Project/Event Covers | 5MB | JPEG, PNG, GIF, WebP | Authenticated Users |
| Project Heads | 5MB | JPEG, PNG, GIF, WebP | Authenticated Users |
| Team Leaders | 5MB | JPEG, PNG, GIF, WebP | Admin Only |
| Testimonials | 5MB | JPEG, PNG, GIF, WebP | Admin Only |
| CMS Content | 5MB | JPEG, PNG, GIF, WebP | Admin Only |
