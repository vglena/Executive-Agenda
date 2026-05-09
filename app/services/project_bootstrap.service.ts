// Project Bootstrap Service
// Orchestrates the conversion of an agent-generated roadmap into an
// operational project registered in memory and (optionally) synced to ClickUp.
//
// This service does NOT make intelligent decisions.
// It executes the plan already defined by the planning_agent.

import { createTask } from "../integrations/clickup/task.service";
import type {
  TaskPriority,
  CreateTaskInput,
} from "../integrations/clickup/types";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type ProjectPriority = "P1" | "P2" | "P3" | "P4";

export interface MilestoneInput {
  name: string;
  date: string; // YYYY-MM-DD
  phase: string; // e.g. "F1"
}

export interface TaskInput {
  name: string;
  description?: string;
  phase: string; // e.g. "F1"
  area?: string;
  priority: ProjectPriority;
  due_date?: string; // YYYY-MM-DD
  start_date?: string; // YYYY-MM-DD
  depends_on?: string | null; // task name it depends on
  send_to_clickup: boolean;
}

export interface PhaseInput {
  id: string; // e.g. "F1"
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

export interface RiskInput {
  title: string;
  description: string;
  severity: "Bajo" | "Medio" | "Alto" | "Crítico";
  probability: "Baja" | "Media" | "Alta";
  mitigation?: string;
}

export interface ProjectInput {
  project_name: string;
  project_description: string;
  objective: string;
  priority: ProjectPriority;
  start_date: string; // YYYY-MM-DD
  target_date: string; // YYYY-MM-DD | "TBD"
  phases: PhaseInput[];
  milestones: MilestoneInput[];
  tasks: TaskInput[];
  risks?: RiskInput[];
  // ClickUp identifiers — all optional; sync is skipped if list_id is absent
  clickup_space_id?: string | null;
  clickup_folder_id?: string | null;
  clickup_list_id?: string | null;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface TaskResult {
  task_name: string;
  phase: string;
  destination: "clickup" | "memory";
  clickup_id: string | null;
  clickup_url: string | null;
  error: string | null;
}

export interface BootstrapSummary {
  project_id: string;
  project_name: string;
  success: boolean;
  tasks_total: number;
  tasks_in_clickup: number;
  tasks_in_memory_only: number;
  tasks_failed: number;
  milestones_count: number;
  risks_count: number;
  warnings: string[];
  errors: string[];
  task_results: TaskResult[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProjectInput(input: ProjectInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.project_name?.trim()) {
    errors.push("project_name is required and cannot be empty.");
  }

  if (!input.objective?.trim()) {
    errors.push("objective is required and cannot be empty.");
  }

  if (!input.phases || input.phases.length < 2) {
    errors.push("At least 2 phases are required.");
  }

  if (!input.tasks || input.tasks.length === 0) {
    errors.push("At least one task is required.");
  }

  if (input.target_date !== "TBD") {
    const parsed = Date.parse(input.target_date);
    if (isNaN(parsed)) {
      errors.push(`target_date "${input.target_date}" is not a valid date (use YYYY-MM-DD or "TBD").`);
    }
  } else {
    warnings.push("target_date is TBD — phases will have approximate dates.");
  }

  const phase1Tasks = input.tasks.filter((t) => t.phase === "F1");
  if (phase1Tasks.length === 0) {
    errors.push("No tasks found for phase F1. At least one F1 task is required to bootstrap.");
  }

  const clickupTasks = input.tasks.filter((t) => t.send_to_clickup);
  if (clickupTasks.length > 0 && !input.clickup_list_id) {
    warnings.push(
      `${clickupTasks.length} task(s) marked send_to_clickup=true but clickup_list_id is not set. ` +
        "These tasks will be stored in memory only."
    );
  }

  if (input.tasks.length > 30) {
    warnings.push(
      `Roadmap has ${input.tasks.length} tasks — consider simplifying to avoid overplanning.`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Generate the next PRJ-XXX ID by reading the highest number already present. */
function generateProjectId(existingIds: string[]): string {
  let max = 0;
  for (const id of existingIds) {
    const match = id.match(/^PRJ-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return `PRJ-${String(max + 1).padStart(3, "0")}`;
}

/** Normalize project name: Title Case, no double spaces, no special characters except hyphens and parentheses. */
function normalizeProjectName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\-()]/g, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert YYYY-MM-DD to Unix timestamp in milliseconds. Returns undefined if invalid. */
function toTimestampMs(date: string | undefined): number | undefined {
  if (!date) return undefined;
  const ts = Date.parse(date);
  return isNaN(ts) ? undefined : ts;
}

/** Map internal P1-P4 priority to ClickUp numeric priority. */
function mapPriority(p: ProjectPriority): TaskPriority {
  const map: Record<ProjectPriority, TaskPriority> = {
    P1: 1,
    P2: 2,
    P3: 3,
    P4: 4,
  };
  return map[p];
}

/** Generate a sequential DEC-XXX ID. */
function generateDecisionId(existingCount: number): string {
  return `DEC-${String(existingCount + 1).padStart(3, "0")}`;
}

/** Generate a sequential RR-XXX ID. */
function generateRiskId(existingCount: number): string {
  return `RR-${String(existingCount + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// createInitialTasks
// ---------------------------------------------------------------------------

export interface CreateInitialTasksResult {
  results: TaskResult[];
  errors: string[];
  warnings: string[];
}

/**
 * Create Phase 1 tasks in ClickUp (if list_id is available) and build
 * the result list for all tasks.
 *
 * Only tasks with send_to_clickup=true AND a valid list_id go to ClickUp.
 * All other tasks are marked as memory-only.
 */
export async function createInitialTasks(
  tasks: TaskInput[],
  listId: string | null | undefined
): Promise<CreateInitialTasksResult> {
  const results: TaskResult[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const task of tasks) {
    const shouldSync = task.send_to_clickup && !!listId;

    if (!shouldSync) {
      if (task.send_to_clickup && !listId) {
        warnings.push(
          `Task "${task.name}" is marked for ClickUp but no list_id is available — stored in memory only.`
        );
      }
      results.push({
        task_name: task.name,
        phase: task.phase,
        destination: "memory",
        clickup_id: null,
        clickup_url: null,
        error: null,
      });
      continue;
    }

    const payload: CreateTaskInput = {
      name: task.name,
      description: task.description,
      priority: mapPriority(task.priority),
      status: "pendiente",
      due_date: toTimestampMs(task.due_date),
      start_date: toTimestampMs(task.start_date),
    };

    try {
      const created = await createTask(listId!, payload);
      results.push({
        task_name: task.name,
        phase: task.phase,
        destination: "clickup",
        clickup_id: created.id,
        clickup_url: created.url,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to create task "${task.name}" in ClickUp: ${message}`);
      results.push({
        task_name: task.name,
        phase: task.phase,
        destination: "memory",
        clickup_id: null,
        clickup_url: null,
        error: message,
      });
    }
  }

  return { results, errors, warnings };
}

// ---------------------------------------------------------------------------
// registerProjectMemory
// ---------------------------------------------------------------------------

/**
 * Build the Markdown block for active_projects.md.
 * This is returned as a string — writing to disk is the caller's responsibility
 * (or the agent's, depending on the runtime environment).
 */
export function buildActiveProjectBlock(
  input: ProjectInput,
  projectId: string,
  taskResults: TaskResult[]
): string {
  const today = input.start_date;

  const phasesBlock = input.phases
    .map((p) => `- **${p.id} — ${p.name}**: ${p.start_date} → ${p.end_date}`)
    .join("\n");

  const milestonesBlock = input.milestones
    .map((m) => `- [ ] ${m.name} — ${m.date} — ${m.phase}`)
    .join("\n");

  const taskRows = taskResults
    .map((r) => {
      const task = input.tasks.find((t) => t.name === r.task_name);
      return `| ${r.task_name} | ${r.phase} | ${task?.priority ?? "P3"} | ${task?.due_date ?? "TBD"} | pendiente | ${r.clickup_id ?? "null"} |`;
    })
    .join("\n");

  const syncedCount = taskResults.filter((r) => r.destination === "clickup").length;
  const syncResult =
    syncedCount > 0
      ? `OK — ${syncedCount} tarea(s) sincronizada(s)`
      : "No sincronizado — clickup_list_id no disponible";

  return `
## ${normalizeProjectName(input.project_name)}

- **Project ID**: ${projectId}
- **Project Name**: ${normalizeProjectName(input.project_name)}
- **Description**: ${input.project_description}
- **Objective**: ${input.objective}
- **Status**: activo
- **Priority**: ${input.priority}
- **Start Date**: ${input.start_date}
- **Target Date**: ${input.target_date}
- **ClickUp Space ID**: ${input.clickup_space_id ?? "null"}
- **ClickUp Folder ID**: ${input.clickup_folder_id ?? "null"}
- **ClickUp List ID**: ${input.clickup_list_id ?? "null"}

### Main Milestones
${milestonesBlock}

### Phases
${phasesBlock}

### Active Tasks
| Task | Phase | Priority | Due Date | Status | ClickUp ID |
|------|-------|----------|----------|--------|------------|
${taskRows}

### Risks
- Sin riesgos registrados aún — ver risks_log.md (${projectId})

### Decisions
- ${today}: Proyecto creado.

### Next Actions
- [ ] ${input.tasks[0]?.name ?? "Iniciar primera tarea"} — ${input.tasks[0]?.due_date ?? "TBD"}

### Last Sync
- **Fecha**: ${syncedCount > 0 ? today : "null"}
- **Sincronizado por**: ${syncedCount > 0 ? "operations_agent" : "null"}
- **Resultado**: ${syncResult}
`.trimStart();
}

/**
 * Build the decisions_log.md entry for the project creation decision.
 */
export function buildDecisionEntry(
  input: ProjectInput,
  projectId: string,
  decisionId: string
): string {
  return `
### [${decisionId}] — Creación del proyecto ${normalizeProjectName(input.project_name)}
- **Fecha**: ${input.start_date}
- **Proyecto**: ${normalizeProjectName(input.project_name)} (${projectId})
- **Decisión**: Iniciar proyecto. Objetivo: ${input.objective}
- **Contexto**: Proyecto creado vía directives/new_project_creation.md + execution/project_creator.md
- **Alternativas consideradas**: null
- **Impacto esperado**: ${input.objective}
- **Estado**: activo
`.trimStart();
}

/**
 * Build the risks_log.md entries for all initial risks.
 */
export function buildRiskEntries(
  risks: RiskInput[],
  projectName: string,
  startingIndex: number,
  date: string
): string {
  if (risks.length === 0) return "";

  return risks
    .map((risk, i) => {
      const id = generateRiskId(startingIndex + i);
      return `
### [${id}] — ${risk.title}
- **Proyecto**: ${normalizeProjectName(projectName)}
- **Tarea relacionada**: null
- **Descripción**: ${risk.description}
- **Severidad**: ${risk.severity}
- **Probabilidad**: ${risk.probability}
- **Impacto si se materializa**: [por evaluar]
- **Plan de mitigación**:
  - [ ] ${risk.mitigation ?? "Definir plan de mitigación"}
- **Estado**: Abierto
- **Fecha detectado**: ${date}
`.trimStart();
    })
    .join("\n");
}

/**
 * Aggregates all memory blocks to register.
 * Returns structured strings — actual file I/O is handled by the caller.
 */
export interface MemoryRegistration {
  active_project_block: string;
  decision_entry: string;
  risk_entries: string;
  project_id: string;
  decision_id: string;
}

export function registerProjectMemory(
  input: ProjectInput,
  taskResults: TaskResult[],
  existingProjectIds: string[],
  existingDecisionCount: number,
  existingRiskCount: number
): MemoryRegistration {
  const projectId = generateProjectId(existingProjectIds);
  const decisionId = generateDecisionId(existingDecisionCount);

  const active_project_block = buildActiveProjectBlock(input, projectId, taskResults);
  const decision_entry = buildDecisionEntry(input, projectId, decisionId);
  const risk_entries = buildRiskEntries(
    input.risks ?? [],
    input.project_name,
    existingRiskCount,
    input.start_date
  );

  return { active_project_block, decision_entry, risk_entries, project_id: projectId, decision_id: decisionId };
}

// ---------------------------------------------------------------------------
// buildProjectSummary
// ---------------------------------------------------------------------------

export function buildProjectSummary(
  input: ProjectInput,
  projectId: string,
  taskResults: TaskResult[],
  validationWarnings: string[],
  taskWarnings: string[],
  taskErrors: string[]
): BootstrapSummary {
  const inClickUp = taskResults.filter((r) => r.destination === "clickup" && !r.error);
  const inMemory = taskResults.filter((r) => r.destination === "memory" && !r.error);
  const failed = taskResults.filter((r) => r.error !== null);

  return {
    project_id: projectId,
    project_name: normalizeProjectName(input.project_name),
    success: taskErrors.length === 0,
    tasks_total: taskResults.length,
    tasks_in_clickup: inClickUp.length,
    tasks_in_memory_only: inMemory.length,
    tasks_failed: failed.length,
    milestones_count: input.milestones.length,
    risks_count: input.risks?.length ?? 0,
    warnings: [...validationWarnings, ...taskWarnings],
    errors: taskErrors,
    task_results: taskResults,
  };
}

// ---------------------------------------------------------------------------
// bootstrapProject — main entry point
// ---------------------------------------------------------------------------

export interface BootstrapResult {
  success: boolean;
  summary: BootstrapSummary;
  memory: MemoryRegistration | null;
}

/**
 * Main orchestrator. Steps:
 * 1. Validate input
 * 2. Create Phase 1 tasks in ClickUp (if list_id available)
 * 3. Build memory registration blocks
 * 4. Return summary + memory content for the agent to persist
 *
 * This function does NOT write files — it returns the content to write.
 * File persistence is the responsibility of the operations_agent runtime.
 */
export async function bootstrapProject(
  input: ProjectInput,
  options: {
    existingProjectIds?: string[];
    existingDecisionCount?: number;
    existingRiskCount?: number;
  } = {}
): Promise<BootstrapResult> {
  // Step 1 — Validate
  const validation = validateProjectInput(input);

  if (!validation.valid) {
    const summary: BootstrapSummary = {
      project_id: "",
      project_name: input.project_name ?? "",
      success: false,
      tasks_total: 0,
      tasks_in_clickup: 0,
      tasks_in_memory_only: 0,
      tasks_failed: 0,
      milestones_count: 0,
      risks_count: 0,
      warnings: validation.warnings,
      errors: validation.errors,
      task_results: [],
    };
    return { success: false, summary, memory: null };
  }

  // Step 2 — Create tasks (Phase 1 only for ClickUp; all phases tracked in results)
  const phase1Tasks = input.tasks.filter((t) => t.phase === "F1");
  const otherTasks = input.tasks.filter((t) => t.phase !== "F1");

  const { results: phase1Results, errors: taskErrors, warnings: taskWarnings } =
    await createInitialTasks(phase1Tasks, input.clickup_list_id);

  // Non-F1 tasks are always memory-only at bootstrap
  const otherResults: TaskResult[] = otherTasks.map((t) => ({
    task_name: t.name,
    phase: t.phase,
    destination: "memory" as const,
    clickup_id: null,
    clickup_url: null,
    error: null,
  }));

  const allTaskResults = [...phase1Results, ...otherResults];

  // Step 3 — Build memory registration
  const memory = registerProjectMemory(
    input,
    allTaskResults,
    options.existingProjectIds ?? [],
    options.existingDecisionCount ?? 0,
    options.existingRiskCount ?? 0
  );

  // Step 4 — Build summary
  const summary = buildProjectSummary(
    input,
    memory.project_id,
    allTaskResults,
    validation.warnings,
    taskWarnings,
    taskErrors
  );

  return { success: summary.success, summary, memory };
}
