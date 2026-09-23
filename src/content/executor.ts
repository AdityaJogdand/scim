import type { ActionPlan, SSG } from "../lib/types";

function findElement(ssg: SSG, nodeId: string): Element | null {
  const node = ssg.nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // Find element at the center of the bounding box
  const x = node.bbox.x + node.bbox.width / 2;
  const y = node.bbox.y + node.bbox.height / 2;
  return document.elementFromPoint(x, y);
}

let lastSSG: SSG | null = null;

export function setLastSSG(ssg: SSG) {
  lastSSG = ssg;
}

export function executeAction(plan: ActionPlan): { success: boolean; error?: string } {
  if (!lastSSG) return { success: false, error: "No SSG available" };
  if (plan.action.type === "done") return { success: true };
  if (plan.action.type === "wait") return { success: true };

  const target = plan.action.target;
  if (!target) return { success: false, error: "No target specified" };

  const el = findElement(lastSSG, target);
  if (!el) return { success: false, error: `Element not found for ${target}` };

  switch (plan.action.type) {
    case "click":
      (el as HTMLElement).click();
      return { success: true };

    case "type": {
      const input = el as HTMLInputElement;
      input.focus();
      input.value = plan.action.value || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return { success: true };
    }

    case "select": {
      const select = el as HTMLSelectElement;
      select.value = plan.action.value || "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return { success: true };
    }

    case "scroll":
      (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      return { success: true };

    default:
      return { success: false, error: `Unknown action type: ${plan.action.type}` };
  }
}
