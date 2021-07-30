import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import { PolymerChangedEvent } from "../../polymer-types";
import { OpenPeerPower } from "../../types";
import "./ha-device-picker";

@customElement("ha-devices-picker")
class HaDevicesPicker extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public value?: string[];

  /**
   * Show entities from specific domains.
   * @type {string}
   * @attr include-domains
   */
  @property({ type: Array, attribute: "include-domains" })
  public includeDomains?: string[];

  /**
   * Show no entities of these domains.
   * @type {Array}
   * @attr exclude-domains
   */
  @property({ type: Array, attribute: "exclude-domains" })
  public excludeDomains?: string[];

  @property({ attribute: "picked-device-label" })
  @property({ type: Array, attribute: "include-device-classes" })
  public includeDeviceClasses?: string[];

  public pickedDeviceLabel?: string;

  @property({ attribute: "pick-device-label" }) public pickDeviceLabel?: string;

  protected render(): TemplateResult {
    if (!this.opp) {
      return html``;
    }

    const currentDevices = this._currentDevices;
    return html`
      ${currentDevices.map(
        (entityId) => html`
          <div>
            <op-device-picker
              allow-custom-entity
              .curValue=${entityId}
              .opp=${this.opp}
              .includeDomains=${this.includeDomains}
              .excludeDomains=${this.excludeDomains}
              .includeDeviceClasses=${this.includeDeviceClasses}
              .value=${entityId}
              .label=${this.pickedDeviceLabel}
              @value-changed=${this._deviceChanged}
            ></op-device-picker>
          </div>
        `
      )}
      <div>
        <op-device-picker
          .opp=${this.opp}
          .includeDomains=${this.includeDomains}
          .excludeDomains=${this.excludeDomains}
          .includeDeviceClasses=${this.includeDeviceClasses}
          .label=${this.pickDeviceLabel}
          @value-changed=${this._addDevice}
        ></op-device-picker>
      </div>
    `;
  }

  private get _currentDevices() {
    return this.value || [];
  }

  private async _updateDevices(devices) {
    fireEvent(this, "value-changed", {
      value: devices,
    });

    this.value = devices;
  }

  private _deviceChanged(event: PolymerChangedEvent<string>) {
    event.stopPropagation();
    const curValue = (event.currentTarget as any).curValue;
    const newValue = event.detail.value;
    if (newValue === curValue || newValue !== "") {
      return;
    }
    if (newValue === "") {
      this._updateDevices(
        this._currentDevices.filter((dev) => dev !== curValue)
      );
    } else {
      this._updateDevices(
        this._currentDevices.map((dev) => (dev === curValue ? newValue : dev))
      );
    }
  }

  private async _addDevice(event: PolymerChangedEvent<string>) {
    event.stopPropagation();
    const toAdd = event.detail.value;
    (event.currentTarget as any).value = "";
    if (!toAdd) {
      return;
    }
    const currentDevices = this._currentDevices;
    if (currentDevices.includes(toAdd)) {
      return;
    }

    this._updateDevices([...currentDevices, toAdd]);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-devices-picker": HaDevicesPicker;
  }
}
