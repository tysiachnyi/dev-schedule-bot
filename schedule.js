import fetch from "node-fetch";

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const githubToken = process.env.GITHUB_TOKEN;
const gistId = process.env.GIST_ID;
const gistFileName = process.env.GIST_FILE_NAME;

async function loadDevs() {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `token ${githubToken}` },
  });
  const gist = await response.json();
  const content = gist.files[gistFileName].content;
  return JSON.parse(content);
}

function rotate(devs) {
  return [...devs.slice(1), devs[0]];
}

async function save(devs) {
  await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        "developers.json": {
          content: JSON.stringify(devs, null, 2),
        },
      },
    }),
  });
}

function format(devs) {
  return devs.map((d, i) => `${i + 1}. ${d}`).join("\n");
}

async function postSlack(text) {
  const body = { text: `👨‍💻 *Weekly Dev Schedule*\n\n${text}` };
  if (process.env.GITHUB_ACTIONS) {
    const res = await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Slack error: ${res.statusText}`);
  } else {
    console.log("Skipping Slack post in local environment");
    console.log(body);
  }
}

async function main() {
  const devs = await loadDevs();
  const rotated = rotate(devs);
  const message = format(rotated);
  await postSlack(message);
  save(rotated);
  console.log("✅ Posted and saved new order");
}

main().catch(console.error);
