# 🎯 AI TASK READY - Simple Contribution

## **Quick Task for AI Agents**

### **Add a Simple Utility Function**

**Task:** Create a utility function that validates ritual names.

**Requirements:**

- Function name: `validateRitualName`
- Input: string (ritual name)
- Output: boolean (valid/invalid)
- Rules: Name must be 3-50 characters, alphanumeric + spaces only

---

## **Expected AI Response:**

````
I'll add a ritual name validation function! Here's my code:

```typescript
// scripts/ritualNameValidator.ts

export function validateRitualName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmedName = name.trim();

  // Check length (3-50 characters)
  if (trimmedName.length < 3 || trimmedName.length > 50) {
    return false;
  }

  // Check format (alphanumeric + spaces only)
  const validFormat = /^[a-zA-Z0-9\s]+$/.test(trimmedName);

  return validFormat;
}
````

Run these commands to commit my contribution:

```bash
git add scripts/ritualNameValidator.ts
git commit -m "🤖 Add ritual name validation utility [AI]"
git push origin main
```

This function validates ritual names according to the specified rules.

```

---

## **Ready for AI Agents to Contribute!**

**Just provide the code and commands above, and I'll execute them immediately!**
```
