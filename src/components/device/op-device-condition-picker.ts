import { customElement } from "lit/decorators";
import {
  DeviceCondition,
  fetchDeviceConditions,
  localizeDeviceAutomationCondition,
} from "../../data/device_automation";
import { HaDeviceAutomationPicker } from "./op-device-automation-picker";

@customElement("op-device-condition-picker")
class HaDeviceConditionPicker extends HaDeviceAutomationPicker<DeviceCondition> {
  protected get NO_AUTOMATION_TEXT() {
    return this.opp.localize(
      "ui.panel.config.devices.automation.conditions.no_conditions"
    );
  }

  protected get UNKNOWN_AUTOMATION_TEXT() {
    return this.opp.localize(
      "ui.panel.config.devices.automation.conditions.unknown_condition"
    );
  }

  constructor() {
    super(
      localizeDeviceAutomationCondition,
      fetchDeviceConditions,
      (deviceId?: string) => ({
        device_id: deviceId || "",
        condition: "device",
        domain: "",
        entity_id: "",
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-device-condition-picker": HaDeviceConditionPicker;
  }
}
