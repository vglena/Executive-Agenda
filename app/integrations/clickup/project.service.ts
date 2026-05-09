// Project Service
// Read operations for ClickUp workspace structure: Spaces, Folders, Lists.

import { clickupGet } from "./client";
import { clickupConfig } from "./auth";
import type { ClickUpSpace, ClickUpFolder, ClickUpList } from "./types";

/**
 * Get all Spaces in the configured team.
 * Requires CLICKUP_TEAM_ID to be set in environment.
 * @returns Array of spaces.
 */
export async function getSpaces(): Promise<ClickUpSpace[]> {
  if (!clickupConfig.teamId) {
    throw new Error(
      "CLICKUP_TEAM_ID is not set. Add it to your .env file."
    );
  }

  const response = await clickupGet<{ spaces: ClickUpSpace[] }>(
    `/team/${clickupConfig.teamId}/space`,
    { archived: "false" }
  );

  return response.spaces;
}

/**
 * Get all Folders inside a Space.
 * @param spaceId  The ClickUp space ID.
 * @returns        Array of folders.
 */
export async function getFolders(spaceId: string): Promise<ClickUpFolder[]> {
  const response = await clickupGet<{ folders: ClickUpFolder[] }>(
    `/space/${spaceId}/folder`,
    { archived: "false" }
  );

  return response.folders;
}

/**
 * Get all Lists inside a Folder.
 * @param folderId  The ClickUp folder ID.
 * @returns         Array of lists.
 */
export async function getLists(folderId: string): Promise<ClickUpList[]> {
  const response = await clickupGet<{ lists: ClickUpList[] }>(
    `/folder/${folderId}/list`,
    { archived: "false" }
  );

  return response.lists;
}

/**
 * Get all folderless Lists directly inside a Space.
 * Useful when lists are not organized inside folders.
 * @param spaceId  The ClickUp space ID.
 * @returns        Array of lists.
 */
export async function getFolderlessLists(spaceId: string): Promise<ClickUpList[]> {
  const response = await clickupGet<{ lists: ClickUpList[] }>(
    `/space/${spaceId}/list`,
    { archived: "false" }
  );

  return response.lists;
}
