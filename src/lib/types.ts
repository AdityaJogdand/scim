export interface SSGNode {
  id: string;
  type: "link" | "button" | "input" | "text" | "image" | "heading" | "list" | "table" | "container" | "select" | "textarea";
  text: string;
  bbox: { x: number; y: number; width: number; height: number };
  properties: Record<string, string>;
  sources: string[];
}

export interface SSG {
  url: string;
  title: string;
  timestamp: number;
  nodes: SSGNode[];
}

export interface ActionPlan {
  action: {
    type: "click" | "type" | "select" | "scroll" | "wait" | "done";
    target?: string;
    value?: string;
  };
  reasoning: string;
}

export interface PlanRequest {
  task: string;
  ssg: SSG;
}

export type ScrimMessage =
  | { type: "harvest" }
  | { type: "harvest_result"; ssg: SSG }
  | { type: "execute"; plan: ActionPlan }
  | { type: "execute_result"; success: boolean; error?: string }
  | { type: "run_task"; task: string };
