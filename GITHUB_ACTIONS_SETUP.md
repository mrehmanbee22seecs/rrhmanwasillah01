# GitHub Actions Auto-Deployment Setup Guide

This guide explains how to set up automatic Firebase Functions deployment using GitHub Actions.

## What This Does

The workflow automatically deploys Firebase Functions whenever you push changes to the `main` branch that affect:
- Files in the `functions/` directory
- The workflow file itself

## Prerequisites

Before the workflow can run, you need to set up GitHub Secrets with your Firebase credentials.

## Setup Steps

### Step 1: Get Firebase Service Account Key (No CLI Required!)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g., `wasilah-new`)
3. Click **Project Settings** (gear icon) → **Service Accounts** tab
4. Click **Generate New Private Key** button
5. Download the JSON file (keep it secure!)
6. Open the JSON file and copy **ALL** the content

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository: `https://github.com/mrehmanbee22seecs/rrhmanwasillah01`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these three secrets:

#### Secret 1: FIREBASE_SERVICE_ACCOUNT
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: Paste the **ENTIRE** content of the JSON file you downloaded
- **Description**: Firebase service account for deployment

#### Secret 2: RESEND_API_KEY
- **Name**: `RESEND_API_KEY`
- **Value**: `re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve`
- **Description**: Resend API key for sending emails

#### Secret 3: RESEND_SENDER_EMAIL
- **Name**: `RESEND_SENDER_EMAIL`
- **Value**: `noreply@wasillah.live`
- **Description**: Email address to send from (using verified wasillah.live domain)

### Step 3: Verify Setup

After adding secrets:

1. Go to **Actions** tab in your GitHub repository
2. You should see the "Deploy Firebase Functions" workflow
3. Merge this PR to `main` branch
4. The workflow will run automatically!

## How It Works

### Automatic Trigger
- Workflow runs when you push to `main` branch
- Only triggers if files in `functions/` directory change
- This saves GitHub Actions minutes

### Manual Trigger
You can also manually trigger deployment:
1. Go to **Actions** tab
2. Select "Deploy Firebase Functions"
3. Click **Run workflow**
4. Choose branch (usually `main`)
5. Click **Run workflow**

## Workflow Steps

The workflow performs these steps automatically:

1. **Checkout code** - Gets latest code from repository
2. **Setup Node.js** - Installs Node.js 18
3. **Install Firebase CLI** - Installs `firebase-tools`
4. **Install Dependencies** - Runs `npm ci` in functions directory
5. **Authenticate with Firebase** - Uses service account JSON for authentication
6. **Set Firebase Config** - Configures Resend API key and sender email
7. **Deploy Functions** - Deploys all functions to Firebase
8. **Verify Deployment** - Lists deployed functions

## Monitoring Deployments

### View Workflow Runs
1. Go to **Actions** tab in your repository
2. Click on a workflow run to see details
3. Expand steps to see logs

### Check Deployment Status
- ✅ Green checkmark = Successful deployment
- ❌ Red X = Failed deployment (check logs)
- 🟡 Yellow circle = In progress

### Common Issues

**Issue**: "Service Account Authentication Failed"
- **Solution**: Verify the JSON content in `FIREBASE_SERVICE_ACCOUNT` secret is complete and valid

**Issue**: "Permission denied"
- **Solution**: Make sure the service account has "Firebase Admin SDK Administrator Service Agent" role in Firebase Console → Project Settings → Service Accounts

**Issue**: "Function deployment failed"
- **Solution**: Check function logs and syntax errors in the Actions logs

## Benefits

✅ **No Manual Deployment** - Push to main, functions auto-deploy
✅ **Consistent Deployments** - Same process every time
✅ **Version Control** - All changes tracked in Git
✅ **Automated Testing** - Can add tests before deployment
✅ **Rollback Support** - Git history allows easy rollbacks
✅ **Team Collaboration** - Everyone can deploy via PR merge

## Cost

GitHub Actions is **FREE** for public repositories!

For private repositories:
- Free tier: 2,000 minutes/month
- This workflow uses ~2-3 minutes per deployment
- ~600+ deployments/month on free tier

## Security

### Why This is Secure

1. **Secrets are encrypted** - GitHub encrypts all secrets
2. **No secrets in code** - Never commit tokens to Git
3. **Limited access** - Only repository admins can view/edit secrets
4. **Audit trail** - All deployments logged in Actions

### Best Practices

- ✅ Use repository secrets (not environment secrets)
- ✅ Rotate Firebase token periodically
- ✅ Limit repository access to trusted users
- ✅ Review Actions logs regularly
- ❌ Never commit tokens to Git
- ❌ Don't share tokens via chat/email

## Troubleshooting

### Deployment Fails

1. Check Actions logs for error messages
2. Verify all secrets are set correctly
3. Test deployment locally: `firebase deploy --only functions`
4. Check Firebase console for quota limits

### Functions Not Updating

1. Clear Firebase cache: `firebase deploy --only functions --force`
2. Check if correct branch is deployed
3. Verify functions code has no syntax errors

### Can't Find Workflow

1. Make sure workflow file is in `.github/workflows/`
2. Check workflow file has `.yml` extension
3. Verify YAML syntax is correct

## Alternative: Manual Deployment

If you prefer manual deployment, you can still use:

```bash
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase functions:config:set resend.sender_email="noreply@wasillah.live"
firebase deploy --only functions
```

## Next Steps

After setup:

1. ✅ Merge this PR to main
2. ✅ Watch workflow run in Actions tab
3. ✅ Verify functions deployed: `firebase functions:list`
4. ✅ Test email functionality
5. ✅ Check Firebase logs: `firebase functions:log`

## Support

If you encounter issues:
- Check Actions logs in GitHub
- Review Firebase Functions logs
- See `EMAIL_SETUP_GUIDE.md` for email-specific help

---

**Status**: Automated Deployment Ready ✅
**Setup Time**: ~5 minutes (one-time)
**Maintenance**: None (fully automated)

**Created**: November 13, 2025
