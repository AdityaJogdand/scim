import type { SSGNode, SSG } from "../lib/types";

const TYPE_MAP: Record<string, SSGNode["type"]> = {
  A: "link",
  BUTTON: "button",
  INPUT: "input",
  SELECT: "select",
  TEXTAREA: "textarea",
  IMG: "image",
  H1: "heading", H2: "heading", H3: "heading", H4: "heading", H5: "heading", H6: "heading",
  UL: "list", OL: "list",
  TABLE: "table",
};

function isVisible(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getNodeType(el: Element): SSGNode["type"] {
  const role = el.getAttribute("role");
  if (role === "button") return "button";
  if (role === "link") return "link";
  if (role === "textbox") return "input";
  return TYPE_MAP[el.tagName] || "container";
}

function getTextContent(el: Element): string {
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    return (el as HTMLInputElement).value || (el as HTMLInputElement).placeholder || "";
  }
  if (el.tagName === "IMG") {
    return (el as HTMLImageElement).alt || "";
  }
  let text = "";
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent || "";
    }
  }
  return text.trim();
}

function getProperties(el: Element): Record<string, string> {
  const props: Record<string, string> = {};
  const attrs = ["id", "class", "role", "aria-label", "aria-describedby", "href", "type", "name", "placeholder", "value", "disabled", "checked", "selected"];
  for (const attr of attrs) {
    const val = el.getAttribute(attr);
    if (val) props[attr] = val;
  }
  return props;
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "META", "LINK", "HEAD"]);
const LEAF_TAGS = new Set(["INPUT", "IMG", "SELECT", "TEXTAREA", "BUTTON", "A", "H1", "H2", "H3", "H4", "H5", "H6"]);

// Store node ID → DOM element for direct access during execution
export const elementMap = new Map<string, Element>();

export function harvestDOM(): SSG {
  const nodes: SSGNode[] = [];
  elementMap.clear();
  let id = 0;

  function walk(el: Element) {
    if (SKIP_TAGS.has(el.tagName)) return;
    if (!isVisible(el)) return;

    const text = getTextContent(el);
    const isLeaf = LEAF_TAGS.has(el.tagName) || el.getAttribute("role");
    const hasText = text.length > 0;

    if (isLeaf || hasText) {
      const rect = el.getBoundingClientRect();
      const nodeId = `node_${id++}`;
      elementMap.set(nodeId, el);
      nodes.push({
        id: nodeId,
        type: getNodeType(el),
        text,
        bbox: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        properties: getProperties(el),
        sources: ["dom"],
      });
    }

    if (!LEAF_TAGS.has(el.tagName)) {
      for (const child of el.children) {
        walk(child);
      }
    }
  }

  walk(document.documentElement);

  return {
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    nodes,
  };
}
