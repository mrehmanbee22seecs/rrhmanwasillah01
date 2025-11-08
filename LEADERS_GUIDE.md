# Project Leaders & Event Organizers Management Guide

This guide explains how to manage multiple project leaders and event organizers with individual profile sections.

## Overview

The system now supports adding multiple leaders for projects and organizers for events. Each profile includes:
- Profile image
- Name and role/title
- Biography
- Contact details (email and phone)
- Social media links (LinkedIn, Twitter)
- Project-specific: specialization and years of experience
- Event-specific: department

## For Administrators

### Adding a Leader/Organizer

1. Navigate to any project or event detail page
2. Enable Admin Mode using the toggle in the header
3. Scroll to the "Project Leaders" or "Event Organizers" section at the bottom
4. Click the "Add Leader" or "Add Organizer" button
5. Fill in the required fields:
   - Upload a profile image
   - Enter name and role
   - Write a biography
   - Add contact details
   - Optionally add social media links
   - For projects: add specialization and experience
   - For events: add department
6. Click "Add Leader/Organizer" to save

### Editing a Profile

1. Enable Admin Mode
2. Navigate to the leader/organizer card
3. Click the "Edit Profile" button on the card
4. Update the information
5. Click "Update" to save changes

### Deleting a Profile

1. Enable Admin Mode
2. Find the profile card you want to remove
3. Click the X button in the top-right corner of the card
4. Confirm the deletion

## Data Structure

### Firebase Collections

Two new collections store the data:

1. **project_leaders** - stores project leader profiles
   - Fields: name, role, bio, profileImage, email, phone, linkedIn, twitter, projectId, specialization, yearsOfExperience, order, createdAt, updatedAt

2. **event_organizers** - stores event organizer profiles
   - Fields: name, role, bio, profileImage, email, phone, linkedIn, twitter, eventId, department, responsibilities, order, createdAt, updatedAt

### Image Storage

Profile images are stored in Firebase Storage under the `leaders/` folder.

## For Users

When viewing a project or event, users can:
- See all leaders/organizers displayed in profile cards
- View their contact information
- Click email/phone links to reach out
- Access their social media profiles via LinkedIn/Twitter icons

## Features

- **Multiple profiles**: Add as many leaders or organizers as needed
- **Rich profiles**: Each person has their own dedicated profile section
- **Contact integration**: Email and phone links for easy communication
- **Social media**: Direct links to professional profiles
- **Image support**: Upload custom profile photos
- **Role-specific fields**: Different fields for project leaders vs event organizers
- **Ordering**: Profiles display in the order they were added
- **Admin controls**: Only admins in edit mode can add, edit, or delete profiles

## Technical Details

### Components

- `LeaderProfileCard.tsx` - Displays individual leader/organizer profile
- `LeaderManager.tsx` - Manages all profiles for a project or event
- `types/leaders.ts` - TypeScript type definitions

### Integration

The leader management system is integrated into:
- `ProjectDetail.tsx` - Shows project leaders at the bottom of the page
- `EventDetail.tsx` - Shows event organizers at the bottom of the page

Both pages only show the management interface when the user is in admin mode.
