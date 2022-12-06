export function titleToSlug(title: string) {
  return title.toLowerCase()
    .replace(/\[.*?\]/g, "")       // REMOVE STATUS MESSAGES
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/ +/g, "-");
}
