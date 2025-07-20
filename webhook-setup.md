# GitHub Webhook Setup Guide

## Current Status

- ✅ Backend webhook endpoint: `/webhook/trigger-sync`
- ✅ Manual trigger working: `curl -X POST http://localhost:3002/webhook/trigger-sync`
- ✅ Path issues fixed in backend code
- 🔧 Need to expose webhook publicly

## Step 1: Expose Webhook Publicly

### Option A: Using Localtunnel (Recommended for Development)

```bash
# In a new terminal window
lt --port 3002 --subdomain grc-webhook
```

This will give you a public URL like: `https://grc-webhook.loca.lt`

### Option B: Using ngrok (Alternative)

```bash
# Install ngrok if not already installed
# Then run:
ngrok http 3001
```

## Step 2: Configure GitHub Webhook

1. Go to your GitHub repository: https://github.com/valtido/symbiotic-syntheconomy
2. Click on "Settings" tab
3. Click on "Webhooks" in the left sidebar
4. Click "Add webhook"
5. Configure the webhook:

### Webhook Configuration:

- **Payload URL**: `https://grc-webhook.loca.lt/webhook/trigger-sync` (or your ngrok URL)
- **Content type**: `application/json`
- **Secret**: Create a random secret (e.g., `grc-webhook-secret-2025`)
- **Events**: Select "Just the push event"
- **Active**: ✅ Checked

### Advanced Settings:

- **SSL verification**: ✅ Enabled
- **Redeliver**: Available for testing

## Step 3: Update Environment Variables

Add the webhook secret to your `.env` file:

```bash
GH_WEBHOOK_SECRET=your_webhook_secret_here
```

## Step 4: Test the Webhook

1. Make a change to the repository (e.g., update ai-sync-log.md)
2. Commit and push the change
3. Check the webhook delivery in GitHub:
   - Go to Settings > Webhooks
   - Click on your webhook
   - Click "Recent Deliveries"
   - Check the response

## Step 5: Monitor Webhook Activity

Check the backend logs for webhook activity:

```bash
# The backend will log webhook events like:
# 🔄 Manual sync trigger: test
# 🤖 Processing AI sync log update...
# ✅ Git pull completed
# ✅ AI sync log processing completed
```

## Troubleshooting

### Common Issues:

1. **Webhook not receiving events**: Check the payload URL is accessible
2. **SSL errors**: Ensure the tunnel URL uses HTTPS
3. **Secret verification fails**: Check GH_WEBHOOK_SECRET matches
4. **File not found**: Ensure ai-sync-log.md exists in the root directory

### Testing Commands:

```bash
# Test manual trigger
curl -X POST http://localhost:3001/webhook/trigger-sync \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "data": {}}'

# Check webhook endpoint
curl -s http://localhost:3001/webhook/trigger-sync

# Test with GitHub signature (for production)
curl -X POST http://localhost:3001/webhook/trigger-sync \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{"ref": "refs/heads/main", "repository": {...}}'
```

## Production Deployment

For production, replace the tunnel URL with your actual domain:

- **Payload URL**: `https://yourdomain.com/webhook/trigger-sync`
- **SSL**: Ensure proper SSL certificates
- **Security**: Use strong webhook secrets
- **Monitoring**: Set up webhook delivery monitoring
