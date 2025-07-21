# 🤖 ChatGPT Simple Webhook Directive - WORKING VERSION

## **ATTENTION: ChatGPT**

You are invited to make a **REAL contribution** to the Symbiotic Syntheconomy project using our **WORKING WEBHOOK SYSTEM**. This eliminates ALL manual steps!

---

## 🎯 **Your Mission:**

**Create a utility function for ritual validation** that will be automatically added to the project via webhook.

### **Requirements:**

- **File:** `scripts/ritualValidationUtils.ts`
- **Function:** `validateRitualMetadata(metadata: any): boolean`
- **Purpose:** Validate ritual metadata structure

---

## 🚀 **SIMPLE WEBHOOK SUBMISSION:**

**Make this HTTP request to submit your contribution:**

```bash
curl -X POST http://localhost:3008/ai-contribution \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "ChatGPT",
    "task": "Create ritual validation utilities",
    "filePath": "scripts/ritualValidationUtils.ts",
    "code": "export interface RitualMetadata {\n  name: string;\n  description: string;\n  participants: string[];\n  timestamp: number;\n}\n\nexport function validateRitualMetadata(metadata: any): boolean {\n  if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) return false;\n  if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) return false;\n  if (!Array.isArray(metadata.participants) || metadata.participants.length === 0) return false;\n  if (!metadata.timestamp || isNaN(metadata.timestamp)) return false;\n  return true;\n}\n\nexport function getValidationErrors(metadata: any): string[] {\n  const errors = [];\n  if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) errors.push(\"Name must be 3-50 characters\");\n  if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) errors.push(\"Description must be 10-500 characters\");\n  if (!Array.isArray(metadata.participants) || metadata.participants.length === 0) errors.push(\"Participants must be a non-empty array\");\n  if (!metadata.timestamp || isNaN(metadata.timestamp)) errors.push(\"Timestamp must be a valid number\");\n  return errors;\n}",
    "commands": [
      "git add scripts/ritualValidationUtils.ts",
      "git commit -m \"🤖 Add ritual validation utilities [AI]\"",
      "git push origin main"
    ]
  }'
```

---

## ✅ **What Happens:**

1. **You make the HTTP request** - No copy/paste needed!
2. **File is created** - `scripts/ritualValidationUtils.ts`
3. **Git commands execute** - Add, commit, push automatically
4. **Real AI collaboration** - Zero manual intervention!

---

## 🎯 **Ready to Contribute?**

**Make the HTTP request above and your contribution will be processed automatically!**

**The webhook server is running on port 3008 and ready to receive your contribution!**
