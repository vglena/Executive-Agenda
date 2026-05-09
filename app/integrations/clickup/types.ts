// ClickUp API v2 — Core Types

export type TaskStatus =
  | "pendiente"
  | "en progreso"
  | "bloqueado"
  | "en revisión"
  | "completado";

export type TaskPriority = 1 | 2 | 3 | 4; // 1=urgent, 2=high, 3=normal, 4=low

export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  profilePicture: string | null;
}

export interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
  statuses: ClickUpStatus[];
}

export interface ClickUpFolder {
  id: string;
  name: string;
  orderindex: number;
  override_statuses: boolean;
  hidden: boolean;
  space: { id: string; name: string };
  task_count: string;
}

export interface ClickUpList {
  id: string;
  name: string;
  orderindex: number;
  status: { status: string; color: string } | null;
  priority: { priority: string; color: string } | null;
  assignee: ClickUpUser | null;
  task_count: number;
  due_date: string | null;
  start_date: string | null;
  space: { id: string; name: string; access: boolean };
  folder: { id: string; name: string; hidden: boolean; access: boolean };
  permission_level: string;
}

export interface ClickUpStatus {
  status: string;
  color: string;
  type: string;
  orderindex: number;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description: string | null;
  status: ClickUpStatus;
  priority: { id: string; priority: string; color: string; orderindex: string } | null;
  due_date: string | null;
  start_date: string | null;
  date_created: string;
  date_updated: string;
  assignees: ClickUpUser[];
  tags: { name: string; tag_fg: string; tag_bg: string }[];
  list: { id: string; name: string; access: boolean };
  folder: { id: string; name: string; hidden: boolean; access: boolean };
  space: { id: string };
  url: string;
}

// Input types for creating/updating tasks

export interface CreateTaskInput {
  name: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  due_date?: number; // Unix timestamp in milliseconds
  start_date?: number;
  assignees?: number[];
  tags?: string[];
  notify_all?: boolean;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  due_date?: number;
  start_date?: number;
}

// Generic API response wrapper

export interface ClickUpApiError {
  err: string;
  ECODE: string;
}
