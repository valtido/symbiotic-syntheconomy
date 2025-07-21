// scripts/verifyApiKeys.ts
import dotenv from 'dotenv';

dotenv.config();

async function verifyOpenAI() {
  console.log('🔍 Verifying OpenAI API Key...');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('❌ No OpenAI API key found in .env');
    return;
  }

  console.log(
    `📋 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(
      apiKey.length - 4,
    )}`,
  );

  try {
    // Test 1: List models (should work)
    console.log('🧪 Test 1: Listing models...');
    const modelsResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (modelsResponse.ok) {
      const models = await modelsResponse.json();
      console.log('✅ Models accessible:', models.data.length, 'models found');
      console.log(
        '📋 Available models:',
        models.data
          .slice(0, 3)
          .map((m: any) => m.id)
          .join(', '),
      );
    } else {
      console.log(
        '❌ Cannot list models:',
        modelsResponse.status,
        modelsResponse.statusText,
      );
    }

    // Test 2: Try a minimal request
    console.log('🧪 Test 2: Testing minimal request...');
    const chatResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      },
    );

    if (chatResponse.ok) {
      const result = await chatResponse.json();
      console.log('✅ Chat request successful!');
      console.log('📋 Response:', result.choices[0].message.content);
    } else {
      const error = await chatResponse.text();
      console.log(
        '❌ Chat request failed:',
        chatResponse.status,
        chatResponse.statusText,
      );
      console.log('📋 Error details:', error);
    }
  } catch (error) {
    console.log('❌ OpenAI verification failed:', error);
  }
}

async function verifyGrok() {
  console.log('\n🔍 Verifying Grok API Key...');

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    console.log('❌ No Grok API key found in .env');
    return;
  }

  console.log(
    `📋 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(
      apiKey.length - 4,
    )}`,
  );

  try {
    // Test 1: List models
    console.log('🧪 Test 1: Listing models...');
    const modelsResponse = await fetch('https://api.x.ai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (modelsResponse.ok) {
      const models = await modelsResponse.json();
      console.log('✅ Models accessible:', models);
    } else {
      const error = await modelsResponse.text();
      console.log(
        '❌ Cannot list models:',
        modelsResponse.status,
        modelsResponse.statusText,
      );
      console.log('📋 Error details:', error);
    }

    // Test 2: Try a minimal request
    console.log('🧪 Test 2: Testing minimal request...');
    const chatResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
        stream: false,
        temperature: 0,
      }),
    });

    if (chatResponse.ok) {
      const result = await chatResponse.json();
      console.log('✅ Chat request successful!');
      console.log('📋 Response:', result);
    } else {
      const error = await chatResponse.text();
      console.log(
        '❌ Chat request failed:',
        chatResponse.status,
        chatResponse.statusText,
      );
      console.log('📋 Error details:', error);
    }
  } catch (error) {
    console.log('❌ Grok verification failed:', error);
  }
}

async function main() {
  console.log('🔍 API Key Verification Tool\n');

  await verifyOpenAI();
  await verifyGrok();

  console.log('\n📋 Summary:');
  console.log(
    '- If OpenAI shows "quota exceeded" but you can use it elsewhere, the API key belongs to a different account',
  );
  console.log(
    '- If Grok shows "invalid API key", you need to get a valid key from https://console.x.ai',
  );
  console.log(
    "- Check your .env file and make sure you're using the correct API keys for the accounts you want to use",
  );
}

main().catch(console.error);
