// Task Service
// CRUD operations for ClickUp tasks.

import { clickupGet, clickupPost, clickupPut } from "./client";
import type { ClickUpTask, CreateTaskInput, UpdateTaskInput } from "./types";

/**
 * Create a new task inside a ClickUp list.
 * @param listId  The ClickUp list ID where the task will be created.
 * @param input   Task fields.
 * @returns       The created task.
 */
export async function createTask(
  listId: string,
  input: CreateTaskInput
): Promise<ClickUpTask> {
  return clickupPost<ClickUpTask>(`/list/${listId}/task`, input);
}

/**
 * Update the status of an existing task.
 * @param taskId  The ClickUp task ID.
 * @param status  New status string (must match a valid status in the list).
 * @returns       The updated task.
 */
export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<ClickUpTask> {
  return clickupPut<ClickUpTask>(`/task/${taskId}`, { status });
}

/**
 * Update one or more fields of an existing task.
 * @param taskId  The ClickUp task ID.
 * @param input   Fields to update.
 * @returns       The updated task.
 */
export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<ClickUpTask> {
  return clickupPut<ClickUpTask>(`/task/${taskId}`, input);
}

/**
 * Retrieve a single task by ID.
 * @param taskId  The ClickUp task ID.
 * @returns       The task.
 */
export async function getTask(taskId: string): Promise<ClickUpTask> {
  return clickupGet<ClickUpTask>(`/task/${taskId}`);
}

/**
 * List tasks in a ClickUp list.
 * @param listId   The ClickUp list ID.
 * @param options  Optional query params (page, order_by, etc.).
 * @returns        Array of tasks.
 */
export async function listTasks(
  listId: string,
  options?: {
    page?: number;
    order_by?: string;
    reverse?: boolean;
    include_closed?: boolean;
  }
): Promise<ClickUpTask[]> {
  const params: Record<string, string> = {};

  if (options?.page !== undefined) params.page = String(options.page);
  if (options?.order_by) params.order_by = options.order_by;
  if (options?.reverse !== undefined) params.reverse = String(options.reverse);
  if (options?.include_closed !== undefined)
    params.include_closed = String(options.include_closed);

  const response = await clickupGet<{ tasks: ClickUpTask[] }>(
    `/list/${listId}/task`,
    params
  );

  return response.tasks;
}
