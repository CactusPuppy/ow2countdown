import { differenceInSeconds, set } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function timeDiff(date1: Date, date2: Date) {
  const diff = differenceInSeconds(date1, date2);

  if (!diff) return null;

  const sign = diff > 0 ? "+" : "-";
  const absSecs = Math.abs(diff);

  const vals = [
    [Math.floor(absSecs / 3600), "h"],
    [Math.floor((absSecs % 3600) / 60), "m"],
    [absSecs % 60, "s"],
  ];

  const strings = vals.filter(([v]) => v).map(([v, l]) => `${v}${l}`);

  return `${sign}${strings.join(" ")}`;
}

export function toLosAngelesDate(date: Date | string, timeZone: string) {
  date = date instanceof Date ? date : new Date(date);

  if (isNaN(date.getTime())) return null;

  const losAngelesDate = toZonedTime(
    fromZonedTime(date, timeZone),
    "America/Los_Angeles",
  );

  const patchTime = set(losAngelesDate, {
    hours: 11,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  return {
    date: losAngelesDate,
    patchTime: patchTime,
    diff: timeDiff(losAngelesDate, patchTime),
  };
}

export function getTimeZoneInfo(timeZone: string, date: Date) {
  const timeZoneOptions: Intl.DateTimeFormatOptions["timeZoneName"][] = [
    "shortGeneric",
    "shortOffset",
  ];

  let [generic, offset] = timeZoneOptions.map((option) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: option,
    });

    return formatter.formatToParts(date).find((p) => p.type === "timeZoneName")
      ?.value;
  });

  // Extract continent/ocean and city
  let [continent, ...rest] = timeZone.replaceAll("_", " ").split("/");
  const city = rest.join("/") || continent;

  // "Etc" and "UTC" aren't continents or oceans, so group them under "Other"
  if (["etc", "utc"].includes(continent.toLowerCase())) continent = "Other";

  // "<COUNTRY> Time" isn't really a shorthand, and skip displaying duped GMT names...
  const shorthand =
    generic?.endsWith("Time") || generic?.startsWith("GMT") ? null : generic;

  // Skip offset for GMT time zones because of duplicated info
  if (city?.startsWith("GMT")) offset = "";

  let details = `${[shorthand, offset].filter(Boolean).join(", ")}`;
  if (details) details = ` (${details})`;
  const pretty = `${city}${details}`;

  return {
    name: timeZone,
    shorthand,
    offset,
    generic,
    continent,
    city,
    pretty,
  };
}

export function getTimeZones(date: Date) {
  const timeZones = Intl.supportedValuesOf("timeZone");

  // Some browsers return an "UTC" time zone - since we need it for older events, forcefully add it for browsers that do not return it.
  // Browsers that do not return it will still support it just fine.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf#browser_compatibility
  if (!timeZones.includes("UTC")) timeZones.push("UTC");

  return timeZones.map((i) => getTimeZoneInfo(i, date));
}

export function getGroupedTimeZones(date: Date | string) {
  let _date = typeof date === "string" ? new Date(date) : date;
  if (isNaN(_date.getTime())) _date = new Date();

  const timeZones = getTimeZones(_date);
  const grouped = Object.groupBy(timeZones, ({ continent }) => continent);

  // add user's and Blizzard campus time zones to separate group and promote them to top
  grouped["Special"] = [
    getTimeZoneInfo(getUserTimeZone(), _date),
    getTimeZoneInfo("America/Los_Angeles", _date),
  ];

  return Object.entries(grouped).sort(([a], [b]) =>
    a == "Special" ? -2 : b == "Special" ? 2 : a < b ? -1 : a > b ? 1 : 0,
  );
}
