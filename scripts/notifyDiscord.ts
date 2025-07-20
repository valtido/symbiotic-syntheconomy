// scripts/notifyDiscord.ts
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export async function sendDiscordNotification(message: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn('⚠️ DISCORD_WEBHOOK_URL not defined.');
    return;
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  });
}
