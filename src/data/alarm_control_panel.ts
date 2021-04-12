import { OpenPeerPower } from "../types";

export const FORMAT_TEXT = "text";
export const FORMAT_NUMBER = "number";

export const callAlarmAction = (
  opp: OpenPeerPower,
  entity: string,
  action:
    | "arm_away"
    | "arm_home"
    | "arm_night"
    | "arm_custom_bypass"
    | "disarm",
  code?: string
) => {
  opp!.callService("alarm_control_panel", `alarm_${action}`, {
    entity_id: entity,
    code,
  });
};
