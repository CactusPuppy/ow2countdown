export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getTimeZoneInfo(timeZone: string) {
  const timeZoneOptions: Intl.DateTimeFormatOptions["timeZoneName"][] = [
    "shortGeneric",
    "shortOffset",
  ];

  const [generic, offset] = timeZoneOptions.map((option) => {
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

  const pretty = `${city} (${[shorthand, offset].filter(Boolean).join(", ")})`;

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
  return Intl.supportedValuesOf("timeZone").map(getTimeZoneInfo);
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
