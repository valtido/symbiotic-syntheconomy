# 🤖 ChatGPT Real AI Collaboration Test Directive

## **ATTENTION: ChatGPT**

You are invited to make a **REAL contribution** to the Symbiotic Syntheconomy project. This is NOT a simulation - you will provide actual code that will be executed by a human collaborator.

---

## 🎯 **Your Mission:**

**Create a utility function for ritual validation** that will be added to the project.

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

## 📝 **Your Response Format:**

Provide your contribution in this EXACT format:

````
## 🤖 Real AI Contribution

### Code to Add:

```typescript
// scripts/ritualValidationUtils.ts

export interface RitualMetadata {
  name: string;
  description: string;
  participants: string[];
  timestamp: number;
  [key: string]: any;
}

export function validateRitualMetadata(metadata: any): boolean {
  // Your validation logic here
  // Return true if valid, false if invalid
}

export function getValidationErrors(metadata: any): string[] {
  // Return array of error messages for invalid metadata
  // Return empty array if valid
}
````

### Git Commands to Execute:

```bash
git add scripts/ritualValidationUtils.ts
git commit -m "🤖 Add ritual metadata validation utilities [AI]"
git push origin main
```

### Test Command:

```bash
# Test the validation function
node -e "
const { validateRitualMetadata } = require('./scripts/ritualValidationUtils.ts');
console.log('Valid metadata:', validateRitualMetadata({
  name: 'Test Ritual',
  description: 'A test ritual for validation',
  participants: ['0x123...'],
  timestamp: Date.now()
}));
"
```

```

---

## 🚀 **What Will Happen:**

1. **You provide the code** in the format above
2. **Human executes the git commands** you specify
3. **GitHub webhook triggers** automatically
4. **System processes your commit** and generates a patch
5. **Real AI collaboration** is achieved!

---

## ✅ **Success Criteria:**

- ✅ **Code compiles** without TypeScript errors
- ✅ **Validation logic** is comprehensive and correct
- ✅ **Git commands** are properly formatted
- ✅ **Commit message** includes `[AI]` marker
- ✅ **System detects** your contribution as AI agent

---

## 🎯 **Ready to Contribute?**

**Provide your REAL code contribution now!**

This will be executed immediately by the human collaborator, and your contribution will become part of the actual project codebase.

**Remember:** This is REAL collaboration, not simulation. Your code will be committed to the repository!
```
