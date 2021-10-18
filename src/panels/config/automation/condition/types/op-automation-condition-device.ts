import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
} from "lit-element";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../../common/dom/fire_event";
import "../../../../../components/device/op-device-condition-picker";
import "../../../../../components/device/op-device-picker";
import "../../../../../components/ha-form/ha-form";
import {
  deviceAutomationsEqual,
  DeviceCapabilities,
  DeviceCondition,
  fetchDeviceConditionCapabilities,
} from "../../../../../data/device_automation";
import { OpenPeerPower } from "../../../../../types";

@customElement("op-automation-condition-device")
export class HaDeviceCondition extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Object }) public condition!: DeviceCondition;

  @internalProperty() private _deviceId?: string;

  @internalProperty() private _capabilities?: DeviceCapabilities;

  private _origCondition?: DeviceCondition;

  public static get defaultConfig() {
    return {
      device_id: "",
      domain: "",
      entity_id: "",
    };
  }

  private _extraFieldsData = memoizeOne(
    (condition: DeviceCondition, capabilities: DeviceCapabilities) => {
      const extraFieldsData: Record<string, any> = {};
      capabilities.extra_fields.forEach((item) => {
        if (condition[item.name] !== undefined) {
          extraFieldsData![item.name] = condition[item.name];
        }
      });
      return extraFieldsData;
    }
  );

  protected render() {
    const deviceId = this._deviceId || this.condition.device_id;

    return html`
      <op-device-picker
        .value=${deviceId}
        @value-changed=${this._devicePicked}
        .opp=${this.opp}
        label=${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.device.label"
        )}
      ></op-device-picker>
      <op-device-condition-picker
        .value=${this.condition}
        .deviceId=${deviceId}
        @value-changed=${this._deviceConditionPicked}
        .opp=${this.opp}
        label=${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.device.condition"
        )}
      ></op-device-condition-picker>
      ${this._capabilities?.extra_fields
        ? html`
            <op-form
              .data=${this._extraFieldsData(this.condition, this._capabilities)}
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
    if (this.condition) {
      this._origCondition = this.condition;
    }
  }

  protected updated(changedPros) {
    const prevCondition = changedPros.get("condition");
    if (
      prevCondition &&
      !deviceAutomationsEqual(prevCondition, this.condition)
    ) {
      this._getCapabilities();
    }
  }

  private async _getCapabilities() {
    const condition = this.condition;

    this._capabilities = condition.domain
      ? await fetchDeviceConditionCapabilities(this.opp, condition)
      : undefined;
  }

  private _devicePicked(ev) {
    ev.stopPropagation();
    this._deviceId = ev.target.value;
  }

  private _deviceConditionPicked(ev) {
    ev.stopPropagation();
    let condition = ev.detail.value;
    if (
      this._origCondition &&
      deviceAutomationsEqual(this._origCondition, condition)
    ) {
      condition = this._origCondition;
    }
    fireEvent(this, "value-changed", { value: condition });
  }

  private _extraFieldsChanged(ev) {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: {
        ...this.condition,
        ...ev.detail.value,
      },
    });
  }

  private _extraFieldsComputeLabelCallback(localize) {
    // Returns a callback for ha-form to calculate labels per schema object
    return (schema) =>
      localize(
        `ui.panel.config.automation.editor.conditions.type.device.extra_fields.${schema.name}`
      ) || schema.name;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-condition-device": HaDeviceCondition;
  }
}
