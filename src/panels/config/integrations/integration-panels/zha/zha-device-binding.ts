import "@material/mwc-button/mwc-button";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import "../../../../../components/buttons/ha-call-service-button";
import "../../../../../components/op-card";
import "../../../../../components/op-icon-button";
import "../../../../../components/op-service-description";
import { bindDevices, unbindDevices, ZHADevice } from "../../../../../data/zha";
import { haStyle } from "../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../types";
import "../../../ha-config-section";
import { ItemSelectedEvent } from "./types";

@customElement("zop-device-binding-control")
export class ZHADeviceBindingControl extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public isWide?: boolean;

  @property() public selectedDevice?: ZHADevice;

  @internalProperty() private _showHelp = false;

  @internalProperty() private _bindTargetIndex = -1;

  @internalProperty() private bindableDevices: ZHADevice[] = [];

  @internalProperty() private _deviceToBind?: ZHADevice;

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has("selectedDevice")) {
      this._bindTargetIndex = -1;
    }
    super.update(changedProperties);
  }

  protected render(): TemplateResult {
    return html`
      <op-config-section .isWide="${this.isWide}">
        <div class="header" slot="header">
          <span>Device Binding</span>
          <op-icon-button
            class="toggle-help-icon"
            @click="${this._onHelpTap}"
            icon="opp:help-circle"
          >
          </op-icon-button>
        </div>
        <span slot="introduction">Bind and unbind devices.</span>

        <op-card class="content">
          <div class="command-picker">
            <paper-dropdown-menu label="Bindable Devices" class="menu">
              <paper-listbox
                slot="dropdown-content"
                .selected="${this._bindTargetIndex}"
                @iron-select="${this._bindTargetIndexChanged}"
              >
                ${this.bindableDevices.map(
                  (device) => html`
                    <paper-item
                      >${device.user_given_name
                        ? device.user_given_name
                        : device.name}</paper-item
                    >
                  `
                )}
              </paper-listbox>
            </paper-dropdown-menu>
          </div>
          ${this._showHelp
            ? html`
                <div class="helpText">
                  Select a device to issue a bind command.
                </div>
              `
            : ""}
          <div class="card-actions">
            <mwc-button
              @click="${this._onBindDevicesClick}"
              .disabled="${!(this._deviceToBind && this.selectedDevice)}"
              >Bind</mwc-button
            >
            ${this._showHelp
              ? html` <div class="helpText">Bind devices.</div> `
              : ""}
            <mwc-button
              @click="${this._onUnbindDevicesClick}"
              .disabled="${!(this._deviceToBind && this.selectedDevice)}"
              >Unbind</mwc-button
            >
            ${this._showHelp
              ? html` <div class="helpText">Unbind devices.</div> `
              : ""}
          </div>
        </op-card>
      </op-config-section>
    `;
  }

  private _bindTargetIndexChanged(event: ItemSelectedEvent): void {
    this._bindTargetIndex = event.target!.selected;
    this._deviceToBind =
      this._bindTargetIndex === -1
        ? undefined
        : this.bindableDevices[this._bindTargetIndex];
  }

  private _onHelpTap(): void {
    this._showHelp = !this._showHelp;
  }

  private async _onBindDevicesClick(): Promise<void> {
    if (this.opp && this._deviceToBind && this.selectedDevice) {
      await bindDevices(
        this.opp,
        this.selectedDevice.ieee,
        this._deviceToBind.ieee
      );
    }
  }

  private async _onUnbindDevicesClick(): Promise<void> {
    if (this.opp && this._deviceToBind && this.selectedDevice) {
      await unbindDevices(
        this.opp,
        this.selectedDevice.ieee,
        this._deviceToBind.ieee
      );
    }
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        .menu {
          width: 100%;
        }

        .content {
          margin-top: 24px;
        }

        op-card {
          max-width: 680px;
        }

        .card-actions.warning ha-call-service-button {
          color: var(--error-color);
        }

        .command-picker {
          align-items: center;
          padding-left: 28px;
          padding-right: 28px;
          padding-bottom: 10px;
        }

        .helpText {
          color: grey;
          padding-left: 28px;
          padding-right: 28px;
          padding-bottom: 10px;
        }

        .header {
          flex-grow: 1;
        }

        .toggle-help-icon {
          float: right;
          top: -6px;
          right: 0;
          padding-right: 0px;
          color: var(--primary-color);
        }

        op-service-description {
          display: block;
          color: grey;
        }

        [hidden] {
          display: none;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zop-device-binding-control": ZHADeviceBindingControl;
  }
}
