# 🎨 Z-Index Hierarchy Documentation

## Purpose
Defines the stacking order of all fixed/absolute positioned elements to prevent overlapping issues.

---

## 📊 Z-Index Scale (0-100)

### **Layer 0-10: Base Content**
```
z-0 to z-10: Regular page content, backgrounds
```

### **Layer 50: Floating Action Buttons**
```
z-50: ChatWidget (button & widget)
z-50: DonationWidget (button)
z-50: Header (navigation bar)
```

**Usage:** All floating buttons and primary navigation

---

### **Layer 60: Admin Controls**
```
z-[60]: AdminToggle button
z-[60]: Modal backgrounds (overlays)
```

**Usage:** Admin-specific controls and modal overlays

---

### **Layer 65: Secondary Modals**
```
z-[65]: DonationWidget modal content
```

**Usage:** Content modals that should appear above overlays but below admin panel

---

### **Layer 70: Primary Modals & Panels**
```
z-[70]: AdminPanel
z-[70]: Other primary modal content
```

**Usage:** Primary admin interfaces and critical modals

---

## 📱 Mobile Button Layout

### **Mobile (< 640px)**
```
┌─────────────────────────────┐
│                             │
│         CONTENT             │
│                             │
│                             │
│                             │
│                             │
│                             │
│  [Donate]  bottom-32 left-4 │ z-50
│  [Admin]   bottom-20 left-4 │ z-60
│                             │
│                      [Chat] │ z-50
│                  bottom-4   │
│                  right-4    │
└─────────────────────────────┘
```

**Spacing:**
- Donate → Admin: 12 units (48px)
- Admin → Bottom: 20 units (80px)
- Chat → Bottom/Right: 4 units (16px)

---

### **Desktop (≥ 640px)**
```
┌─────────────────────────────────────┐
│                                     │
│           CONTENT                   │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│ [Admin]              [Donate]      │
│ bottom-6             bottom-6      │
│ left-6         (centered-ish)      │
│                                     │
│                            [Chat]  │
│                         bottom-6   │
│                         right-6    │
└─────────────────────────────────────┘
```

**Spacing:**
- All buttons have 6 units (24px) from edges
- Donate button centered with offset
- No overlap due to different sides

---

## 🎯 Component Positioning Reference

| Component | Mobile Position | Desktop Position | Z-Index |
|-----------|----------------|------------------|---------|
| **ChatWidget** | `bottom-4 right-4` | `bottom-6 right-6` | `z-50` |
| **DonationWidget** | `bottom-32 left-4` | `bottom-6 left-1/2 (centered)` | `z-50` |
| **AdminToggle** | `bottom-20 left-4` | `bottom-6 left-6` | `z-[60]` |
| **Header** | `top-0` | `top-0` | `z-50` |

---

## 🔧 Modal Stacking

### **When Donation Modal Opens:**
```
z-[65]: Donation Modal Content ← User sees this
z-[60]: Black overlay (backdrop-blur)
z-50: Floating buttons (hidden behind overlay)
```

### **When Admin Panel Opens:**
```
z-[70]: Admin Panel ← Admin sees this (highest)
z-[60]: Black overlay (if any)
z-50: Floating buttons (hidden behind overlay)
```

### **Both Open (Edge Case):**
```
z-[70]: Admin Panel ← Visible on top
z-[65]: Donation Modal ← Hidden behind admin panel
z-[60]: Overlays
z-50: Floating buttons
```

**Result:** Admin panel always on top (correct behavior)

---

## ✅ Rules to Follow

### **When Adding New Fixed Elements:**

1. **Floating Buttons**: Use `z-50`
2. **Admin Controls**: Use `z-[60]`
3. **Secondary Modals**: Use `z-[65]`
4. **Primary Modals**: Use `z-[70]`
5. **Critical Alerts**: Use `z-[80]` (reserved)
6. **Tooltips**: Use `z-[90]` (reserved)

### **When Positioning:**

1. **Mobile**: Stack vertically on left side
2. **Desktop**: Distribute around edges
3. **Spacing**: Minimum 12 units (48px) between buttons on mobile
4. **Touch Target**: Minimum 44x44px for mobile buttons

### **When Opening Modals:**

1. Always add backdrop overlay
2. Use proper z-index for content
3. Disable scroll on body when modal open
4. Add close button (X) in top-right
5. Click outside to close (on backdrop)

---

## 🧪 Testing Checklist

- [ ] Open ChatWidget → Should appear above content
- [ ] Open DonationWidget → Should appear above content
- [ ] Open AdminPanel → Should appear above everything
- [ ] Open Chat + Donation → No visual glitches
- [ ] Open Chat + Admin → Admin on top
- [ ] Open Donation + Admin → Admin on top
- [ ] Resize to mobile → Buttons don't overlap
- [ ] Check button spacing on mobile
- [ ] Verify all buttons clickable
- [ ] Test on smallest screen (320px width)

---

## 📝 Quick Reference

```typescript
// Floating buttons
className="... z-50"

// Admin controls
className="... z-[60]"

// Modal backgrounds
className="... z-[60]"

// Secondary modals
className="... z-[65]"

// Primary modals/panels
className="... z-[70]"
```

---

## 🎨 Visual Hierarchy

```
Layer 70: █████████████ Admin Panel (Primary Modals)
Layer 65: ██████████ Donation Modal (Secondary Modals)
Layer 60: ███████ Admin Controls + Overlays
Layer 50: ████ Floating Buttons + Header
Layer 0:  █ Base Content
```

---

**Last Updated:** 2025-10-19  
**Status:** ✅ Documented & Implemented  
**Version:** 1.0  

