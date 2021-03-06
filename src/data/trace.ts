import { strStartsWith } from "../common/string/starts-with";
import { OpenPeerPower, Context } from "../types";
import {
  BlueprintAutomationConfig,
  ManualAutomationConfig,
} from "./automation";

interface BaseTraceStep {
  path: string;
  timestamp: string;
  error?: string;
  changed_variables?: Record<string, unknown>;
}

export interface TriggerTraceStep extends BaseTraceStep {
  changed_variables: {
    trigger: {
      description: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export interface ConditionTraceStep extends BaseTraceStep {
  result?: { result: boolean };
}

export interface CallServiceActionTraceStep extends BaseTraceStep {
  result?: {
    limit: number;
    running_script: boolean;
    params: Record<string, unknown>;
  };
  child_id?: {
    domain: string;
    item_id: string;
    run_id: string;
  };
}

export interface ChooseActionTraceStep extends BaseTraceStep {
  result?: { choice: number | "default" };
}

export interface ChooseChoiceActionTraceStep extends BaseTraceStep {
  result?: { result: boolean };
}

export type ActionTraceStep =
  | BaseTraceStep
  | ConditionTraceStep
  | CallServiceActionTraceStep
  | ChooseActionTraceStep
  | ChooseChoiceActionTraceStep;

export interface AutomationTrace {
  domain: string;
  item_id: string;
  last_step: string | null;
  run_id: string;
  state: "running" | "stopped" | "debugged";
  timestamp: {
    start: string;
    finish: string | null;
  };
  script_execution:
    | // The script was not executed because the automation's condition failed
    "failed_conditions"
    // The script was not executed because the run mode is single
    | "failed_single"
    // The script was not executed because max parallel runs would be exceeded
    | "failed_max_runs"
    // All script steps finished:
    | "finished"
    // Script execution stopped by the script itself because a condition fails, wait_for_trigger timeouts etc:
    | "aborted"
    // Details about failing condition, timeout etc. is in the last element of the trace
    // Script execution stops because of an unexpected exception:
    | "error"
    // The exception is in the trace itself or in the last element of the trace
    // Script execution stopped by async_stop called on the script run because open peer power is shutting down, script mode is SCRIPT_MODE_RESTART etc:
    | "cancelled";
  // Automation only, should become it's own type when we support script in frontend
  trigger: string;
}

export interface AutomationTraceExtended extends AutomationTrace {
  trace: Record<string, ActionTraceStep[]>;
  context: Context;
  config: ManualAutomationConfig;
  blueprint_inputs?: BlueprintAutomationConfig;
  error?: string;
}

interface TraceTypes {
  automation: {
    short: AutomationTrace;
    extended: AutomationTraceExtended;
  };
}

export const loadTrace = <T extends keyof TraceTypes>(
  opp: OpenPeerPower,
  domain: T,
  item_id: string,
  run_id: string
): Promise<TraceTypes[T]["extended"]> =>
  opp.callWS({
    type: "trace/get",
    domain,
    item_id,
    run_id,
  });

export const loadTraces = <T extends keyof TraceTypes>(
  opp: OpenPeerPower,
  domain: T,
  item_id: string
): Promise<Array<TraceTypes[T]["short"]>> =>
  opp.callWS({
    type: "trace/list",
    domain,
    item_id,
  });

export type TraceContexts = Record<
  string,
  { run_id: string; domain: string; item_id: string }
>;

export const loadTraceContexts = (
  opp: OpenPeerPower,
  domain?: string,
  item_id?: string
): Promise<TraceContexts> =>
  opp.callWS({
    type: "trace/contexts",
    domain,
    item_id,
  });

export const getDataFromPath = (
  config: ManualAutomationConfig,
  path: string
): any => {
  const parts = path.split("/").reverse();

  let result: any = config;

  while (parts.length) {
    const raw = parts.pop()!;
    const asNumber = Number(raw);

    if (isNaN(asNumber)) {
      result = result[raw];
      continue;
    }

    if (Array.isArray(result)) {
      result = result[asNumber];
      continue;
    }

    if (asNumber !== 0) {
      throw new Error("If config is not an array, can only return index 0");
    }
  }

  return result;
};

// It is 'trigger' if manually triggered by the user via UI
export const isTriggerPath = (path: string): boolean =>
  path === "trigger" || strStartsWith(path, "trigger/");

export const getTriggerPathFromTrace = (
  steps: Record<string, BaseTraceStep[]>
): string | undefined => Object.keys(steps).find((path) => isTriggerPath(path));
