import DOMPurify from "dompurify";
import { marked } from "marked";

/**
 * Parse markdown into HTML
 * @param md The markdown to parse
 * @returns The compiled HTML
 */
export function parseMd(md: string) {
  return DOMPurify.sanitize(marked.parse(md, { async: false }));
}
