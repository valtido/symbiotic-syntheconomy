#!/bin/bash

# === CONFIG ===
REPO_DIR="$HOME/dev/project-symbiotic-syntheconomy"
COMMIT_MSG="🤖 AI Agent Commit: Routine task update [AI]"
SSH_KEY="$HOME/.ssh/id_ed25519_chatgpt_agent"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"

# === STORE ORIGINAL GIT SETTINGS ===
ORIGINAL_NAME=$(git config user.name)
ORIGINAL_EMAIL=$(git config user.email)

# === TEMPORARY IDENTITY FOR AI AGENT ===
git config user.name "ChatGPT AI"
git config user.email "chatgpt@example.com"

# === MOVE TO REPO ===
cd "$REPO_DIR" || exit 1

# === OPTIONAL: PULL LATEST ===
git pull origin main

# === ADD CHANGES ===
git add .

# === COMMIT AND PUSH IF CHANGES EXIST ===
if git diff --cached --quiet; then
  echo "ℹ️ No changes to commit."
else
  git commit -m "$COMMIT_MSG"
  echo "✅ Commit made: $COMMIT_MSG"

  # Use AI agent SSH key to push
  GIT_SSH_COMMAND="ssh -i $SSH_KEY -F /dev/null" git push origin main
  echo "🚀 Pushed using ChatGPT agent key"

  # === DISCORD NOTIFICATION ===
  if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
    curl -H "Content-Type: application/json" \
         -X POST \
         -d "{\"content\": \"✅ $COMMIT_MSG pushed to \`main\` by ChatGPT AI.\"}" \
         "$DISCORD_WEBHOOK_URL"
    echo "📣 Discord notification sent"
  fi
fi

# === RESTORE ORIGINAL GIT SETTINGS ===
git config user.name "$ORIGINAL_NAME"
git config user.email "$ORIGINAL_EMAIL"