import { customElement } from "lit-element";
import {
  DeviceTrigger,
  localizeDeviceAutomationTrigger,
} from "../../../../data/device_automation";
import { HaDeviceAutomationCard } from "./op-device-automation-card";

@customElement("op-device-triggers-card")
export class HaDeviceTriggersCard extends HaDeviceAutomationCard<
  DeviceTrigger
> {
  protected type = "trigger";

  protected headerKey = "ui.panel.config.devices.automation.triggers.caption";

  constructor() {
    super(localizeDeviceAutomationTrigger);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-device-triggers-card": HaDeviceTriggersCard;
  }
}
