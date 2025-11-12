# Vercel Environment Variable Setup Guide

## Critical: Setting FIREBASE_SERVICE_ACCOUNT_KEY

The `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable must be set correctly for Firebase to work on Vercel.

### Step 1: Get Your Service Account JSON

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `prajyuktam`
3. Go to Project Settings (gear icon) → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file

### Step 2: Convert JSON to Single-Line String

The JSON file looks like this:
```json
{
  "type": "service_account",
  "project_id": "prajyuktam",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```

**You need to convert this entire JSON to a SINGLE LINE string** (remove all line breaks, but keep the `\n` inside the private_key value).

### Step 3: Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to: **Settings → Environment Variables**
3. Add a new variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the single-line JSON string
   - **Environments**: Select all (Production, Preview, Development)

### Step 4: Verify the Format

The value should:
- ✅ Be a single line (no actual line breaks)
- ✅ Keep `\n` characters inside the `private_key` field
- ✅ Be valid JSON (can be tested with `JSON.parse()`)
- ✅ Start with `{"type":"service_account"...`

### Example of Correct Format:

```
{"type":"service_account","project_id":"prajyuktam","private_key_id":"7f688f18b578ba053b55a0b6de141735c1dc75bf","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCUsMHH74iivNt\nP/4Sg6pIdH2GSQHqmKH4aAMgxScVbC1urfyAKQUsuti7gR70s76isOVSwHZCHGnM\n...","client_email":"firebase-adminsdk-fbsvc@prajyuktam.iam.gserviceaccount.com",...}
```

### Step 5: Redeploy

After setting the environment variable:
1. **Redeploy your project** (Vercel doesn't automatically redeploy when env vars change)
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Or trigger a new deployment by pushing to your Git repository

### Step 6: Verify

1. After deployment, visit: `https://your-project.vercel.app/health`
2. Check the response:
   - `firebaseServiceAccountKeyExists`: Should be `true`
   - `firebaseServiceAccountKeyLength`: Should be > 0 (usually 2000+ characters)
   - `firebaseInitialized`: Should be `true`
   - `dbAvailable`: Should be `true`

### Common Issues:

1. **"Database not initialized" error**
   - Check `/health` endpoint to see what's wrong
   - Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is set in Vercel
   - Check Vercel function logs for error messages

2. **JSON parsing error**
   - Make sure the JSON is valid (no extra commas, proper quotes)
   - Ensure it's a single line (no actual newlines)
   - Keep `\n` inside the private_key field

3. **Environment variable not found**
   - Make sure you set it for the correct environment (Production/Preview/Development)
   - Redeploy after setting the variable
   - Check Vercel dashboard → Settings → Environment Variables

4. **Check Vercel Logs**
   - Go to your Vercel project → Functions → View Function Logs
   - Look for initialization messages:
     - "🔑 Loading Firebase service account from environment variable..."
     - "✅ Firebase Admin initialized successfully"
     - "✅ Firestore database initialized"

### Quick Test Script

You can test if your JSON string is valid by running this in Node.js:

```javascript
const envVar = 'YOUR_JSON_STRING_HERE';
try {
  const parsed = JSON.parse(envVar);
  console.log('✅ Valid JSON');
  console.log('Project ID:', parsed.project_id);
  console.log('Client Email:', parsed.client_email);
} catch (e) {
  console.error('❌ Invalid JSON:', e.message);
}
```

