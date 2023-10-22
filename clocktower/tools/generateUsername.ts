const clocktowerAdjectives = [
  "ancient",
  "atomic",
  "bimonthly",
  "biweekly",
  "brief",
  "chronological",
  "circular",
  "contemporary",
  "cosmic",
  "daily",
  "digital",
  "durable",
  "early",
  "ephemeral",
  "eternal",
  "fast",
  "fleeting",
  "future",
  "grandfatherly",
  "hourly",
  "immediate",
  "infinite",
  "instant",
  "intermittent",
  "irreversible",
  "linear",
  "mechanical",
  "medieval",
  "millennial",
  "momentary",
  "monthly",
  "nocturnal",
  "obsolete",
  "occasional",
  "past",
  "perpetual",
  "portable",
  "precise",
  "prehistoric",
  "present",
  "punctual",
  "quartz",
  "quick",
  "relative",
  "retro",
  "rhythmic",
  "sandy",
  "seasonal",
  "secular",
  "short-lived",
  "simultaneous",
  "slow",
  "solar",
  "sundial-esque",
  "synchronized",
  "temporal",
  "timely",
  "timeless",
  "ticking",
  "towering",
  "transient",
  "twilight",
  "twilit",
  "universal",
  "vintage",
  "yearly",
  "youthful",
  "hourglass-like",
  "measured",
  "unending",
  "finite",
  "analog",
  "stately",
  "elusive",
  "frozen",
  "flowing",
  "historic",
  "measurable",
  "predictable",
  "watchful",
  "winding",
  "unmeasured",
  "unwatched",
  "unsynchronized",
  "lunar",
  "gregorian",
  "julian",
  "tick-tock",
  "zoned",
  "accelerated",
  "elongated",
  "fractured",
  "dilating",
  "compressed",
  "warped",
  "fragmented",
  "mortal",
  "immortal",
  "time-zone-bound",
  "second-hand"
]

const clocktowerNouns = [
  "second",
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
  "decade",
  "century",
  "millennium",
  "epoch",
  "era",
  "eons",
  "watch",
  "wristwatch",
  "sundial",
  "metronome",
  "stopwatch",
  "timer",
  "alarm",
  "bell",
  "tick",
  "tock",
  "gear",
  "hand",
  "dial",
  "pendulum",
  "cuckoo",
  "gong",
  "chime",
  "bezel",
  "face",
  "mechanism",
  "calendar",
  "chronometer",
  "quartz",
  "spring",
  "fusee",
  "escapement",
  "timezone",
  "meridian",
  "noon",
  "midnight",
  "dusk",
  "dawn",
  "solstice",
  "equinox",
  "anachronism",
  "horologist",
  "timekeeper",
  "timeline",
  "timepiece",
  "hourglass",
  "astronomical",
  "carillon",
  "belfry",
  "turret",
  "synchronize",
  "tempo",
  "rhythm",
  "waterclock",
  "clepsydra",
  "future",
  "past",
  "present",
  "temporality",
  "infinity",
  "moment",
  "juncture",
  "chronology",
  "eventide",
  "lunar",
  "solar",
  "sidereal",
  "twilight",
  "timelessness"
]

export const generateUsername = () => {
  const adjective = clocktowerAdjectives[Math.floor(Math.random() * clocktowerAdjectives.length)]
  const noun = clocktowerNouns[Math.floor(Math.random() * clocktowerNouns.length)]
  return `${adjective}-${noun}`
}
