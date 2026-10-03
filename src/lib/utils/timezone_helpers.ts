export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getTimeZoneInfo(timeZone: string) {
  const timeZoneOptions: Intl.DateTimeFormatOptions["timeZoneName"][] = [
    "shortGeneric",
    "shortOffset",
  ];

  let [generic, offset] = timeZoneOptions.map((option) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: option,
    });

    return formatter
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
  });

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

export function getTimeZones() {
  const timeZones = Intl.supportedValuesOf("timeZone");

  // Some browsers return an "UTC" time zone - since we need it for older events, forcefully add it for browsers that do not return it.
  // Browsers that do not return it will still support it just fine.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf#browser_compatibility
  if (!timeZones.includes("UTC")) timeZones.push("UTC");

  return timeZones.map(getTimeZoneInfo);
}

export function getGroupedTimeZones() {
  const timeZones = getTimeZones();
  const grouped = Object.groupBy(timeZones, ({ continent }) => continent);

  // add user's and Blizzard campus time zones to separate group and promote them to top
  grouped["Special"] = [
    getTimeZoneInfo(getUserTimeZone()),
    getTimeZoneInfo("America/Los_Angeles"),
  ];

  return Object.entries(grouped).sort(([a], [b]) =>
    a == "Special" ? -2 : b == "Special" ? 2 : a < b ? -1 : a > b ? 1 : 0,
  );
}
