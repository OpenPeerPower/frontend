import { computeStateName } from "../common/entity/compute_state_name";
import { HaFormSchema } from "../components/op-form/op-form";
import { OpenPeerPower } from "../types";
import { BaseTrigger } from "./automation";

export interface DeviceAutomation {
  alias?: string;
  device_id: string;
  domain: string;
  entity_id?: string;
  type?: string;
  subtype?: string;
  event?: string;
}

export interface DeviceAction extends DeviceAutomation {
  entity_id: string;
}

export interface DeviceCondition extends DeviceAutomation {
  condition: "device";
}

export type DeviceTrigger = DeviceAutomation &
  BaseTrigger & {
    platform: "device";
  };

export interface DeviceCapabilities {
  extra_fields: HaFormSchema[];
}

export const fetchDeviceActions = (opp: OpenPeerPower, deviceId: string) =>
  opp.callWS<DeviceAction[]>({
    type: "device_automation/action/list",
    device_id: deviceId,
  });

export const fetchDeviceConditions = (opp: OpenPeerPower, deviceId: string) =>
  opp.callWS<DeviceCondition[]>({
    type: "device_automation/condition/list",
    device_id: deviceId,
  });

export const fetchDeviceTriggers = (opp: OpenPeerPower, deviceId: string) =>
  opp.callWS<DeviceTrigger[]>({
    type: "device_automation/trigger/list",
    device_id: deviceId,
  });

export const fetchDeviceActionCapabilities = (
  opp: OpenPeerPower,
  action: DeviceAction
) =>
  opp.callWS<DeviceCapabilities>({
    type: "device_automation/action/capabilities",
    action,
  });

export const fetchDeviceConditionCapabilities = (
  opp: OpenPeerPower,
  condition: DeviceCondition
) =>
  opp.callWS<DeviceCapabilities>({
    type: "device_automation/condition/capabilities",
    condition,
  });

export const fetchDeviceTriggerCapabilities = (
  opp: OpenPeerPower,
  trigger: DeviceTrigger
) =>
  opp.callWS<DeviceCapabilities>({
    type: "device_automation/trigger/capabilities",
    trigger,
  });

const deviceAutomationIdentifiers = [
  "device_id",
  "domain",
  "entity_id",
  "type",
  "subtype",
  "event",
  "condition",
  "platform",
];

export const deviceAutomationsEqual = (
  a: DeviceAutomation,
  b: DeviceAutomation
) => {
  if (typeof a !== typeof b) {
    return false;
  }

  for (const property in a) {
    if (!deviceAutomationIdentifiers.includes(property)) {
      continue;
    }
    if (!Object.is(a[property], b[property])) {
      return false;
    }
  }
  for (const property in b) {
    if (!deviceAutomationIdentifiers.includes(property)) {
      continue;
    }
    if (!Object.is(a[property], b[property])) {
      return false;
    }
  }

  return true;
};

export const localizeDeviceAutomationAction = (
  opp: OpenPeerPower,
  action: DeviceAction
): string => {
  const state = action.entity_id ? opp.states[action.entity_id] : undefined;
  return (
    opp.localize(
      `component.${action.domain}.device_automation.action_type.${action.type}`,
      "entity_name",
      state ? computeStateName(state) : action.entity_id || "<unknown>",
      "subtype",
      action.subtype
        ? opp.localize(
            `component.${action.domain}.device_automation.action_subtype.${action.subtype}`
          ) || action.subtype
        : ""
    ) || (action.subtype ? `"${action.subtype}" ${action.type}` : action.type!)
  );
};

export const localizeDeviceAutomationCondition = (
  opp: OpenPeerPower,
  condition: DeviceCondition
): string => {
  const state = condition.entity_id
    ? opp.states[condition.entity_id]
    : undefined;
  return (
    opp.localize(
      `component.${condition.domain}.device_automation.condition_type.${condition.type}`,
      "entity_name",
      state ? computeStateName(state) : condition.entity_id || "<unknown>",
      "subtype",
      condition.subtype
        ? opp.localize(
            `component.${condition.domain}.device_automation.condition_subtype.${condition.subtype}`
          ) || condition.subtype
        : ""
    ) ||
    (condition.subtype
      ? `"${condition.subtype}" ${condition.type}`
      : condition.type!)
  );
};

export const localizeDeviceAutomationTrigger = (
  opp: OpenPeerPower,
  trigger: DeviceTrigger
): string => {
  const state = trigger.entity_id ? opp.states[trigger.entity_id] : undefined;
  return (
    opp.localize(
      `component.${trigger.domain}.device_automation.trigger_type.${trigger.type}`,
      "entity_name",
      state ? computeStateName(state) : trigger.entity_id || "<unknown>",
      "subtype",
      trigger.subtype
        ? opp.localize(
            `component.${trigger.domain}.device_automation.trigger_subtype.${trigger.subtype}`
          ) || trigger.subtype
        : ""
    ) ||
    (trigger.subtype ? `"${trigger.subtype}" ${trigger.type}` : trigger.type!)
  );
};
