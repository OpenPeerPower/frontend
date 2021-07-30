import { OppEntity } from "openpeerpower-js-websocket";
/**
 * Return the icon to be used for a domain.
 *
 * Optionally pass in a state to influence the domain icon.
 */
import { DEFAULT_DOMAIN_ICON, FIXED_DOMAIN_ICONS } from "../const";
import { binarySensorIcon } from "./binary_sensor_icon";
import { coverIcon } from "./cover_icon";
import { sensorIcon } from "./sensor_icon";

export const domainIcon = (
  domain: string,
  stateObj?: OppEntity,
  state?: string
): string => {
  const compareState = state !== undefined ? state : stateObj?.state;

  switch (domain) {
    case "alarm_control_panel":
      switch (compareState) {
        case "armed_home":
          return "opp:bell-plus";
        case "armed_night":
          return "opp:bell-sleep";
        case "disarmed":
          return "opp:bell-outline";
        case "triggered":
          return "opp:bell-ring";
        default:
          return "opp:bell";
      }

    case "binary_sensor":
      return binarySensorIcon(compareState, stateObj);

    case "cover":
      return coverIcon(compareState, stateObj);

    case "humidifier":
      return state && state === "off"
        ? "opp:air-humidifier-off"
        : "opp:air-humidifier";

    case "lock":
      switch (compareState) {
        case "unlocked":
          return "opp:lock-open";
        case "jammed":
          return "opp:lock-alert";
        case "locking":
        case "unlocking":
          return "opp:lock-clock";
        default:
          return "opp:lock";
      }

    case "media_player":
      return compareState === "playing" ? "opp:cast-connected" : "opp:cast";

    case "zwave":
      switch (compareState) {
        case "dead":
          return "opp:emoticon-dead";
        case "sleeping":
          return "opp:sleep";
        case "initializing":
          return "opp:timer-sand";
        default:
          return "opp:z-wave";
      }

    case "sensor": {
      const icon = sensorIcon(stateObj);
      if (icon) {
        return icon;
      }

      break;
    }

    case "input_datetime":
      if (!stateObj?.attributes.has_date) {
        return "opp:clock";
      }
      if (!stateObj.attributes.has_time) {
        return "opp:calendar";
      }
      break;

    case "sun":
      return stateObj?.state === "above_horizon"
        ? FIXED_DOMAIN_ICONS[domain]
        : "opp:weather-night";
  }

  if (domain in FIXED_DOMAIN_ICONS) {
    return FIXED_DOMAIN_ICONS[domain];
  }

  // eslint-disable-next-line
  console.warn(`Unable to find icon for domain ${domain}`);
  return DEFAULT_DOMAIN_ICON;
};
