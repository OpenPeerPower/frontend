import { OppEntity } from "openpeerpower-js-websocket";

/** Return an icon representing a binary sensor state. */

export const binarySensorIcon = (state?: string, stateObj?: OppEntity) => {
  const is_off = state === "off";
  switch (stateObj?.attributes.device_class) {
    case "battery":
      return is_off ? "opp:battery" : "opp:battery-outline";
    case "battery_charging":
      return is_off ? "opp:battery" : "opp:battery-charging";
    case "cold":
      return is_off ? "opp:thermometer" : "opp:snowflake";
    case "connectivity":
      return is_off ? "opp:server-network-off" : "opp:server-network";
    case "door":
      return is_off ? "opp:door-closed" : "opp:door-open";
    case "garage_door":
      return is_off ? "opp:garage" : "opp:garage-open";
    case "power":
      return is_off ? "opp:power-plug-off" : "opp:power-plug";
    case "gas":
    case "problem":
    case "safety":
    case "smoke":
      return is_off ? "opp:check-circle" : "opp:alert-circle";
    case "heat":
      return is_off ? "opp:thermometer" : "opp:fire";
    case "light":
      return is_off ? "opp:brightness-5" : "opp:brightness-7";
    case "lock":
      return is_off ? "opp:lock" : "opp:lock-open";
    case "moisture":
      return is_off ? "opp:water-off" : "opp:water";
    case "motion":
      return is_off ? "opp:walk" : "opp:run";
    case "occupancy":
      return is_off ? "opp:home-outline" : "opp:home";
    case "opening":
      return is_off ? "opp:square" : "opp:square-outline";
    case "plug":
      return is_off ? "opp:power-plug-off" : "opp:power-plug";
    case "presence":
      return is_off ? "opp:home-outline" : "opp:home";
    case "sound":
      return is_off ? "opp:music-note-off" : "opp:music-note";
    case "vibration":
      return is_off ? "opp:crop-portrait" : "opp:vibrate";
    case "window":
      return is_off ? "opp:window-closed" : "opp:window-open";
    default:
      return is_off ? "opp:radiobox-blank" : "opp:checkbox-marked-circle";
  }
};
