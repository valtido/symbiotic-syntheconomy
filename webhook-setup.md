# GitHub Webhook Setup for AI Agent Detection

## 🎯 **Problem Solved**

The file watcher was "blind" to AI agent commits because:

- **AI agents (Cursor, Grok)** push directly to GitHub
- **Local file watcher** only sees local file changes
- **Result**: No auto-patches generated for AI agent work

## 🚀 **Solution: Dual Detection System**

### **1. Enhanced File Watcher** (Local Detection)

- **Pulls before checking**: `git pull origin main` before patch generation
- **Detects remote changes**: Can now see AI agent commits
- **Triggers patches**: Generates patches for remote AI work

### **2. GitHub Webhook** (Real-time Detection)

- **Listens for push events**: Detects commits as they happen
- **AI agent filtering**: Identifies commits from Cursor, Grok, etc.
- **Immediate response**: Triggers patch generation instantly
- **More reliable**: Works even if file watcher is down

## 🔧 **Setup Instructions**

### **Step 1: Configure Environment Variables**

Add to your `.env` file:

```bash
# GitHub Webhook Secret (optional but recommended)
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# Backend URL for webhook
BACKEND_URL=http://localhost:3006
```

### **Step 2: Set Up GitHub Webhook**

1. **Go to your repository**: https://github.com/valtido/symbiotic-syntheconomy
2. **Settings → Webhooks → Add webhook**
3. **Configure webhook**:
   - **Payload URL**: `http://your-domain.com/webhook/github` (or ngrok URL for local testing)
   - **Content type**: `application/json`
   - **Secret**: Same as `GITHUB_WEBHOOK_SECRET` in your .env
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Checked

### **Step 3: Test the Webhook**

**Manual Test**:

```bash
curl -X POST http://localhost:3006/webhook/trigger-sync \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

**GitHub Test**:

1. Make a commit with AI agent signature
2. Push to GitHub
3. Check backend logs for webhook processing

## 🤖 **AI Agent Detection**

The webhook detects AI agents by:

### **Author Name Patterns**:

- `Cursor`
- `Grok`
- `AI`

### **Email Patterns**:

- `cursor@`
- `grok@`

### **Commit Message Patterns**:

- `[AI]`
- `🤖`
- `AI Agent`

## 📊 **How It Works**

### **File Watcher Flow**:

```
1. File change detected
2. git pull origin main ← NEW: Pull remote changes
3. npm run ai:next-patch
4. Commit and push patches
```

### **Webhook Flow**:

```
1. GitHub push event
2. Check if AI agent commit
3. git pull origin main
4. npm run ai:next-patch
5. Commit and push patches
```

## 🔍 **Monitoring**

### **Backend Logs**:

```bash
# Watch webhook activity
tail -f log/backend.log | grep webhook
```

### **File Watcher Logs**:

```bash
# Watch file watcher activity
tail -f log/fileWatcher.log
```

### **Test Commands**:

```bash
# Test webhook manually
curl -X POST http://localhost:3006/webhook/trigger-sync \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'

# Check webhook health
curl http://localhost:3006/webhook/health
```

## 🛠 **Troubleshooting**

### **Webhook Not Receiving Events**:

1. Check webhook URL is accessible
2. Verify secret matches
3. Check GitHub webhook delivery logs

### **File Watcher Not Detecting Remote Changes**:

1. Ensure `git pull` is working
2. Check network connectivity
3. Verify git credentials

### **Patches Not Generating**:

1. Check `npm run ai:next-patch` works manually
2. Verify AI agent detection patterns
3. Check backend logs for errors

## 🎉 **Benefits**

- **No more blind spots**: Detects all AI agent work
- **Real-time response**: Webhook triggers immediately
- **Fallback system**: File watcher still works if webhook fails
- **Better monitoring**: Clear logs and status tracking
- **Scalable**: Works with multiple AI agents

## 📝 **Next Steps**

1. **Set up webhook** in GitHub repository
2. **Test with AI agent commits**
3. **Monitor logs** for successful detection
4. **Adjust detection patterns** if needed
5. **Scale to production** when ready
