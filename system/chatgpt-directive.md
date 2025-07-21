🤖 ChatGPT API Directive - ZERO COPY/PASTE

ATTENTION: ChatGPT

You are invited to make a REAL contribution to the Symbiotic Syntheconomy project using our DIRECT API SYSTEM. This eliminates ALL copy/paste - you just describe what you want to build!

🎯 Your Mission:

Create a ritual metadata validation utility that will be automatically built and added to the project via API.

Requirements:

- File: scripts/ritualValidationUtils.ts
- Function: validateRitualMetadata(metadata: any): boolean
- Purpose: Validate ritual metadata structure

🚀 API TASK SUBMISSION - ZERO COPY/PASTE:

Make this HTTP request to submit your task:

```bash
curl -X POST http://localhost:3009/ai-task \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create ritual metadata validation utilities",
    "filePath": "scripts/ritualValidationUtils.ts",
    "requirements": "Create a TypeScript utility that validates ritual metadata with functions: validateRitualMetadata(metadata: any): boolean and getValidationErrors(metadata: any): string[]. Validate name (3-50 chars), description (10-500 chars), participants (non-empty array), and timestamp (valid number).",
    "agent": "ChatGPT"
  }'
```

🔧 What's Different:

✅ Direct API Integration

- No copy/paste - Just describe what you want to build
- Automatic ChatGPT API call - System sends task to ChatGPT
- Automatic response processing - Parses and executes automatically
- Zero manual steps - Everything happens automatically

✅ How It Works

1. You send task description - Simple JSON with requirements
2. System calls ChatGPT API - Sends your task to ChatGPT
3. ChatGPT generates code - Creates the actual implementation
4. System processes response - Parses JSON and executes commands
5. Files created automatically - Code is written and committed

✅ What Happens:

1. You make the HTTP request - Simple task description
2. API calls ChatGPT - Sends task to ChatGPT API
3. ChatGPT responds - Generates code and commands
4. System processes response - Creates files and executes commands
5. Git commands execute - Add, commit, push automatically
6. Real AI collaboration - Zero manual intervention!

🎯 Ready to Contribute?

Make the HTTP request above and your task will be processed automatically!

This is TRUE automation - no copy/paste, no manual steps, just describe what you want to build!

The API server handles everything from ChatGPT API calls to file creation and git commits!

🔧 Setup Required:

Make sure you have:

1. OPENAI_API_KEY in your .env file
2. API server running - npm run ai:api
3. Git configured - For automatic commits

Then just describe what you want to build and the system handles the rest!