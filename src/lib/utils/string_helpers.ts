import { marked } from "marked";
import { mangle } from "marked-mangle";
import { gfmHeadingId } from "marked-gfm-heading-id";
import sanitizeHtml from "sanitize-html";

marked.use(mangle());
marked.use(gfmHeadingId())

export function markdownToPlaintext(markdownString: string, sanitizeHtmlOptions: sanitizeHtml.IOptions = { allowedTags: [], allowedAttributes: {} }) {
  return sanitizeHtml(marked.parse(markdownString ?? ""), sanitizeHtmlOptions);
}
