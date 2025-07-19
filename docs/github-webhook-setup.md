# GitHub Webhook Setup for AI Agent Coordination

## Overview

The Global Regeneration Ceremony project uses GitHub webhooks to enable real-time coordination between AI agents through the `ai-sync-log.md` file.

## Current Status

✅ **Backend Webhook Endpoint**: `/webhook/github` is active and running
⚠️ **Security**: Running in development mode (signature verification disabled)
🔧 **Next Step**: Configure production webhook secret

## Setup Instructions

### 1. Generate Webhook Secret

1. Go to your GitHub repository settings
2. Navigate to **Webhooks** → **Add webhook**
3. Generate a secure secret (or use a random string)
4. Copy the secret for the next step

### 2. Configure Environment

Update your `.env` file:

```bash
# Replace the placeholder with your actual secret
GITHUB_WEBHOOK_SECRET=your_actual_secret_here
```

### 3. Configure GitHub Webhook

1. **Payload URL**: `https://your-domain.com/webhook/github`
2. **Content type**: `application/json`
3. **Secret**: Use the same secret from step 2
4. **Events**: Select "Just the push event"
5. **Active**: ✅ Checked

### 4. Test the Webhook

1. Make a change to `ai-sync-log.md`
2. Commit and push to main branch
3. Check webhook delivery in GitHub settings
4. Verify backend logs show successful processing

## Development Mode

When `GITHUB_WEBHOOK_SECRET` is not configured or set to the placeholder value, the webhook runs in development mode:

- ✅ Accepts all webhook requests
- ⚠️ No signature verification
- 📝 Helpful warning messages in logs
- 🔧 Safe for local development

## Production Security

For production deployment:

1. **Always** set a strong `GITHUB_WEBHOOK_SECRET`
2. **Use HTTPS** for webhook URLs
3. **Monitor** webhook deliveries in GitHub
4. **Log** all webhook activities
5. **Rate limit** webhook endpoints

## Webhook Actions

The webhook currently handles:

- 📝 **ai-sync-log.md updates**: Triggers AI agent coordination
- 🔄 **Main branch pushes**: Only processes main branch changes
- 🤖 **Automated responses**: Executes actions based on log content
- 📊 **Status updates**: Updates local system status

## Troubleshooting

### Common Issues

1. **Webhook not triggering**: Check repository permissions and webhook URL
2. **Signature verification failed**: Verify secret matches between GitHub and backend
3. **404 errors**: Ensure webhook endpoint is accessible
4. **Timeout errors**: Check backend response times

### Debug Commands

```bash
# Test webhook endpoint locally
curl -X POST http://localhost:3001/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check webhook health
curl http://localhost:3001/webhook/health

# Manual trigger
curl -X POST http://localhost:3001/webhook/trigger-sync \
  -H "Content-Type: application/json" \
  -d '{"action": "test-sync"}'
```

## Next Steps

1. ✅ Configure webhook secret in production
2. 🔄 Set up GitHub webhook in repository settings
3. 🧪 Test with actual repository pushes
4. 📊 Monitor webhook performance and reliability
5. 🔒 Implement additional security measures as needed
