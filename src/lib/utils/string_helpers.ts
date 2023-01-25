import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export function markdownToPlaintext(markdownString: string, markedOptions: marked.MarkedOptions = {}, sanitizeHtmlOptions: sanitizeHtml.IOptions = { allowedTags: [], allowedAttributes: {} }) {
  return sanitizeHtml(marked.parse(markdownString, markedOptions), sanitizeHtmlOptions);
}
