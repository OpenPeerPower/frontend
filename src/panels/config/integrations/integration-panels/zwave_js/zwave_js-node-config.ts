import "../../../../../components/op-settings-row";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@material/mwc-button/mwc-button";
import "@material/mwc-icon-button/mwc-icon-button";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { debounce } from "../../../../../common/util/debounce";
import "../../../../../components/op-card";
import "../../../../../components/op-svg-icon";
import "../../../../../components/op-icon-next";
import "../../../../../components/op-switch";
import {
  fetchNodeConfigParameters,
  setNodeConfigParameter,
  ZWaveJSNodeConfigParams,
} from "../../../../../data/zwave_js";
import "../../../../../layouts/opp-tabs-subpage";
import { haStyle } from "../../../../../resources/styles";
import type { OpenPeerPower, Route } from "../../../../../types";
import "../../../op-config-section";
import { configTabs } from "./zwave_js-config-router";
import {
  DeviceRegistryEntry,
  computeDeviceName,
  subscribeDeviceRegistry,
} from "../../../../../data/device_registry";
import { SubscribeMixin } from "../../../../../mixins/subscribe-mixin";
import { UnsubscribeFunc } from "openpeerpower-js-websocket";
import memoizeOne from "memoize-one";

const getDevice = memoizeOne(
  (
    deviceId: string,
    entries?: DeviceRegistryEntry[]
  ): DeviceRegistryEntry | undefined =>
    entries?.find((device) => device.id === deviceId)
);

const getNodeId = memoizeOne(
  (device: DeviceRegistryEntry): number | undefined => {
    const identifier = device.identifiers.find(
      (ident) => ident[0] === "zwave_js"
    );
    if (!identifier) {
      return undefined;
    }

    return parseInt(identifier[1].split("-")[1]);
  }
);

@customElement("zwave_js-node-config")
class ZWaveJSNodeConfig extends SubscribeMixin(LitElement) {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @property() public configEntryId?: string;

  @property() public deviceId!: string;

  @property({ type: Array })
  private _deviceRegistryEntries?: DeviceRegistryEntry[];

  @internalProperty() private _config?: ZWaveJSNodeConfigParams[];

  @internalProperty() private _error?: string;

  public connectedCallback(): void {
    super.connectedCallback();
    this.deviceId = this.route.path.substr(1);
  }

  public oppSubscribe(): UnsubscribeFunc[] {
    return [
      subscribeDeviceRegistry(this.opp.connection, (entries) => {
        this._deviceRegistryEntries = entries;
      }),
    ];
  }

  protected updated(changedProps: PropertyValues): void {
    if (
      (!this._config || changedProps.has("deviceId")) &&
      changedProps.has("_deviceRegistryEntries")
    ) {
      this._fetchData();
    }
  }

  protected render(): TemplateResult {
    if (this._error) {
      return html`<opp-error-screen
        .opp=${this.opp}
        .error=${this.opp.localize(
          `ui.panel.config.zwave_js.node_config.error_${this._error}`
        )}
      ></opp-error-screen>`;
    }

    if (!this._config) {
      return html`<opp-loading-screen></opp-loading-screen>`;
    }

    const device = this._device!;

    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${configTabs}
      >
        <op-config-section .narrow=${this.narrow} .isWide=${this.isWide}>
          <div slot="header">
            ${this.opp.localize("ui.panel.config.zwave_js.node_config.header")}
          </div>

          <div slot="introduction">
            ${device
              ? html`
                  <div class="device-info">
                    <h2>${computeDeviceName(device, this.opp)}</h2>
                    <p>${device.manufacturer} ${device.model}</p>
                  </div>
                `
              : ``}
            ${this.opp.localize(
              "ui.panel.config.zwave_js.node_config.introduction"
            )}
            <p>
              <em>
                ${this.opp.localize(
                  "ui.panel.config.zwave_js.node_config.attribution",
                  "device_database",
                  html`<a href="https://devices.zwave-js.io/" target="_blank"
                    >${this.opp.localize(
                      "ui.panel.config.zwave_js.node_config.zwave_js_device_database"
                    )}</a
                  >`
                )}
              </em>
            </p>
          </div>
          <op-card>
            ${this._config
              ? html`
                  ${Object.entries(this._config).map(
                    ([id, item]) => html` <op-settings-row
                      class="content config-item"
                      .configId=${id}
                      .narrow=${this.narrow}
                    >
                      ${this._generateConfigBox(id, item)}
                    </op-settings-row>`
                  )}
                `
              : ``}
          </op-card>
        </op-config-section>
      </opp-tabs-subpage>
    `;
  }

  private _generateConfigBox(id, item): TemplateResult {
    const labelAndDescription = html`
      <span slot="heading">${item.metadata.label}</span>
      <span slot="description">
        ${item.metadata.description}
        ${item.metadata.description !== null && !item.metadata.writeable
          ? html`<br />`
          : ""}
        ${!item.metadata.writeable
          ? html`<em>
              ${this.opp.localize(
                "ui.panel.config.zwave_js.node_config.parameter_is_read_only"
              )}
            </em>`
          : ""}
      </span>
    `;

    // Numeric entries with a min value of 0 and max of 1 are considered boolean
    if (
      (item.configuration_value_type === "manual_entry" &&
        item.metadata.min === 0 &&
        item.metadata.max === 1) ||
      this._isEnumeratedBool(item)
    ) {
      return html`
        ${labelAndDescription}
        <div class="toggle">
          <op-switch
            .property=${item.property}
            .propertyKey=${item.property_key}
            .checked=${item.value === 1}
            .key=${id}
            @change=${this._switchToggled}
            .disabled=${!item.metadata.writeable}
          ></op-switch>
        </div>
      `;
    }

    if (item.configuration_value_type === "manual_entry") {
      return html`${labelAndDescription}
        <paper-input
          type="number"
          .value=${item.value}
          .min=${item.metadata.min}
          .max=${item.metadata.max}
          .property=${item.property}
          .propertyKey=${item.property_key}
          .key=${id}
          .disabled=${!item.metadata.writeable}
          @value-changed=${this._numericInputChanged}
        >
          ${item.metadata.unit
            ? html`<span slot="suffix">${item.metadata.unit}</span>`
            : ""}
        </paper-input> `;
    }

    if (item.configuration_value_type === "enumerated") {
      return html`
        ${labelAndDescription}
        <div class="flex">
          <paper-dropdown-menu
            dynamic-align
            .disabled=${!item.metadata.writeable}
          >
            <paper-listbox
              slot="dropdown-content"
              .selected=${item.value}
              attr-for-selected="value"
              .key=${id}
              .property=${item.property}
              .propertyKey=${item.property_key}
              @iron-select=${this._dropdownSelected}
            >
              ${Object.entries(item.metadata.states).map(
                ([key, state]) => html`
                  <paper-item .value=${key}>${state}</paper-item>
                `
              )}
            </paper-listbox>
          </paper-dropdown-menu>
        </div>
      `;
    }

    return html`${labelAndDescription}
      <p>${item.value}</p>`;
  }

  private _isEnumeratedBool(item): boolean {
    // Some Z-Wave config values use a states list with two options where index 0 = Disabled and 1 = Enabled
    // We want those to be considered boolean and show a toggle switch
    const disabledStates = ["disable", "disabled"];
    const enabledStates = ["enable", "enabled"];

    if (item.configuration_value_type !== "enumerated") {
      return false;
    }
    if (!("states" in item.metadata)) {
      return false;
    }
    if (!(0 in item.metadata.states) || !(1 in item.metadata.states)) {
      return false;
    }
    if (
      disabledStates.includes(item.metadata.states[0].toLowerCase()) &&
      enabledStates.includes(item.metadata.states[1].toLowerCase())
    ) {
      return true;
    }
    return false;
  }

  private _switchToggled(ev) {
    this._updateConfigParameter(ev.target, ev.target.checked ? 1 : 0);
  }

  private _dropdownSelected(ev) {
    if (ev.target === undefined || this._config![ev.target.key] === undefined) {
      return;
    }
    if (this._config![ev.target.key].value === ev.target.selected) {
      return;
    }

    this._updateConfigParameter(ev.target, Number(ev.target.selected));
  }

  private debouncedUpdate = debounce((target, value) => {
    this._config![target.key].value = value;

    this._updateConfigParameter(target, value);
  }, 1000);

  private _numericInputChanged(ev) {
    if (ev.target === undefined || this._config![ev.target.key] === undefined) {
      return;
    }
    const value = Number(ev.target.value);
    if (Number(this._config![ev.target.key].value) === value) {
      return;
    }
    this.debouncedUpdate(ev.target, value);
  }

  private _updateConfigParameter(target, value) {
    const nodeId = getNodeId(this._device!);
    setNodeConfigParameter(
      this.opp,
      this.configEntryId!,
      nodeId!,
      target.property,
      value,
      target.propertyKey ? target.propertyKey : undefined
    );
    this._config![target.key].value = value;
  }

  private get _device(): DeviceRegistryEntry | undefined {
    return getDevice(this.deviceId, this._deviceRegistryEntries);
  }

  private async _fetchData() {
    if (!this.configEntryId || !this._deviceRegistryEntries) {
      return;
    }

    const device = this._device;
    if (!device) {
      this._error = "device_not_found";
      return;
    }

    const nodeId = getNodeId(device);
    if (!nodeId) {
      this._error = "device_not_found";
      return;
    }

    this._config = await fetchNodeConfigParameters(
      this.opp,
      this.configEntryId,
      nodeId!
    );
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        .secondary {
          color: var(--secondary-text-color);
        }

        .flex {
          display: flex;
        }

        .flex .config-label,
        .flex paper-dropdown-menu {
          flex: 1;
        }

        .content {
          margin-top: 24px;
        }

        .sectionHeader {
          position: relative;
          padding-right: 40px;
        }

        op-card {
          margin: 0 auto;
          max-width: 600px;
        }

        op-settings-row {
          --paper-time-input-justify-content: flex-end;
          border-top: 1px solid var(--divider-color);
        }

        :host(:not([narrow])) op-settings-row paper-input {
          width: 30%;
          text-align: right;
        }

        op-card:last-child {
          margin-bottom: 24px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zwave_js-node-config": ZWaveJSNodeConfig;
  }
}
