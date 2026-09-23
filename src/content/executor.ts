import type { ActionPlan } from "../lib/types";
import { elementMap } from "./harvester";

export function executeAction(plan: ActionPlan): { success: boolean; error?: string } {
  if (plan.action.type === "done") return { success: true };
  if (plan.action.type === "wait") return { success: true };

  const target = plan.action.target;
  if (!target) return { success: false, error: "No target specified" };

  const el = elementMap.get(target);
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
