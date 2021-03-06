/** Return an icon representing a sensor state. */
import { OppEntity } from "openpeerpower-js-websocket";
import { FIXED_DEVICE_CLASS_ICONS, UNIT_C, UNIT_F } from "../const";
import { batteryIcon } from "./battery_icon";

export const sensorIcon = (stateObj?: OppEntity): string | undefined => {
  const dclass = stateObj?.attributes.device_class;

  if (dclass && dclass in FIXED_DEVICE_CLASS_ICONS) {
    return FIXED_DEVICE_CLASS_ICONS[dclass];
  }

  if (dclass === "battery") {
    return stateObj ? batteryIcon(stateObj) : "opp:battery";
  }

  const unit = stateObj?.attributes.unit_of_measurement;
  if (unit === UNIT_C || unit === UNIT_F) {
    return "opp:thermometer";
  }

  return undefined;
};
