import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../../common/dom/fire_event";
import "../../../../../components/device/op-device-picker";
import "../../../../../components/device/op-device-trigger-picker";
import "../../../../../components/op-form/op-form";
import {
  deviceAutomationsEqual,
  DeviceCapabilities,
  DeviceTrigger,
  fetchDeviceTriggerCapabilities,
} from "../../../../../data/device_automation";
import { OpenPeerPower } from "../../../../../types";

@customElement("op-automation-trigger-device")
export class HaDeviceTrigger extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Object }) public trigger!: DeviceTrigger;

  @state() private _deviceId?: string;

  @state() private _capabilities?: DeviceCapabilities;

  private _origTrigger?: DeviceTrigger;

  public static get defaultConfig() {
    return {
      device_id: "",
      domain: "",
      entity_id: "",
    };
  }

  private _extraFieldsData = memoizeOne(
    (trigger: DeviceTrigger, capabilities: DeviceCapabilities) => {
      const extraFieldsData: Record<string, any> = {};
      capabilities.extra_fields.forEach((item) => {
        if (trigger[item.name] !== undefined) {
          extraFieldsData![item.name] = trigger[item.name];
        }
      });
      return extraFieldsData;
    }
  );

  protected render() {
    const deviceId = this._deviceId || this.trigger.device_id;

    return html`
      <op-device-picker
        .value=${deviceId}
        @value-changed=${this._devicePicked}
        .opp=${this.opp}
        label=${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.device.label"
        )}
      ></op-device-picker>
      <op-device-trigger-picker
        .value=${this.trigger}
        .deviceId=${deviceId}
        @value-changed=${this._deviceTriggerPicked}
        .opp=${this.opp}
        label=${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.device.trigger"
        )}
      ></op-device-trigger-picker>
      ${this._capabilities?.extra_fields
        ? html`
            <op-form
              .data=${this._extraFieldsData(this.trigger, this._capabilities)}
              .schema=${this._capabilities.extra_fields}
              .computeLabel=${this._extraFieldsComputeLabelCallback(
                this.opp.localize
              )}
              @value-changed=${this._extraFieldsChanged}
            ></op-form>
          `
        : ""}
    `;
  }

  protected firstUpdated() {
    if (!this._capabilities) {
      this._getCapabilities();
    }
    if (this.trigger) {
      this._origTrigger = this.trigger;
    }
  }

  protected updated(changedPros) {
    if (!changedPros.has("trigger")) {
      return;
    }
    const prevTrigger = changedPros.get("trigger");
    if (prevTrigger && !deviceAutomationsEqual(prevTrigger, this.trigger)) {
      this._getCapabilities();
    }
  }

  private async _getCapabilities() {
    const trigger = this.trigger;

    this._capabilities = trigger.domain
      ? await fetchDeviceTriggerCapabilities(this.opp, trigger)
      : undefined;
  }

  private _devicePicked(ev) {
    ev.stopPropagation();
    this._deviceId = ev.target.value;
  }

  private _deviceTriggerPicked(ev) {
    ev.stopPropagation();
    let trigger = ev.detail.value;
    if (
      this._origTrigger &&
      deviceAutomationsEqual(this._origTrigger, trigger)
    ) {
      trigger = this._origTrigger;
    }
    if (this.trigger.id) {
      trigger.id = this.trigger.id;
    }
    fireEvent(this, "value-changed", { value: trigger });
  }

  private _extraFieldsChanged(ev: CustomEvent) {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: {
        ...this.trigger,
        ...ev.detail.value,
      },
    });
  }

  private _extraFieldsComputeLabelCallback(localize) {
    // Returns a callback for op-form to calculate labels per schema object
    return (schema) =>
      localize(
        `ui.panel.config.automation.editor.triggers.type.device.extra_fields.${schema.name}`
      ) || schema.name;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-trigger-device": HaDeviceTrigger;
  }
}
