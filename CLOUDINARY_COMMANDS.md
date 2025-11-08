# Cloudinary - Quick Command Reference

## 🚀 Start Development Server
```bash
npm run dev
```
Then open the app and test image uploads.

## 🔨 Build for Production
```bash
npm run build
```

## 🧪 Test Upload Components
```bash
# After starting dev server, test in these pages:
# 1. Admin Panel → Leader Manager → Add/Edit Leader → Upload Profile Photo
# 2. Admin Panel → Heads Manager → Add/Edit Head → Upload Profile Photo
# 3. Create Submission Page → Upload Images
```

## 🔍 Verify Environment Variables
```bash
cat .env | grep CLOUDINARY
# Should show:
# VITE_CLOUDINARY_CLOUD_NAME=dk0oiheaa
# VITE_CLOUDINARY_UPLOAD_PRESET=wasilah_unsigned
```

## 📊 Check Cloudinary Uploads

### Option 1: Browser Console
After upload, check console for:
```
Upload completed. URL: https://res.cloudinary.com/dk0oiheaa/...
```

### Option 2: Cloudinary Dashboard
```
1. Visit: https://cloudinary.com/console
2. Login with account: dk0oiheaa
3. Click "Media Library" (left sidebar)
4. Navigate to folders:
   - wasilah/uploads/
   - wasilah/content/
```

## 🐛 Troubleshooting Commands

### Check if axios is installed
```bash
npm list axios
# Should show: axios@1.x.x
```

### Check build output
```bash
npm run build 2>&1 | grep -E "(error|Error|✓)"
# Should show: ✓ built in X.XXs
```

### Verify component imports
```bash
grep -r "ImageUploadField" src/pages/ src/components/
# Shows which components use image upload
```

### Check for Firebase Storage usage (should only be in diagnostics)
```bash
grep -r "uploadBytes\|getDownloadURL" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "uploadDiagnostics\|firebaseHealthCheck"
# Should return empty (all upload logic now uses Cloudinary)
```

## 🎯 Quick Validation
```bash
# Full validation in one command:
npm run build && \
cat .env | grep CLOUDINARY && \
echo "✅ All checks passed!"
```

## 📝 Test Scenarios

### Scenario 1: Happy Path
```bash
# 1. Start app
npm run dev

# 2. Navigate to any upload form
# 3. Select image <2MB (JPEG/PNG)
# 4. Verify:
#    - Progress bar: 0% → 100%
#    - Preview appears
#    - Success message
#    - Console shows Cloudinary URL
```

### Scenario 2: Error Handling
```bash
# Test A: Wrong file type
# 1. Upload .txt file
# 2. Expected: "Only image files allowed"

# Test B: File too large
# 1. Upload >2MB image
# 2. Expected: "File too large. Max 2MB..."

# Test C: Cancel upload
# 1. Start upload
# 2. Click "Cancel Upload"
# 3. Expected: "Upload cancelled"
```

## 🔐 Security Check
```bash
# Verify no secrets in frontend code
grep -r "adcDFpoZk8m4pLoNW4FwGF2S5DI" src/
# Should return: nothing (secret should NOT be in src/)

grep -r "CLOUDINARY_API_SECRET\|CLOUDINARY_URL" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
# Should return: nothing
```

## 📦 Deployment Checklist
```bash
# Before deploying:
✅ npm run build          # Passes with no errors
✅ Test uploads locally   # All work correctly
✅ Verify .env variables  # Both Cloudinary vars present
✅ Check Cloudinary Media Library  # Images appear
✅ Security check         # No secrets in src/
✅ Firestore check        # URLs saved correctly
```

## 🆘 Emergency Rollback
If something goes wrong and you need to rollback:

```bash
# Cloudinary is independent of existing data
# To disable:
# 1. Remove from .env:
#    VITE_CLOUDINARY_CLOUD_NAME
#    VITE_CLOUDINARY_UPLOAD_PRESET
# 2. Component will show: "Cloudinary configuration missing"
# 3. Restore Firebase Storage code from git history if needed
```

## 📚 More Information
- Full migration guide: `CLOUDINARY_MIGRATION_GUIDE.md`
- Quick test: `CLOUDINARY_QUICK_TEST.md`
- Implementation summary: `CLOUDINARY_IMPLEMENTATION_SUMMARY.md`
