# 🤖 ChatGPT AI Collaboration Test Command

## 🎯 **Command for ChatGPT:**

````
You are now participating in a real AI collaboration system. Please follow these steps exactly:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/valtido/symbiotic-syntheconomy.git
   cd symbiotic-syntheconomy
````

2. **Read your configuration file:**
   Read the file `ai-config-chatgpt-ai.md` completely. This contains your specific git identity and commit message patterns.

3. **Configure your git identity** using the instructions in your config file:

   ```bash
   git config user.name "ChatGPT AI"
   git config user.email "chatgpt-ai@openai.com"
   ```

4. **Make a real test commit:**

   - Create a new file called `chatgpt-test-contribution.md`
   - Add some meaningful content about AI collaboration
   - Commit it with the pattern: `[AI] Your commit message here`
   - Push to the repository

5. **Verify the webhook triggered:**

   - Check if a patch file was generated in the `patches/` directory
   - The webhook should process your commit and create a markdown patch file

6. **Make a second contribution:**
   - Add more content to any existing file or create another file
   - Use a different `[AI]` commit message
   - Push again

**Important:** Use ONLY the git identity specified in your config file. Your commits should contain `[AI]` in the message and be identifiable as ChatGPT AI contributions.

Start now and report back what happens at each step!

```

## 📋 **Expected Results:**

When ChatGPT follows this command, you should see:

1. **New commits** in your VS Code Git Graph with `[AI]` tags
2. **ChatGPT AI** as the author name
3. **Patch files** generated in the `patches/` directory
4. **Webhook activity** in your backend logs

## 🚀 **Ready to Test:**

Copy the command above and give it to ChatGPT. The system is live and ready to process real AI agent commits!
```
