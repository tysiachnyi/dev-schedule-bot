import fetch from "node-fetch";

interface GistFile {
  content: string;
}

interface GistResponse {
  files: {
    [filename: string]: GistFile;
  };
}

interface SlackMessage {
  text: string;
}

const slackWebhookUrl: string = process.env.SLACK_WEBHOOK_URL!;
const authToken: string = process.env.AUTH_TOKEN!;
const gistId: string = process.env.GIST_ID!;
const gistFileName: string = process.env.GIST_FILE_NAME!;

function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === "true";
}

async function loadDevs(): Promise<string[]> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `token ${authToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load developers: ${response.statusText}`);
  }

  const gist: GistResponse = (await response.json()) as GistResponse;
  const content = gist.files[gistFileName].content;
  return JSON.parse(content) as string[];
}

function rotate(devs: string[]): string[] {
  return [...devs.slice(1), devs[0]];
}

async function save(devs: string[]): Promise<void> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [gistFileName]: {
          content: JSON.stringify(devs, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save developers: ${response.statusText}`);
  }
}

function format(devs: string[]): string {
  return devs.map((d: string, i: number) => `${i + 1}. ${d}`).join("\n");
}

async function postSlack(text: string): Promise<void> {
  const body: SlackMessage = { text: `👨‍💻 *Weekly Dev Schedule*\n\n${text}` };
  const res = await fetch(slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Slack error: ${res.statusText}`);
  console.log("✅ Posted to Slack successfully");
}

async function main(): Promise<void> {
  try {
    console.log("🚀 Starting dev schedule rotation...");

    const devs: string[] = await loadDevs();
    console.log("Current developers:", devs);

    const rotated: string[] = rotate(devs);
    console.log("Rotated order:", rotated);

    const message: string = format(rotated);
    console.log("Formatted message:", message);

    if (isGitHubActions()) {
      await postSlack(message);
      await save(rotated);
      console.log("✅ Posted and saved new order (GitHub Actions)");
    } else {
      console.log("local run - no save");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch((error: Error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
