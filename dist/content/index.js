// src/content/harvester.ts
var TYPE_MAP = {
  A: "link",
  BUTTON: "button",
  INPUT: "input",
  SELECT: "select",
  TEXTAREA: "textarea",
  IMG: "image",
  H1: "heading",
  H2: "heading",
  H3: "heading",
  H4: "heading",
  H5: "heading",
  H6: "heading",
  UL: "list",
  OL: "list",
  TABLE: "table"
};
function isVisible(el) {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
function getNodeType(el) {
  const role = el.getAttribute("role");
  if (role === "button") return "button";
  if (role === "link") return "link";
  if (role === "textbox") return "input";
  return TYPE_MAP[el.tagName] || "container";
}
function getTextContent(el) {
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    return el.value || el.placeholder || "";
  }
  if (el.tagName === "IMG") {
    return el.alt || "";
  }
  let text = "";
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent || "";
    }
  }
  return text.trim();
}
function getProperties(el) {
  const props = {};
  const attrs = ["id", "class", "role", "aria-label", "aria-describedby", "href", "type", "name", "placeholder", "value", "disabled", "checked", "selected"];
  for (const attr of attrs) {
    const val = el.getAttribute(attr);
    if (val) props[attr] = val;
  }
  return props;
}
var SKIP_TAGS = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "META", "LINK", "HEAD"]);
var LEAF_TAGS = /* @__PURE__ */ new Set(["INPUT", "IMG", "SELECT", "TEXTAREA", "BUTTON", "A", "H1", "H2", "H3", "H4", "H5", "H6"]);
function harvestDOM() {
  const nodes = [];
  let id = 0;
  function walk(el) {
    if (SKIP_TAGS.has(el.tagName)) return;
    if (!isVisible(el)) return;
    const text = getTextContent(el);
    const isLeaf = LEAF_TAGS.has(el.tagName) || el.getAttribute("role");
    const hasText = text.length > 0;
    if (isLeaf || hasText) {
      const rect = el.getBoundingClientRect();
      nodes.push({
        id: `node_${id++}`,
        type: getNodeType(el),
        text,
        bbox: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        properties: getProperties(el),
        sources: ["dom"]
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
    nodes
  };
}

// src/content/executor.ts
function findElement(ssg, nodeId) {
  const node = ssg.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const x = node.bbox.x + node.bbox.width / 2;
  const y = node.bbox.y + node.bbox.height / 2;
  return document.elementFromPoint(x, y);
}
var lastSSG = null;
function setLastSSG(ssg) {
  lastSSG = ssg;
}
function executeAction(plan) {
  if (!lastSSG) return { success: false, error: "No SSG available" };
  if (plan.action.type === "done") return { success: true };
  if (plan.action.type === "wait") return { success: true };
  const target = plan.action.target;
  if (!target) return { success: false, error: "No target specified" };
  const el = findElement(lastSSG, target);
  if (!el) return { success: false, error: `Element not found for ${target}` };
  switch (plan.action.type) {
    case "click":
      el.click();
      return { success: true };
    case "type": {
      const input = el;
      input.focus();
      input.value = plan.action.value || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return { success: true };
    }
    case "select": {
      const select = el;
      select.value = plan.action.value || "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return { success: true };
    }
    case "scroll":
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return { success: true };
    default:
      return { success: false, error: `Unknown action type: ${plan.action.type}` };
  }
}

// src/content/index.ts
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "harvest") {
    const ssg = harvestDOM();
    setLastSSG(ssg);
    sendResponse({ type: "harvest_result", ssg });
  } else if (msg.type === "execute") {
    const result = executeAction(msg.plan);
    sendResponse({ type: "execute_result", ...result });
  }
  return true;
});
