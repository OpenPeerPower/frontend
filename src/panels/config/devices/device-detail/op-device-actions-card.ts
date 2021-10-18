import { customElement } from "lit-element";
import "../../../../components/op-card";
import {
  DeviceAction,
  localizeDeviceAutomationAction,
} from "../../../../data/device_automation";
import { HaDeviceAutomationCard } from "./op-device-automation-card";

@customElement("op-device-actions-card")
export class HaDeviceActionsCard extends HaDeviceAutomationCard<DeviceAction> {
  protected type = "action";

  protected headerKey = "ui.panel.config.devices.automation.actions.caption";

  constructor() {
    super(localizeDeviceAutomationAction);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-device-actions-card": HaDeviceActionsCard;
  }
}
