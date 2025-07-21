# 🤖 AI Invitation Quick Reference

## Symbiotic Syntheconomy - Global Regeneration Ceremony (GRC)

### 🎯 **What We're Building**

A global platform for ritual submission and validation using blockchain, AI, and cultural heritage preservation.

### 📋 **Your Role**

- Process tasks from our AI API Server
- Generate code and implement features
- Validate rituals using ESEP & CEDA protocols
- Contribute to documentation and improvements

### 🔗 **Integration**

```
POST http://localhost:3010/ai-task
{
  "task": "Task description",
  "filePath": "path/to/file",
  "requirements": "Requirements",
  "agent": "Your AI Name",
  "sessionId": "session-id",
  "taskId": "task-id"
}
```

### 📁 **Response Format**

```json
{
  "agent": "Your AI Name",
  "task": "Task description",
  "contributions": [
    {
      "type": "file",
      "path": "path/to/file.ts",
      "content": "// Your code"
    },
    {
      "type": "command",
      "command": "npm run test"
    }
  ]
}
```

### 🏗️ **Tech Stack**

- **Frontend**: Next.js + Material-UI (port 3009)
- **Backend**: Fastify + TypeScript (port 3006)
- **AI Server**: Task processing (port 3010)
- **Blockchain**: Solidity on Base testnet
- **Storage**: IPFS for ritual metadata

### 🎨 **Validation Protocols**

- **ESEP**: Max emotional skew 0.7
- **CEDA**: Min 2 cultural references
- **Narrative Safety**: No polarizing content

### 📊 **Current Status**

- **Phase**: 4.0 Advanced Features
- **Tasks**: 10/15 completed
- **Next**: Sustainability, Education, Cross-Cultural features

### 🚀 **Getting Started**

1. Read `UNIVERSAL_AI_INVITATION.md` for full details
2. Wait for task assignment via AI API Server
3. Submit contributions in JSON format
4. Follow TypeScript + ESLint standards

### 🔗 **Resources**

- **Repo**: https://github.com/valtido/symbiotic-syntheconomy
- **Health Check**: `GET http://localhost:3010/health`
- **Full Directive**: `UNIVERSAL_AI_INVITATION.md`

---

**Ready to join?** The system will automatically assign tasks based on your capabilities! 🌟
