// ClickUp HTTP Client
// Reusable fetch wrapper for all ClickUp API v2 requests.

import { clickupConfig } from "./auth";
import type { ClickUpApiError } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

function buildHeaders(): HeadersInit {
  return {
    Authorization: clickupConfig.token,
    "Content-Type": "application/json",
  };
}

function buildUrl(path: string): string {
  // path should start with "/" e.g. "/list/123/task"
  return `${clickupConfig.baseUrl}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json();

  if (!response.ok) {
    const error = body as ClickUpApiError;
    throw new Error(
      `ClickUp API error ${response.status}: ${error.err ?? "Unknown error"} (${error.ECODE ?? "no code"})`
    );
  }

  return body as T;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`ClickUp request timed out after ${DEFAULT_TIMEOUT_MS}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Public API

export async function clickupGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(buildUrl(path));
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetchWithTimeout(url.toString(), {
    method: "GET",
    headers: buildHeaders(),
  });

  return parseResponse<T>(response);
}

export async function clickupPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function clickupPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}
