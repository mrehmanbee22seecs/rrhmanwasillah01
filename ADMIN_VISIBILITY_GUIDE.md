# Admin Guide: Managing Project & Event Visibility

## Quick Reference

This guide explains how to manage project and event submissions using the enhanced Admin Panel.

---

## Understanding Visibility States

### Status Badges

Each submission displays multiple badges:

1. **Type Badge** (Blue/Purple):
   - `Project` - Project submission
   - `Event` - Event submission

2. **Status Badge** (Color-coded):
   - `Draft` (Gray) - User saved but not submitted
   - `Pending` (Yellow) - Awaiting admin review
   - `Approved` (Green) - Approved by admin
   - `Rejected` (Red) - Rejected by admin

3. **Visibility Badge** (Green/Gray):
   - `Visible` (Green) - Shown on public pages
   - `Hidden` (Gray) - Hidden from public

---

## Admin Actions

### 1. Review Pending Submissions

**When**: A submission has `Pending` status

**Actions Available**:
- **Review** - Opens detailed review form
- **Approve** - Quick approve without comments
- **Delete** - Permanently remove submission

**Review Process**:
1. Click "Review" button
2. Read submission details carefully
3. Add admin comments (optional)
4. Choose action:
   - **Approve**: Makes visible to public
   - **Reject**: Hides from public, adds rejection reason
   - **Cancel**: Close review form

---

### 2. Manage Approved Submissions

**When**: A submission has `Approved` status

**Actions Available**:
- **Hide** - Remove from public pages (temporary)
- **Show** - Make visible on public pages
- **Delete** - Permanently remove submission

**Hide/Show Toggle**:
- Approved items are visible by default
- Click "Hide" to temporarily remove from public view
- Click "Show" to make visible again
- Useful for:
  - Temporarily removing outdated content
  - Testing before going live
  - Seasonal content management

---

### 3. Delete Submissions

**When**: You want to permanently remove a submission

**Process**:
1. Click "Delete" button
2. Confirm deletion in popup dialog
3. Submission is permanently removed

**Warning**: Deletion is permanent and cannot be undone!

**When to Delete**:
- Duplicate submissions
- Spam or inappropriate content
- User requested removal
- Outdated content no longer relevant

---

## Visibility Logic

### Automatic Visibility Rules

1. **Approved Submissions**:
   - Automatically set to `isVisible: true`
   - Appears on public Projects/Events pages

2. **Rejected Submissions**:
   - Automatically set to `isVisible: false`
   - Hidden from public pages

3. **Pending/Draft Submissions**:
   - Never visible to public
   - Only visible in Admin Panel

### Manual Visibility Control

Admins can override automatic visibility for approved items:

- **Hide**: Keeps submission approved but removes from public
- **Show**: Makes hidden submission visible again

This allows temporary content management without changing approval status.

---

## Common Workflows

### Workflow 1: Approve New Submission

```
1. User submits project/event
2. Status: Pending, Not Visible
3. Admin clicks "Review"
4. Admin reads details
5. Admin clicks "Approve"
6. Status: Approved, Visible
7. Appears on public page immediately
```

### Workflow 2: Temporarily Hide Content

```
1. Submission is Approved and Visible
2. Admin clicks "Hide" button
3. Status: Approved, Hidden
4. Removed from public page
5. Later: Admin clicks "Show"
6. Status: Approved, Visible
7. Appears on public page again
```

### Workflow 3: Reject Submission

```
1. Submission is Pending
2. Admin clicks "Review"
3. Admin adds rejection reason
4. Admin clicks "Reject"
5. Status: Rejected, Hidden
6. Email sent to submitter with reason
7. Never appears on public page
```

### Workflow 4: Delete Unwanted Content

```
1. Submission exists (any status)
2. Admin clicks "Delete" button
3. Confirm deletion dialog appears
4. Admin confirms
5. Submission permanently deleted
6. Cannot be recovered
```

---

## Best Practices

### Before Approving

- [ ] Verify all information is accurate
- [ ] Check images are appropriate and load correctly
- [ ] Ensure location details are correct
- [ ] Confirm contact information is valid
- [ ] Review for inappropriate content

### When Rejecting

- [ ] Always provide a clear rejection reason
- [ ] Be specific about what needs to be fixed
- [ ] Use professional, helpful language
- [ ] Encourage resubmission after fixes

### Using Hide/Show

- [ ] Hide outdated events after they occur
- [ ] Hide seasonal content when not relevant
- [ ] Show content before major announcements
- [ ] Use hide for testing new submissions

### Before Deleting

- [ ] Consider hiding instead of deleting
- [ ] Verify it's not just temporarily outdated
- [ ] Check if user might update it
- [ ] Remember: Deletion is permanent

---

## Troubleshooting

### "Approved but not showing on page"

**Possible Causes**:
1. Visibility is set to "Hidden"
2. Browser cache not cleared
3. Database indexes still building

**Solutions**:
1. Check visibility badge - should show "Visible"
2. Click "Show" button if hidden
3. Clear browser cache and reload
4. Wait 5 minutes and try again

### "Cannot delete submission"

**Possible Causes**:
1. Network connectivity issue
2. Insufficient permissions
3. Database error

**Solutions**:
1. Check internet connection
2. Verify you're logged in as admin
3. Try refreshing page
4. Check browser console for errors

### "Hide/Show button not working"

**Possible Causes**:
1. Submission not approved
2. Database connection issue
3. JavaScript error

**Solutions**:
1. Only approved items can be hidden/shown
2. Refresh page and try again
3. Check browser console for errors

---

## Keyboard Shortcuts

Currently, all actions require clicking buttons. Future enhancement will add:

- `R` - Review selected submission
- `A` - Approve selected submission
- `H` - Toggle hide/show
- `Delete` - Delete selected submission

---

## Audit Trail

Every action you take is logged in the submission's audit trail:

**Logged Actions**:
- Status changes (approve/reject)
- Visibility toggles (hide/show)
- Admin comments added
- Deletion (recorded before removal)

**Audit Trail Information**:
- Action taken
- Performed by (your user ID)
- Timestamp
- Previous status
- New status
- Details/comments

**Viewing Audit Trail**:
Currently visible in database. Future enhancement will add in Admin Panel.

---

## Tips for Efficient Management

1. **Use Filters**: Filter by status to focus on pending items
2. **Batch Review**: Review multiple submissions at once
3. **Add Comments**: Always add helpful comments when approving
4. **Regular Checks**: Check Admin Panel daily for new submissions
5. **Quick Approve**: Use quick approve for obviously good submissions
6. **Use Hide Wisely**: Hide instead of delete for temporary removal

---

## Getting Help

If you need assistance:

1. Check this guide first
2. Review the main deployment guide
3. Check browser console for errors
4. Contact technical support with:
   - Screenshot of issue
   - Submission ID
   - Error message (if any)
   - Steps to reproduce

---

## Summary

With the enhanced Admin Panel, you can:
- ✅ Review and approve/reject submissions
- ✅ Control visibility of approved content
- ✅ Delete unwanted submissions
- ✅ Track all changes via audit trail
- ✅ Manage content efficiently

All changes take effect immediately on public pages.
