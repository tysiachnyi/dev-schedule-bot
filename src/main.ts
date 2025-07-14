import fetch from 'node-fetch';
import { GistResponse, SlackMessage } from './types';
import { format, isGitHubActions, rotate } from './utils';
import { config } from 'dotenv';

// Only load .env file if not running in GitHub Actions
if (!process.env.GITHUB_ACTIONS) {
  config();
}

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL as string;
const AUTH_TOKEN = process.env.AUTH_TOKEN as string;
const GIST_ID = process.env.GIST_ID as string;
const GIST_FILE_NAME = process.env.GIST_FILE_NAME as string;

if (!SLACK_WEBHOOK_URL || !AUTH_TOKEN || !GIST_ID || !GIST_FILE_NAME) {
  console.error('❌ Missing environment variables:');
  console.error(
    'SLACK_WEBHOOK_URL:',
    SLACK_WEBHOOK_URL ? '✅ Set' : '❌ Missing'
  );
  console.error('AUTH_TOKEN:', AUTH_TOKEN ? '✅ Set' : '❌ Missing');
  console.error('GIST_ID:', GIST_ID ? '✅ Set' : '❌ Missing');
  console.error('GIST_FILE_NAME:', GIST_FILE_NAME ? '✅ Set' : '❌ Missing');
  throw new Error('❌ Missing required environment variables.');
}

async function loadDevs(): Promise<string[]> {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${AUTH_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error(`❌ Failed to load developers: ${response.statusText}`);
  }

  const gist: GistResponse = (await response.json()) as GistResponse;
  const content = gist.files[GIST_FILE_NAME].content;
  return JSON.parse(content) as string[];
}

async function save(devs: string[]): Promise<void> {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILE_NAME]: {
          content: JSON.stringify(devs, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`❌ Failed to save developers: ${response.statusText}`);
  }
}

async function postSlack(text: string): Promise<void> {
  const body: SlackMessage = { text: `👨‍💻 *Weekly Dev Schedule*\n\n${text}` };
  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Slack error: ${res.statusText}`);
  console.log('✅ Posted to Slack successfully');
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting dev schedule rotation...');

    const devs: string[] = await loadDevs();
    console.log('Current developers:', devs);

    const rotated: string[] = rotate(devs);
    console.log('Rotated order:', rotated);

    const message: string = format(rotated);
    console.log('Formatted message:', message);

    if (isGitHubActions()) {
      await postSlack(message);
      await save(rotated);
      console.log('✅ Posted and saved new order (GitHub Actions)');
    } else {
      console.log('✅ local run - no save');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch((error: Error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
