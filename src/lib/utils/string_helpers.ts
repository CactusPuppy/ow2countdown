import { marked } from "marked";
import type { MarkedOptions } from "marked";
import sanitizeHtml from "sanitize-html";

export function markdownToPlaintext(markdownString: string, markedOptions: MarkedOptions = {}, sanitizeHtmlOptions: sanitizeHtml.IOptions = { allowedTags: [], allowedAttributes: {} }) {
  return sanitizeHtml(marked.parse(markdownString ?? "", { ...markedOptions, async: false }), sanitizeHtmlOptions);
}
