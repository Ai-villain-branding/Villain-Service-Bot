# Slack Project Kickoff App

This is a Slack app built with Bolt for JavaScript. It launches a multi-step modal form for project kickoff using the `/service` command. The app collects project details and, for Messaging projects, gathers additional requirements, then sends the data to an n8n webhook for further automation.

## Features
- Launch a modal with `/service` to start a new project
- Step 1: Select a project type (Architecture, Copywriting, Messaging, Naming, Research, Strategy, Visual Design, Voice, Web Design)
- Step 2: If 'Messaging' is selected, fill out a detailed form:
  - Complexity Level
  - Number of client materials to review
  - Number of competitors to analyze
  - Strategy session duration
  - Number of review rounds
- Data is sent to an n8n webhook for processing

## Setup

1. **Clone the repo and install dependencies:**
   ```bash
   npm install
   ```

2. **Create a Slack App:**
   - Go to https://api.slack.com/apps and create a new app
   - Enable Socket Mode and add the following scopes:
     - `commands`
     - `chat:write`
     - `users:read`
     - `users:read.email`
     - `app_mentions:read`
     - `im:history`
     - `im:write`
     - `im:read`
     - `channels:read`
     - `groups:read`
     - `mpim:read`
   - Add a Slash Command `/service` pointing to your app

3. **Set environment variables:**
   Create a `.env` file in the root directory with:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-level-token
   PORT=3000
   ```

4. **Run the app:**
   ```bash
   node app.js
   ```

5. **Invite the bot to your Slack workspace and use `/service`**

## Webhook Integration
- When a Messaging project is submitted, the app sends the collected data to an n8n webhook:
  - `https://n8n.sitepreviews.dev/webhook/3cee73bb-dda9-4adb-8b5c-f3b9c383115e`
- You can change the webhook URL in `app.js` as needed.

## Customization
- To add more project types or custom modals, edit `app.js`.
- To change the webhook or add more automation, update the webhook URL or logic in the submission handler.

---
Built with [Bolt for JavaScript](https://slack.dev/bolt-js/) 
