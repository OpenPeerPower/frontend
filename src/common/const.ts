/** Constants to be used in the frontend. */

// Constants should be alphabetically sorted by name.
// Arrays with values should be alphabetically sorted if order doesn't matter.
// Each constant should have a description what it is supposed to be used for.

/** Icon to use when no icon specified for domain. */
export const DEFAULT_DOMAIN_ICON = "opp:bookmark";

/** Icons for each domain */
export const FIXED_DOMAIN_ICONS = {
  alert: "opp:alert",
  alexa: "opp:amazon-alexa",
  air_quality: "opp:air-filter",
  automation: "opp:robot",
  calendar: "opp:calendar",
  camera: "opp:video",
  climate: "opp:thermostat",
  configurator: "opp:cog",
  conversation: "opp:text-to-speech",
  counter: "opp:counter",
  device_tracker: "opp:account",
  fan: "opp:fan",
  google_assistant: "opp:google-assistant",
  group: "opp:google-circles-communities",
  openpeerpower: "opp:open-peer-power",
  homekit: "opp:home-automation",
  image_processing: "opp:image-filter-frames",
  input_boolean: "opp:toggle-switch-outline",
  input_datetime: "opp:calendar-clock",
  input_number: "opp:ray-vertex",
  input_select: "opp:format-list-bulleted",
  input_text: "opp:form-textbox",
  light: "opp:lightbulb",
  mailbox: "opp:mailbox",
  notify: "opp:comment-alert",
  number: "opp:ray-vertex",
  persistent_notification: "opp:bell",
  person: "opp:account",
  plant: "opp:flower",
  proximity: "opp:apple-safari",
  remote: "opp:remote",
  scene: "opp:palette",
  script: "opp:script-text",
  sensor: "opp:eye",
  simple_alarm: "opp:bell",
  sun: "opp:white-balance-sunny",
  switch: "opp:flash",
  timer: "opp:timer-outline",
  updater: "opp:cloud-upload",
  vacuum: "opp:robot-vacuum",
  water_heater: "opp:thermometer",
  weather: "opp:weather-cloudy",
  zone: "opp:map-marker-radius",
};

export const FIXED_DEVICE_CLASS_ICONS = {
  current: "opp:current-ac",
  carbon_dioxide: "mdi:molecule-co2",
  carbon_monoxide: "mdi:molecule-co",
  energy: "opp:flash",
  humidity: "opp:water-percent",
  illuminance: "opp:brightness-5",
  temperature: "opp:thermometer",
  pressure: "opp:gauge",
  power: "opp:flash",
  power_factor: "opp:angle-acute",
  signal_strength: "opp:wifi",
  timestamp: "opp:clock",
  voltage: "opp:sine-wave",
};

/** Domains that have a state card. */
export const DOMAINS_WITH_CARD = [
  "climate",
  "cover",
  "configurator",
  "input_select",
  "input_number",
  "input_text",
  "lock",
  "media_player",
  "number",
  "scene",
  "script",
  "timer",
  "vacuum",
  "water_heater",
];

/** Domains with separate more info dialog. */
export const DOMAINS_WITH_MORE_INFO = [
  "alarm_control_panel",
  "automation",
  "camera",
  "climate",
  "configurator",
  "counter",
  "cover",
  "fan",
  "group",
  "humidifier",
  "input_datetime",
  "light",
  "lock",
  "media_player",
  "person",
  "remote",
  "script",
  "sun",
  "timer",
  "vacuum",
  "water_heater",
  "weather",
];

/** Domains that show no more info dialog. */
export const DOMAINS_HIDE_MORE_INFO = [
  "input_number",
  "input_select",
  "input_text",
  "number",
  "scene",
];

/** Domains that should have the history hidden in the more info dialog. */
export const DOMAINS_MORE_INFO_NO_HISTORY = ["camera", "configurator", "scene"];

/** States that we consider "off". */
export const STATES_OFF = ["closed", "locked", "off"];

/** Binary States */
export const BINARY_STATE_ON = "on";
export const BINARY_STATE_OFF = "off";

/** Domains where we allow toggle in Lovelace. */
export const DOMAINS_TOGGLE = new Set([
  "fan",
  "input_boolean",
  "light",
  "switch",
  "group",
  "automation",
  "humidifier",
]);

/** Domains that have a dynamic entity image / picture. */
export const DOMAINS_WITH_DYNAMIC_PICTURE = new Set(["camera", "media_player"]);

/** Temperature units. */
export const UNIT_C = "°C";
export const UNIT_F = "°F";

/** Entity ID of the default view. */
export const DEFAULT_VIEW_ENTITY_ID = "group.default_view";

/** OP Color Pallete. */
export const HA_COLOR_PALETTE = [
  "ff0029",
  "66a61e",
  "377eb8",
  "984ea3",
  "00d2d5",
  "ff7f00",
  "af8d00",
  "7f80cd",
  "b3e900",
  "c42e60",
  "a65628",
  "f781bf",
  "8dd3c7",
  "bebada",
  "fb8072",
  "80b1d3",
  "fdb462",
  "fccde5",
  "bc80bd",
  "ffed6f",
  "c4eaff",
  "cf8c00",
  "1b9e77",
  "d95f02",
  "e7298a",
  "e6ab02",
  "a6761d",
  "0097ff",
  "00d067",
  "f43600",
  "4ba93b",
  "5779bb",
  "927acc",
  "97ee3f",
  "bf3947",
  "9f5b00",
  "f48758",
  "8caed6",
  "f2b94f",
  "eff26e",
  "e43872",
  "d9b100",
  "9d7a00",
  "698cff",
  "d9d9d9",
  "00d27e",
  "d06800",
  "009f82",
  "c49200",
  "cbe8ff",
  "fecddf",
  "c27eb6",
  "8cd2ce",
  "c4b8d9",
  "f883b0",
  "a49100",
  "f48800",
  "27d0df",
  "a04a9b",
];
