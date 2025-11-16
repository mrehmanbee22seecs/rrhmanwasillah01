# GitHub Actions Auto-Deployment - REMOVED

**⚠️ IMPORTANT: The GitHub Actions workflow for Firebase Functions has been removed.**

This project now uses **manual CLI deployment** for Firebase Functions instead of automated GitHub Actions deployment.

## Why Changed to CLI Deployment

The GitHub Actions workflow was not working reliably, so we've reverted to the default Firebase CLI deployment method, which is more direct and easier to troubleshoot.

## How to Deploy Firebase Functions (CLI Method)

### Prerequisites

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Select your project**:
   ```bash
   firebase use wasilah-new
   ```

### Deploy Functions

#### Option 1: Deploy Functions Only
```bash
firebase deploy --only functions
```

#### Option 2: Deploy with npm script
```bash
cd functions
npm run deploy
```

### Configure Environment Variables

Before deploying, make sure to set the required configuration:

```bash
firebase functions:config:set resend.api_key="your_resend_api_key"
firebase functions:config:set resend.sender_email="noreply@wasillah.live"
```

To verify configuration:
```bash
firebase functions:config:get
```

## Monitoring Deployments

### Check Deployment Status

After deploying, verify functions are deployed:

```bash
firebase functions:list
```

### View Function Logs

```bash
firebase functions:log
```

### Common Issues

**Issue**: "Not logged in"
- **Solution**: Run `firebase login` to authenticate

**Issue**: "Permission denied"
- **Solution**: Make sure you're using the correct Firebase project with `firebase use`

**Issue**: "Function deployment failed"
- **Solution**: Check function logs and syntax errors. Run `npm install` in the functions directory first.

**Issue**: "Environment config not set"
- **Solution**: Set the required config variables using `firebase functions:config:set`

## Benefits of CLI Deployment

✅ **Direct Control** - Deploy exactly when you want
✅ **Immediate Feedback** - See deployment results in real-time
✅ **Easier Troubleshooting** - Direct access to error messages
✅ **No CI/CD Setup** - No need to configure GitHub secrets
✅ **Works Offline** - Can deploy from local environment

## Security Best Practices

- ✅ Keep Firebase CLI up to date
- ✅ Only deploy from trusted environments
- ✅ Never commit Firebase config files with secrets
- ✅ Use environment variables for sensitive data
- ❌ Never commit tokens to Git
- ❌ Don't share Firebase login credentials

## Troubleshooting

### Deployment Fails

1. Check error messages in terminal
2. Verify you're logged in: `firebase login`
3. Verify project is selected: `firebase use`
4. Install dependencies: `cd functions && npm install`
5. Check Firebase console for quota limits

### Functions Not Updating

1. Clear Firebase cache: `firebase deploy --only functions --force`
2. Verify functions code has no syntax errors
3. Check that dependencies are installed in functions directory

### Installation Issues

If Firebase CLI won't install:
```bash
# Try with sudo (Linux/Mac)
sudo npm install -g firebase-tools

# Or use npx (no installation needed)
npx firebase-tools deploy --only functions
```

## Quick Deployment Checklist

1. ✅ Install Firebase CLI: `npm install -g firebase-tools`
2. ✅ Login: `firebase login`
3. ✅ Select project: `firebase use wasilah-new`
4. ✅ Set config (first time only):
   ```bash
   firebase functions:config:set resend.api_key="your_key"
   firebase functions:config:set resend.sender_email="noreply@wasillah.live"
   ```
5. ✅ Install dependencies: `cd functions && npm install`
6. ✅ Deploy: `firebase deploy --only functions`
7. ✅ Verify: `firebase functions:list`

## Support

If you encounter issues:
- Review Firebase Functions logs: `firebase functions:log`
- See `EMAIL_SETUP_GUIDE.md` for email-specific help
- Check Firebase console for deployment status

---

**Status**: CLI Deployment ✅
**Deployment Method**: Manual via Firebase CLI
**Last Updated**: November 13, 2025

**Note**: The GitHub Actions workflow has been removed. All deployments must now be done manually using Firebase CLI.
