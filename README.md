# Symbiotic Syntheconomy v1.0 - Global Regeneration Ceremony (GRC)

A decentralized simulation platform for bioregional ritual submission and validation, featuring AI-powered cultural authenticity filters and blockchain-based governance.

## 🏗️ Architecture

- **Backend**: Node.js v23.6.0 + TypeScript (Fastify)
- **Frontend**: Next.js 15 with TypeScript
- **Smart Contracts**: Solidity on Base testnet (Hardhat)
- **Database**: MongoDB Atlas + Azure Functions
- **Storage**: IPFS for ritual metadata
- **AI Filters**: ESEP (Ethical-Spiritual Evaluation Protocol) + CEDA (Cultural Expression Detection Algorithm)

## 🎯 Objectives

1. Simulate 3 bioregions submitting regeneration rituals
2. Validate rituals using ESEP (max 0.7 skew) and CEDA (min 2 cultural references)
3. Store ritual metadata on IPFS and log transactions to Base testnet
4. Run DAO-based CHC (Cultural Heritage Council) elections and narrative engine

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Build all components
npm run build

# Deploy smart contracts
npm run deploy:contracts
```

## 🤖 AI Agent Coordination

### Overview

This project uses AI agent coordination via GitHub webhooks and shared logs to maintain consistency across multiple AI assistants (Grok, Cursor AI, etc.).

### Coordination Protocol

#### 1. **Sync Log Management**

- **File**: `ai-sync-log.md` in project root
- **Purpose**: Central coordination log for all AI agents
- **Format**: Markdown with timestamps and agent identification
- **Updates**: All deployment events, configuration changes, and status updates

#### 2. **GitHub Webhook Integration**

- **Endpoint**: `https://grc-webhook.loca.lt/webhook/github`
- **Events**: Repository pushes trigger coordination events
- **Security**: Signature verification with environment variable `GH_WEBHOOK_SECRET`
- **Status**: Real-time AI agent synchronization

#### 3. **Agent Communication Flow**

```
Repository Change → GitHub Webhook → Backend API → ai-sync-log.md → Agent Sync
```

#### 4. **AI Agent Setup Instructions**

**For Grok AI:**

- Monitor `ai-sync-log.md` via GitHub API
- Consume updates via repository webhook events
- Maintain context through shared log entries

**For Cursor AI:**

- Local filesystem watcher for `ai-sync-log.md`
- Direct access to project files and deployment logs
- Real-time coordination via webhook endpoint

**For Other AI Agents:**

- Subscribe to repository webhook events
- Parse `ai-sync-log.md` for current project state
- Update coordination log with agent-specific actions

#### 5. **Coordination Commands**

```bash
# Check current AI coordination status
curl http://localhost:3001/webhook/github/status

# View latest sync log
cat ai-sync-log.md

# Test webhook manually
curl -X POST http://localhost:3001/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"test": "ai-coordination"}'
```

#### 6. **Environment Variables**

```bash
# Required for AI coordination
GH_WEBHOOK_SECRET=your_webhook_secret_here
GH_TOKEN=your_github_pat_token
```

#### 7. **Troubleshooting AI Coordination**

**Webhook Not Receiving Events:**

- Verify public URL accessibility
- Check webhook secret configuration
- Ensure repository permissions

**Agent Sync Issues:**

- Validate `ai-sync-log.md` format
- Check webhook endpoint health
- Verify environment variables

**Local Development:**

- Use localtunnel for public webhook URL
- Monitor webhook logs in backend console
- Test with manual webhook triggers

## 📁 Project Structure

```
├── backend/           # Fastify API server
├── frontend/          # Next.js web application
├── contracts/         # Solidity smart contracts
├── schemas/           # Project requirements and schemas
└── docs/             # Documentation
```

## 🔧 Development

### Backend (Fastify)

- Ritual submission endpoint
- AI filter integration (ESEP, CEDA)
- IPFS metadata storage
- MongoDB integration

### Frontend (Next.js)

- Ritual submission form (.grc files)
- Real-time validation feedback
- Bioregion selection interface
- DAO governance dashboard

### Smart Contracts (Base testnet)

- `GRC_RitualSubmission.sol`: Ritual submission logging
- `SymbiosisPledge.sol`: Bioregional commitment tracking

## 🧪 Testing

```bash
# Run all tests
npm run test

# Test specific components
npm run test:backend
npm run test:frontend
npm run test:contracts
```

## 📋 Requirements

- Node.js v23.6.0+
- MongoDB Atlas account
- Base testnet wallet
- IPFS node access

## 🤝 Contributing

This project follows the Symbiotic Syntheconomy principles of regenerative collaboration and cultural authenticity.

## 📄 License

MIT License - See LICENSE file for details.

---

**Lead Developer**: Valtid Caushi
**Version**: 1.0.0
**Status**: Development

Hooks ready.
