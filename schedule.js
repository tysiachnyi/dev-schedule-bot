const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const devFile = path.join(__dirname, "developers.json");

function loadDevs() {
  const raw = fs.readFileSync(devFile, "utf8");
  return JSON.parse(raw);
}

function rotate(devs) {
  return [...devs.slice(1), devs[0]];
}

function save(devs) {
  fs.writeFileSync(devFile, JSON.stringify(devs, null, 2));
}

function format(devs) {
  return devs.map((d, i) => `${i + 1}. ${d}`).join("\n");
}

async function postSlack(text) {
  const body = { text: `👨‍💻 *Weekly Dev Schedule*\n\n${text}` };
  const res = await fetch(slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Slack error: ${res.statusText}`);
}

async function main() {
  const devs = loadDevs();
  const rotated = rotate(devs);
  const message = format(rotated);
  await postSlack(message);
  save(rotated);
  console.log("✅ Posted and saved new order");
}

main().catch(console.error);
