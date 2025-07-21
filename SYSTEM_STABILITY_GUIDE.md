# 🛡️ System Stability & Auto-Recovery Guide

## Overview

This guide covers the new **auto-recovery system** that makes your AI collaboration platform stable and self-healing. No more manual intervention when LocalTunnel crashes or the backend fails!

---

## 🚀 **Quick Start - One Command System**

### **Start Everything with Auto-Recovery:**

```bash
npm run start:system
```

This single command will:

- ✅ Kill any existing processes
- ✅ Start the backend server
- ✅ Start LocalTunnel
- ✅ Start the system monitor (auto-recovery)
- ✅ Start the activity monitor
- ✅ Perform health checks
- ✅ Auto-recover from any failures

### **View Real-Time Status:**

```bash
npm run status
```

Shows a live dashboard with:

- 🟢 Backend API status
- 🟢 LocalTunnel status
- 🟢 Webhook status
- 🟢 Auto-recovery status

---

## 🔧 **System Components**

### **1. System Monitor (`scripts/systemMonitor.ts`)**

- **Purpose:** Auto-detects and recovers from failures
- **Checks every:** 30 seconds
- **Max recovery attempts:** 5
- **Recovery cooldown:** 1 minute

**What it monitors:**

- Backend health (port 3006)
- LocalTunnel health (HTTPS tunnel)
- Webhook health (GitHub delivery)

**Auto-recovery actions:**

- Restarts crashed backend
- Restarts failed LocalTunnel
- Logs all recovery attempts

### **2. System Starter (`scripts/startSystem.ts`)**

- **Purpose:** Orchestrates all system components
- **Features:** Process management, logging, health checks
- **Graceful shutdown:** Ctrl+C stops everything cleanly

### **3. Status Dashboard (`scripts/systemStatus.ts`)**

- **Purpose:** Real-time system health visualization
- **Updates:** Every 5 seconds
- **Shows:** Component status, uptime, recovery attempts

---

## 📊 **Monitoring & Logs**

### **Log Files:**

```
log/
├── system-monitor.log    # Auto-recovery events
├── system-startup.log    # System startup events
└── monitor-activity.log  # AI collaboration activity
```

### **Key Log Messages:**

- `[INFO] All systems healthy` - Everything working
- `[WARN] Backend status: UNHEALTHY` - Component failed
- `[WARN] Starting recovery attempt 1/5` - Auto-recovery active
- `[ERROR] Max recovery attempts reached` - Manual intervention needed

---

## 🛠️ **Troubleshooting**

### **System Won't Start:**

```bash
# Kill all processes and restart
pkill -f "node\|tsx\|localtunnel"
npm run start:system
```

### **LocalTunnel Issues:**

```bash
# Check tunnel status
curl https://symbiotic-syntheconomy.loca.lt/health

# Restart tunnel only
pkill -f "localtunnel"
npx localtunnel --port 3006 --subdomain symbiotic-syntheconomy
```

### **Backend Issues:**

```bash
# Check backend status
curl http://localhost:3006/health

# Restart backend only
cd backend && npm run dev
```

### **Webhook Issues:**

```bash
# Test webhook delivery
curl -X POST https://symbiotic-syntheconomy.loca.lt/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

---

## 🔄 **Auto-Recovery Workflow**

### **When a Component Fails:**

1. **Detection** (30s intervals)

   - System monitor detects unhealthy component
   - Logs the failure

2. **Recovery Attempt**

   - Kills existing process
   - Restarts the component
   - Waits for stabilization
   - Verifies health

3. **Success/Failure**

   - **Success:** Logs recovery, resets attempt counter
   - **Failure:** Increments attempt counter, tries again

4. **Max Attempts**
   - After 5 failed attempts, stops trying
   - Logs "Manual intervention required"
   - Continues monitoring other components

### **Recovery Sequence:**

```
Backend → LocalTunnel → Webhook
```

---

## 📈 **Performance & Reliability**

### **Stability Improvements:**

- ✅ **Auto-restart:** No manual intervention needed
- ✅ **Health monitoring:** Proactive failure detection
- ✅ **Graceful degradation:** Partial failures don't crash everything
- ✅ **Comprehensive logging:** Full audit trail
- ✅ **Process isolation:** One component failure doesn't affect others

### **Monitoring Metrics:**

- **Uptime:** How long each component has been running
- **Recovery attempts:** How many times auto-recovery was triggered
- **Last check:** When the system was last verified healthy
- **Component status:** Real-time health of each service

---

## 🎯 **Best Practices**

### **For Development:**

1. **Always use `npm run start:system`** instead of manual commands
2. **Monitor with `npm run status`** to see system health
3. **Check logs** when issues occur
4. **Let auto-recovery handle** temporary failures

### **For Production:**

1. **Set up process manager** (PM2, systemd)
2. **Configure log rotation**
3. **Set up alerts** for repeated failures
4. **Monitor resource usage**

---

## 🚨 **Emergency Procedures**

### **System Completely Down:**

```bash
# Nuclear option - kill everything and restart
pkill -f "node\|tsx\|localtunnel"
sleep 5
npm run start:system
```

### **LocalTunnel URL Changed:**

```bash
# Update GitHub webhook URL to new tunnel URL
# Check: https://symbiotic-syntheconomy.loca.lt/health
```

### **Backend Code Changes:**

```bash
# System will auto-restart backend
# Or manually: cd backend && npm run dev
```

---

## 📋 **Command Reference**

| Command                    | Purpose                              |
| -------------------------- | ------------------------------------ |
| `npm run start:system`     | Start everything with auto-recovery  |
| `npm run status`           | View real-time system dashboard      |
| `npm run monitor:system`   | Start only the auto-recovery monitor |
| `npm run monitor:activity` | Monitor AI collaboration activity    |
| `npm run dev:backend`      | Start backend only (development)     |

---

## 🎉 **Benefits**

### **Before (Manual):**

- ❌ LocalTunnel crashes → Manual restart
- ❌ Backend errors → Manual debugging
- ❌ Webhook failures → Manual investigation
- ❌ System downtime → Manual intervention

### **After (Auto-Recovery):**

- ✅ LocalTunnel crashes → Auto-restart
- ✅ Backend errors → Auto-restart
- ✅ Webhook failures → Auto-detect and log
- ✅ System downtime → Minimal, auto-recovered

**Your AI collaboration system is now bulletproof! 🛡️**
