// ClickUp Authentication
// Loads and validates credentials from environment variables.

const token = process.env.CLICKUP_API_TOKEN;
const teamId = process.env.CLICKUP_TEAM_ID;

if (!token) {
  throw new Error(
    "CLICKUP_API_TOKEN is not set. Add it to your .env file.\n" +
    "Get your token at: https://app.clickup.com/settings/apps"
  );
}

export const clickupConfig = {
  token,
  teamId: teamId ?? null,
  baseUrl: "https://api.clickup.com/api/v2",
} as const;

export type ClickUpConfig = typeof clickupConfig;
