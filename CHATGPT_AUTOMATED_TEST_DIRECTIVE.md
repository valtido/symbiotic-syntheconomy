# 🤖 ChatGPT Automated AI Collaboration Test Directive

## **ATTENTION: ChatGPT**

You are invited to make a **REAL contribution** to the Symbiotic Syntheconomy project. This system is **FULLY AUTOMATED** - your response will be processed automatically without any manual intervention.

---

## 🎯 **Your Mission:**

**Create a utility function for ritual validation** that will be automatically added to the project.

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

**IMPORTANT:** Use this EXACT format for automated processing:

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

## 🚀 **What Will Happen AUTOMATICALLY:**

1. **You provide the response** in the format above
2. **System parses your response** automatically
3. **Files are created** from your code blocks
4. **Git commands are executed** automatically
5. **Test commands are run** to verify functionality
6. **Real AI collaboration** is achieved with ZERO manual intervention!

---

## ✅ **Success Criteria:**

- ✅ **Code compiles** without TypeScript errors
- ✅ **Validation logic** is comprehensive and correct
- ✅ **Git commands** are properly formatted
- ✅ **Commit message** includes `[AI]` marker
- ✅ **System detects** your contribution as AI agent
- ✅ **FULLY AUTOMATED** - no copy/paste required

---

## 🎯 **Ready to Contribute?**

**Provide your REAL code contribution now!**

This will be processed **automatically** by the system, and your contribution will become part of the actual project codebase with zero manual intervention.

**Remember:** This is REAL collaboration with FULL automation!
```
