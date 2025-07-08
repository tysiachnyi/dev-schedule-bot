This is simple slack bot that posts a message with the order of developers who will be on duty in the next week.
It uses GitHub Gist to store the list of developers and their schedules, and it posts the message to a Slack channel using a webhook.
It is designed to run weekly, and it can be configured with environment variables for the GitHub token, Gist ID, Slack webhook URL, and the name of the Gist file.

## Setup

1. Create a GitHub Gist with the list of developers and their schedules in JSON format
2. Create a Slack webhook URL for the channel where you want to post the message
3. Create a Repository secrets in the Github with the following variables:

```bash
    AUTH_TOKEN=your_github_token
    GIST_ID=your_gist_id
    SLACK_WEBHOOK_URL=your_slack_webhook_url
    GIST_FILE_NAME=your_gist_file_name (default: developers.json)
```

## Usage

The bot will fetch the list of developers from the Gist, rotate the order, format the message, and post it to the Slack channel. It will also save the new order back to the Gist.
