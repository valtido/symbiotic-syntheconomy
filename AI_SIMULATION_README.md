# 🤖 AI Agent Simulation System

This system simulates AI agents making commits to demonstrate the webhook and patch generation system working in real-time.

## 🚀 Quick Start

### 1. Start the AI Simulator (Every 3 minutes)

```bash
npm run simulate:ai
```

### 2. Start the AI Simulator (Every 1 minute - Fast Mode)

```bash
npm run simulate:ai:fast
```

### 3. Monitor Activity in Real-Time

```bash
npm run monitor:activity
```

## 📊 What You'll See

### In Your Terminal:

- **AI agents making commits** every few minutes
- **Webhook triggers** when AI commits are pushed
- **Patch generation** in response to AI activity
- **Real-time monitoring** of all activity

### In Your VS Code Git Graph:

- **New commits appearing** regularly
- **Different AI agents** (Cursor, Grok, ChatGPT, Claude)
- **Activity patterns** showing the system working

### In Your Repository:

- **New files created** by AI agents
- **Patches generated** in the `patches/` directory
- **Webhook responses** logged in the backend

## 🤖 AI Agents in the Simulation

1. **Cursor AI** 🤖 - Code improvements and optimizations
2. **Grok AI** 🧠 - Pattern analysis and optimization
3. **ChatGPT AI** 💬 - Code suggestions and fixes
4. **Claude AI** 🎯 - Code review and improvements

## 📝 AI Activities Simulated

- Code optimization and refactoring
- Bug fixes and error handling
- Performance improvements
- Documentation updates
- Security enhancements
- Feature implementation
- Test coverage improvements
- Code style consistency
- Dependency updates
- Architecture improvements

## 🛠️ How It Works

1. **AI Agent Rotation**: Each commit is made by a different AI agent
2. **Activity Rotation**: Each commit performs a different type of activity
3. **Git Configuration**: Automatically switches git config for each AI agent
4. **Webhook Trigger**: Pushes trigger the webhook system
5. **Patch Generation**: Backend generates patches for AI activity
6. **Monitoring**: Real-time monitoring shows all activity

## 🎯 Expected Results

### After Running the Simulator:

- **Git Graph**: Will show new commits every few minutes
- **Patches Directory**: Will contain new patch files
- **Webhook Logs**: Will show processing of AI commits
- **VS Code**: Will show activity in the Git Graph extension

### Example Timeline:

```
11:00 - Cursor AI makes commit
11:03 - Webhook processes commit
11:04 - Patch generated
11:06 - Grok AI makes commit
11:09 - Webhook processes commit
11:10 - Patch generated
... (continues every 3 minutes)
```

## 🛑 Stopping the Simulation

Press `Ctrl+C` in the terminal running the simulator. The system will:

- Stop making new commits
- Restore your original git configuration
- Clean up gracefully

## 🔧 Customization

### Change Commit Interval:

```bash
# Custom interval (in minutes)
npx tsx scripts/aiAgentSimulator.ts 5  # Every 5 minutes
```

### Modify AI Agents:

Edit `scripts/aiAgentSimulator.ts` to:

- Add new AI agents
- Change AI activities
- Modify commit messages
- Adjust file content

## 📈 Monitoring Commands

### Check Current Status:

```bash
# View recent commits
git log --oneline -10

# View recent patches
ls -la patches/ | tail -10

# Check webhook status
curl -X POST https://grc-webhook.loca.lt/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"test":"status"}'
```

### Real-Time Monitoring:

```bash
npm run monitor:activity
```

## 🎉 Success Indicators

You'll know the system is working when you see:

- ✅ New commits appearing in Git Graph
- ✅ Patch files being generated
- ✅ Webhook responses in backend logs
- ✅ AI agent names in commit history
- ✅ Regular activity every few minutes

---

**Note**: This is a simulation system for demonstration purposes. In a real environment, actual AI agents would be making these commits based on their analysis and improvements of your codebase.
