// scripts/notifyDiscord.ts
import dotenv from 'dotenv';
dotenv.config();

export type NotificationMessage =
  | string
  | {
      agent?: string;
      task?: string;
      status?: string;
      emoji?: string;
      details?: string;
    };

export async function sendDiscordNotification(input: NotificationMessage) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn('⚠️ DISCORD_WEBHOOK_URL not defined.');
    return;
  }

  let content = '';

  if (typeof input === 'string') {
    content = input;
  } else {
    const { agent, task, status, emoji = '🔔', details } = input;
    content = `${emoji} **Agent:** ${agent || 'Unknown'}\n**Task:** ${
      task || 'N/A'
    }\n**Status:** ${status || 'Pending'}${details ? `\n📝 ${details}` : ''}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      console.error(
        `❌ Failed to send Discord message: ${res.status} ${res.statusText}`,
      );
    } else {
      console.log('📣 Discord notification sent successfully.');
    }
  } catch (err) {
    console.error('❌ Error sending Discord message:', err);
  }
}
