export function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>?/gm, "");
  }
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
