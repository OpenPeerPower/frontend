import { OppEntity } from "openpeerpower-js-websocket";
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
import { fireEvent } from "../../../../common/dom/fire_event";
import { computeDomain } from "../../../../common/entity/compute_domain";
import { applyPatch, getPath } from "../../../../common/util/patch";
import "../../../../components/device/op-area-devices-picker";
import "../../../../components/entity/op-entity-picker";
import {
  AreaRegistryEntry,
  subscribeAreaRegistry,
} from "../../../../data/area_registry";
import {
  DeviceRegistryEntry,
  subscribeDeviceRegistry,
} from "../../../../data/device_registry";
import { subscribeEntityRegistry } from "../../../../data/entity_registry";
import { domainToName } from "../../../../data/integration";
import { SubscribeMixin } from "../../../../mixins/subscribe-mixin";
import { PolymerChangedEvent } from "../../../../polymer-types";
import { haStyleDialog } from "../../../../resources/styles";
import { OpenPeerPower } from "../../../../types";
import { Placeholder, PlaceholderContainer } from "./dialog-thingtalk";

declare global {
  // for fire event
  interface OPPDomEvents {
    "placeholders-filled": { value: PlaceholderValues };
  }
}

export interface PlaceholderValues {
  [key: string]: {
    [index: number]: {
      [index: number]: { device_id?: string; entity_id?: string };
    };
  };
}

export interface ExtraInfo {
  [key: string]: {
    [index: number]: {
      [index: number]: {
        area_id?: string;
        device_ids?: string[];
        manualEntity: boolean;
      };
    };
  };
}

interface DeviceEntitiesLookup {
  [deviceId: string]: string[];
}

@customElement("op-thingtalk-placeholders")
export class ThingTalkPlaceholders extends SubscribeMixin(LitElement) {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public opened!: boolean;

  public skip!: () => void;

  @property() public placeholders!: PlaceholderContainer;

  @internalProperty() private _error?: string;

  private _deviceEntityLookup: DeviceEntitiesLookup = {};

  @internalProperty() private _extraInfo: ExtraInfo = {};

  @internalProperty() private _placeholderValues: PlaceholderValues = {};

  private _devices?: DeviceRegistryEntry[];

  private _areas?: AreaRegistryEntry[];

  private _search = false;

  public oppSubscribe() {
    return [
      subscribeEntityRegistry(this.opp.connection, (entries) => {
        for (const entity of entries) {
          if (!entity.device_id) {
            continue;
          }
          if (!(entity.device_id in this._deviceEntityLookup)) {
            this._deviceEntityLookup[entity.device_id] = [];
          }
          if (
            !this._deviceEntityLookup[entity.device_id].includes(
              entity.entity_id
            )
          ) {
            this._deviceEntityLookup[entity.device_id].push(entity.entity_id);
          }
        }
      }),
      subscribeDeviceRegistry(this.opp.connection!, (devices) => {
        this._devices = devices;
        this._searchNames();
      }),
      subscribeAreaRegistry(this.opp.connection!, (areas) => {
        this._areas = areas;
        this._searchNames();
      }),
    ];
  }

  protected updated(changedProps: PropertyValues) {
    if (changedProps.has("placeholders")) {
      this._search = true;
      this._searchNames();
    }
  }

  protected render(): TemplateResult {
    return html`
      <op-paper-dialog
        modal
        with-backdrop
        .opened=${this.opened}
        @opened-changed="${this._openedChanged}"
      >
        <h2>
          ${this.opp.localize(
            `ui.panel.config.automation.thingtalk.link_devices.header`
          )}
        </h2>
        <paper-dialog-scrollable>
          ${this._error ? html` <div class="error">${this._error}</div> ` : ""}
          ${Object.entries(this.placeholders).map(
            ([type, placeholders]) =>
              html`
                <h3>
                  ${this.opp.localize(
                    `ui.panel.config.automation.editor.${type}s.name`
                  )}:
                </h3>
                ${placeholders.map((placeholder) => {
                  if (placeholder.fields.includes("device_id")) {
                    const extraInfo = getPath(this._extraInfo, [
                      type,
                      placeholder.index,
                    ]);
                    return html`
                      <op-area-devices-picker
                        .type=${type}
                        .placeholder=${placeholder}
                        @value-changed=${this._devicePicked}
                        .opp=${this.opp}
                        .area=${extraInfo ? extraInfo.area_id : undefined}
                        .devices=${extraInfo && extraInfo.device_ids
                          ? extraInfo.device_ids
                          : undefined}
                        .includeDomains=${placeholder.domains}
                        .includeDeviceClasses=${placeholder.device_classes}
                        .label=${this._getLabel(
                          placeholder.domains,
                          placeholder.device_classes
                        )}
                      ></op-area-devices-picker>
                      ${extraInfo && extraInfo.manualEntity
                        ? html`
                            <h3>
                              ${this.opp.localize(
                                `ui.panel.config.automation.thingtalk.link_devices.ambiguous_entities`
                              )}
                            </h3>
                            ${Object.keys(extraInfo.manualEntity).map(
                              (idx) => html`
                                <op-entity-picker
                                  id="device-entity-picker"
                                  .type=${type}
                                  .placeholder=${placeholder}
                                  .index=${idx}
                                  @change=${this._entityPicked}
                                  .includeDomains=${placeholder.domains}
                                  .includeDeviceClasses=${placeholder.device_classes}
                                  .opp=${this.opp}
                                  .label=${`${this._getLabel(
                                    placeholder.domains,
                                    placeholder.device_classes
                                  )} of device ${this._getDeviceName(
                                    getPath(this._placeholderValues, [
                                      type,
                                      placeholder.index,
                                      idx,
                                      "device_id",
                                    ])
                                  )}`}
                                  .entityFilter=${(state: OppEntity) => {
                                    const devId =
                                      this._placeholderValues[type][
                                        placeholder.index
                                      ][idx].device_id;
                                    return this._deviceEntityLookup[
                                      devId
                                    ].includes(state.entity_id);
                                  }}
                                ></op-entity-picker>
                              `
                            )}
                          `
                        : ""}
                    `;
                  }
                  if (placeholder.fields.includes("entity_id")) {
                    return html`
                      <op-entity-picker
                        .type=${type}
                        .placeholder=${placeholder}
                        @change=${this._entityPicked}
                        .includeDomains=${placeholder.domains}
                        .includeDeviceClasses=${placeholder.device_classes}
                        .opp=${this.opp}
                        .label=${this._getLabel(
                          placeholder.domains,
                          placeholder.device_classes
                        )}
                      ></op-entity-picker>
                    `;
                  }
                  return html`
                    <div class="error">
                      ${this.opp.localize(
                        `ui.panel.config.automation.thingtalk.link_devices.unknown_placeholder`
                      )}<br />
                      ${placeholder.domains}<br />
                      ${placeholder.fields.map(
                        (field) => html` ${field}<br /> `
                      )}
                    </div>
                  `;
                })}
              `
          )}
        </paper-dialog-scrollable>
        <div class="paper-dialog-buttons">
          <mwc-button class="left" @click="${this.skip}">
            ${this.opp.localize(`ui.common.skip`)}
          </mwc-button>
          <mwc-button @click="${this._done}" .disabled=${!this._isDone}>
            ${this.opp.localize(`ui.panel.config.automation.thingtalk.create`)}
          </mwc-button>
        </div>
      </op-paper-dialog>
    `;
  }

  private _getDeviceName(deviceId: string): string {
    if (!this._devices) {
      return "";
    }
    const foundDevice = this._devices.find((device) => device.id === deviceId);
    if (!foundDevice) {
      return "";
    }
    return foundDevice.name_by_user || foundDevice.name || "";
  }

  private _searchNames() {
    if (!this._search || !this._areas || !this._devices) {
      return;
    }
    this._search = false;
    Object.entries(this.placeholders).forEach(([type, placeholders]) =>
      placeholders.forEach((placeholder) => {
        if (!placeholder.name) {
          return;
        }
        const name = placeholder.name;
        const foundArea = this._areas!.find((area) =>
          area.name.toLowerCase().includes(name)
        );
        if (foundArea) {
          applyPatch(
            this._extraInfo,
            [type, placeholder.index, "area_id"],
            foundArea.area_id
          );
          this.requestUpdate("_extraInfo");
          return;
        }
        const foundDevices = this._devices!.filter((device) => {
          const deviceName = device.name_by_user || device.name;
          if (!deviceName) {
            return false;
          }
          return deviceName.toLowerCase().includes(name);
        });
        if (foundDevices.length) {
          applyPatch(
            this._extraInfo,
            [type, placeholder.index, "device_ids"],
            foundDevices.map((device) => device.id)
          );
          this.requestUpdate("_extraInfo");
        }
      })
    );
  }

  private get _isDone(): boolean {
    return Object.entries(this.placeholders).every(([type, placeholders]) =>
      placeholders.every((placeholder) =>
        placeholder.fields.every((field) => {
          const entries: {
            [key: number]: { device_id?: string; entity_id?: string };
          } = getPath(this._placeholderValues, [type, placeholder.index]);
          if (!entries) {
            return false;
          }
          const values = Object.values(entries);
          return values.every(
            (entry) => entry[field] !== undefined && entry[field] !== ""
          );
        })
      )
    );
  }

  private _getLabel(domains: string[], deviceClasses?: string[]) {
    return `${domains
      .map((domain) => domainToName(this.opp.localize, domain))
      .join(", ")}${
      deviceClasses ? ` of type ${deviceClasses.join(", ")}` : ""
    }`;
  }

  private _devicePicked(ev: CustomEvent): void {
    const value: string[] = ev.detail.value;
    if (!value) {
      return;
    }
    const target = ev.target as any;
    const placeholder = target.placeholder as Placeholder;
    const type = target.type;

    let oldValues = getPath(this._placeholderValues, [type, placeholder.index]);
    if (oldValues) {
      oldValues = Object.values(oldValues);
    }
    const oldExtraInfo = getPath(this._extraInfo, [type, placeholder.index]);

    if (this._placeholderValues[type]) {
      delete this._placeholderValues[type][placeholder.index];
    }

    if (this._extraInfo[type]) {
      delete this._extraInfo[type][placeholder.index];
    }

    if (!value.length) {
      this.requestUpdate("_placeholderValues");
      return;
    }

    value.forEach((deviceId, index) => {
      let oldIndex;
      if (oldValues) {
        const oldDevice = oldValues.find((oldVal, idx) => {
          oldIndex = idx;
          return oldVal.device_id === deviceId;
        });

        if (oldDevice) {
          applyPatch(
            this._placeholderValues,
            [type, placeholder.index, index],
            oldDevice
          );
          if (oldExtraInfo) {
            applyPatch(
              this._extraInfo,
              [type, placeholder.index, index],
              oldExtraInfo[oldIndex]
            );
          }
          return;
        }
      }

      applyPatch(
        this._placeholderValues,
        [type, placeholder.index, index, "device_id"],
        deviceId
      );

      if (!placeholder.fields.includes("entity_id")) {
        return;
      }

      const devEntities = this._deviceEntityLookup[deviceId];

      const entities = devEntities.filter((eid) => {
        if (placeholder.device_classes) {
          const stateObj = this.opp.states[eid];
          if (!stateObj) {
            return false;
          }
          return (
            placeholder.domains.includes(computeDomain(eid)) &&
            stateObj.attributes.device_class &&
            placeholder.device_classes.includes(
              stateObj.attributes.device_class
            )
          );
        }
        return placeholder.domains.includes(computeDomain(eid));
      });
      if (entities.length === 0) {
        // Should not happen because we filter the device picker on domain
        this._error = `No ${placeholder.domains
          .map((domain) => domainToName(this.opp.localize, domain))
          .join(", ")} entities found in this device.`;
      } else if (entities.length === 1) {
        applyPatch(
          this._placeholderValues,
          [type, placeholder.index, index, "entity_id"],
          entities[0]
        );
        this.requestUpdate("_placeholderValues");
      } else {
        delete this._placeholderValues[type][placeholder.index][index]
          .entity_id;
        applyPatch(
          this._extraInfo,
          [type, placeholder.index, "manualEntity", index],
          true
        );
        this.requestUpdate("_placeholderValues");
      }
    });

    fireEvent(
      this.shadowRoot!.querySelector("op-paper-dialog")! as HTMLElement,
      "iron-resize"
    );
  }

  private _entityPicked(ev: Event): void {
    const target = ev.target as any;
    const placeholder = target.placeholder as Placeholder;
    const value = target.value;
    const type = target.type;
    const index = target.index || 0;
    applyPatch(
      this._placeholderValues,
      [type, placeholder.index, index, "entity_id"],
      value
    );
    this.requestUpdate("_placeholderValues");
  }

  private _done(): void {
    fireEvent(this, "placeholders-filled", { value: this._placeholderValues });
  }

  private _openedChanged(ev: PolymerChangedEvent<boolean>): void {
    // The opened-changed event doesn't leave the shadowdom so we re-dispatch it
    this.dispatchEvent(new CustomEvent(ev.type, ev));
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        op-paper-dialog {
          max-width: 500px;
        }
        mwc-button.left {
          margin-right: auto;
        }
        paper-dialog-scrollable {
          margin-top: 10px;
        }
        h3 {
          margin: 10px 0 0 0;
          font-weight: 500;
        }
        .error {
          color: var(--error-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-thingtalk-placeholders": ThingTalkPlaceholders;
  }
}
