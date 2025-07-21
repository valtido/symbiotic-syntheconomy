# 🤖 ChatGPT FINAL AI Collaboration Directive - ZERO COPY/PASTE

## **ATTENTION: ChatGPT**

You are invited to make a **REAL contribution** to the Symbiotic Syntheconomy project using our **WORKING WEBHOOK SYSTEM**. This eliminates ALL manual steps - **NO COPY/PASTE REQUIRED!**

---

## 🎯 **Your Mission:**

**Create a utility function for ritual validation** that will be automatically added to the project via webhook.

### **Requirements:**

- **File:** `scripts/ritualValidationUtils.ts`
- **Function:** `validateRitualMetadata(metadata: any): boolean`
- **Purpose:** Validate ritual metadata structure
- **Rules:**
  - Must check for required fields: `name`, `description`, `participants`, `timestamp`
  - `name` must be 3-50 characters
  - `description` must be 10-500 characters
  - `participants` must be an array with at least 1 item
  - `timestamp` must be a valid date

---

## 🚀 **DIRECT WEBHOOK SUBMISSION - NO COPY/PASTE:**

**Make this HTTP request directly to submit your contribution:**

```bash
curl -X POST http://localhost:3008/ai-contribution \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "ChatGPT",
    "task": "Create ritual validation utilities",
    "filePath": "scripts/ritualValidationUtils.ts",
    "code": "export interface RitualMetadata {\n  name: string;\n  description: string;\n  participants: string[];\n  timestamp: number;\n  [key: string]: any;\n}\n\nexport function validateRitualMetadata(metadata: any): boolean {\n  if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) {\n    return false;\n  }\n  if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) {\n    return false;\n  }\n  if (!Array.isArray(metadata.participants) || metadata.participants.length === 0) {\n    return false;\n  }\n  if (!metadata.timestamp || isNaN(metadata.timestamp)) {\n    return false;\n  }\n  return true;\n}\n\nexport function getValidationErrors(metadata: any): string[] {\n  const errors = [];\n  if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) {\n    errors.push(\"Name must be 3-50 characters\");\n  }\n  if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) {\n    errors.push(\"Description must be 10-500 characters\");\n  }\n  if (!Array.isArray(metadata.participants) || metadata.participants.length === 0) {\n    errors.push(\"Participants must be a non-empty array\");\n  }\n  if (!metadata.timestamp || isNaN(metadata.timestamp)) {\n    errors.push(\"Timestamp must be a valid number\");\n  }\n  return errors;\n}",
    "commands": [
      "git add scripts/ritualValidationUtils.ts",
      "git commit -m \"🤖 Add ritual metadata validation utilities [AI]\"",
      "git push origin main"
    ],
    "testCommand": "node -e \"const { validateRitualMetadata } = require('./scripts/ritualValidationUtils.ts'); console.log('Valid metadata:', validateRitualMetadata({ name: 'Test Ritual', description: 'A test ritual for validation', participants: ['0x123...'], timestamp: Date.now() }));\""
  }'
```

---

## ✅ **What Happens Automatically:**

1. **You make the HTTP request** - No copy/paste needed!
2. **System receives webhook** - Processes your contribution
3. **File is created** - `scripts/ritualValidationUtils.ts`
4. **Git commands execute** - Add, commit, push automatically
5. **Test runs** - Verifies functionality
6. **Real AI collaboration** - Zero manual intervention!

---

## 🎯 **Ready to Contribute?**

**Make the HTTP request above and your contribution will be processed automatically!**

**This is TRUE automation - no copy/paste, no manual steps, just direct webhook submission!**

**The webhook server is running and ready to receive your contribution!**
