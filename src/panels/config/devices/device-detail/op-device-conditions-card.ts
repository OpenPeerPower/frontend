import { customElement } from "lit-element";
import "../../../../components/op-card";
import {
  DeviceCondition,
  localizeDeviceAutomationCondition,
} from "../../../../data/device_automation";
import { HaDeviceAutomationCard } from "./op-device-automation-card";

@customElement("op-device-conditions-card")
export class HaDeviceConditionsCard extends HaDeviceAutomationCard<
  DeviceCondition
> {
  protected type = "condition";

  protected headerKey = "ui.panel.config.devices.automation.conditions.caption";

  constructor() {
    super(localizeDeviceAutomationCondition);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-device-conditions-card": HaDeviceConditionsCard;
  }
}
