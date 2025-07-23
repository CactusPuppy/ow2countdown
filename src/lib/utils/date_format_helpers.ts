export type DiscordTimestampFlags = "d" | "D" | "t" | "T" | "f" | "F" | "R";
export function dateToDiscordTimestamp(date: Date, flags: DiscordTimestampFlags = "f"): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${flags}>`;
}
