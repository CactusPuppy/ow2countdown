import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export function markdownToPlaintext(markdownString: string, sanitizeHtmlOptions: sanitizeHtml.IOptions = { allowedTags: [], allowedAttributes: {} }) {
  return sanitizeHtml(marked.parse(markdownString ?? ""), sanitizeHtmlOptions);
}
