import "@material/mwc-list/mwc-list-item";
import type { RequestSelectedDetail } from "@material/mwc-list/mwc-list-item";
import { mdiCancel, mdiFilterVariant, mdiPlus } from "@mdi/js";
import "@polymer/paper-tooltip/paper-tooltip";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { OPPDomEvent } from "../../../common/dom/fire_event";
import { computeStateDomain } from "../../../common/entity/compute_state_domain";
import { navigate } from "../../../common/navigate";
import { LocalizeFunc } from "../../../common/translations/localize";
import { computeRTL } from "../../../common/util/compute_rtl";
import {
  DataTableColumnContainer,
  DataTableRowData,
  RowClickedEvent,
} from "../../../components/data-table/ha-data-table";
import "../../../components/entity/ha-battery-icon";
import "../../../components/ha-button-menu";
import { AreaRegistryEntry } from "../../../data/area_registry";
import { ConfigEntry } from "../../../data/config_entries";
import {
  computeDeviceName,
  DeviceEntityLookup,
  DeviceRegistryEntry,
} from "../../../data/device_registry";
import {
  EntityRegistryEntry,
  findBatteryChargingEntity,
  findBatteryEntity,
} from "../../../data/entity_registry";
import { domainToName } from "../../../data/integration";
import "../../../layouts/opp-tabs-subpage-data-table";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { configSections } from "../ha-panel-config";

interface DeviceRowData extends DeviceRegistryEntry {
  device?: DeviceRowData;
  area?: string;
  integration?: string;
  battery_entity?: [string | undefined, string | undefined];
}

@customElement("ha-config-devices-dashboard")
export class HaConfigDeviceDashboard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow = false;

  @property() public isWide = false;

  @property() public devices!: DeviceRegistryEntry[];

  @property() public entries!: ConfigEntry[];

  @property() public entities!: EntityRegistryEntry[];

  @property() public areas!: AreaRegistryEntry[];

  @property() public route!: Route;

  @internalProperty() private _searchParms = new URLSearchParams(
    window.location.search
  );

  @internalProperty() private _showDisabled = false;

  @internalProperty() private _filter = "";

  @internalProperty() private _numHiddenDevices = 0;

  private _activeFilters = memoizeOne(
    (
      entries: ConfigEntry[],
      filters: URLSearchParams,
      localize: LocalizeFunc
    ): string[] | undefined => {
      const filterTexts: string[] = [];
      filters.forEach((value, key) => {
        switch (key) {
          case "config_entry": {
            // If we are requested to show the devices for a given config entry,
            // also show the disabled ones by default.
            this._showDisabled = true;

            const configEntry = entries.find(
              (entry) => entry.entry_id === value
            );
            if (!configEntry) {
              break;
            }
            const integrationName = domainToName(localize, configEntry.domain);
            filterTexts.push(
              `${this.opp.localize(
                "ui.panel.config.integrations.integration"
              )} "${integrationName}${
                integrationName !== configEntry.title
                  ? `: ${configEntry.title}`
                  : ""
              }"`
            );
            break;
          }
        }
      });
      return filterTexts.length ? filterTexts : undefined;
    }
  );

  private _devicesAndFilterDomains = memoizeOne(
    (
      devices: DeviceRegistryEntry[],
      entries: ConfigEntry[],
      entities: EntityRegistryEntry[],
      areas: AreaRegistryEntry[],
      filters: URLSearchParams,
      showDisabled: boolean,
      localize: LocalizeFunc
    ) => {
      // Some older installations might have devices pointing at invalid entryIDs
      // So we guard for that.

      let outputDevices: DeviceRowData[] = devices;

      const deviceLookup: { [deviceId: string]: DeviceRegistryEntry } = {};
      for (const device of devices) {
        deviceLookup[device.id] = device;
      }

      // If nothing gets filtered, this is our correct count of devices
      let startLength = outputDevices.length;

      const deviceEntityLookup: DeviceEntityLookup = {};
      for (const entity of entities) {
        if (!entity.device_id) {
          continue;
        }
        if (!(entity.device_id in deviceEntityLookup)) {
          deviceEntityLookup[entity.device_id] = [];
        }
        deviceEntityLookup[entity.device_id].push(entity);
      }

      const entryLookup: { [entryId: string]: ConfigEntry } = {};
      for (const entry of entries) {
        entryLookup[entry.entry_id] = entry;
      }

      const areaLookup: { [areaId: string]: AreaRegistryEntry } = {};
      for (const area of areas) {
        areaLookup[area.area_id] = area;
      }

      const filterDomains: string[] = [];

      filters.forEach((value, key) => {
        if (key === "config_entry") {
          outputDevices = outputDevices.filter((device) =>
            device.config_entries.includes(value)
          );
          startLength = outputDevices.length;
          const configEntry = entries.find((entry) => entry.entry_id === value);
          if (configEntry) {
            filterDomains.push(configEntry.domain);
          }
        }
      });

      if (!showDisabled) {
        outputDevices = outputDevices.filter((device) => !device.disabled_by);
      }

      outputDevices = outputDevices.map((device) => {
        return {
          ...device,
          name: computeDeviceName(
            device,
            this.opp,
            deviceEntityLookup[device.id]
          ),
          model: device.model || "<unknown>",
          manufacturer: device.manufacturer || "<unknown>",
          area: device.area_id ? areaLookup[device.area_id].name : undefined,
          integration: device.config_entries.length
            ? device.config_entries
                .filter((entId) => entId in entryLookup)
                .map(
                  (entId) =>
                    localize(`component.${entryLookup[entId].domain}.title`) ||
                    entryLookup[entId].domain
                )
                .join(", ")
            : "No integration",
          battery_entity: [
            this._batteryEntity(device.id, deviceEntityLookup),
            this._batteryChargingEntity(device.id, deviceEntityLookup),
          ],
        };
      });

      this._numHiddenDevices = startLength - outputDevices.length;
      return { devicesOutput: outputDevices, filteredDomains: filterDomains };
    }
  );

  private _columns = memoizeOne(
    (narrow: boolean, showDisabled: boolean): DataTableColumnContainer => {
      const columns: DataTableColumnContainer = narrow
        ? {
            name: {
              title: this.opp.localize(
                "ui.panel.config.devices.data_table.device"
              ),
              sortable: true,
              filterable: true,
              direction: "asc",
              grows: true,
              template: (name, device: DataTableRowData) => {
                return html`
                  ${name}
                  <div class="secondary">
                    ${device.area} | ${device.integration}
                  </div>
                `;
              },
            },
          }
        : {
            name: {
              title: this.opp.localize(
                "ui.panel.config.devices.data_table.device"
              ),
              sortable: true,
              filterable: true,
              grows: true,
              direction: "asc",
            },
          };

      columns.manufacturer = {
        title: this.opp.localize(
          "ui.panel.config.devices.data_table.manufacturer"
        ),
        sortable: true,
        hidden: narrow,
        filterable: true,
        width: "15%",
      };
      columns.model = {
        title: this.opp.localize("ui.panel.config.devices.data_table.model"),
        sortable: true,
        hidden: narrow,
        filterable: true,
        width: "15%",
      };
      columns.area = {
        title: this.opp.localize("ui.panel.config.devices.data_table.area"),
        sortable: true,
        hidden: narrow,
        filterable: true,
        width: "15%",
      };
      columns.integration = {
        title: this.opp.localize(
          "ui.panel.config.devices.data_table.integration"
        ),
        sortable: true,
        hidden: narrow,
        filterable: true,
        width: "15%",
      };
      columns.battery_entity = {
        title: this.opp.localize("ui.panel.config.devices.data_table.battery"),
        sortable: true,
        type: "numeric",
        width: narrow ? "95px" : "15%",
        maxWidth: "95px",
        template: (batteryEntityPair: DeviceRowData["battery_entity"]) => {
          const battery =
            batteryEntityPair && batteryEntityPair[0]
              ? this.opp.states[batteryEntityPair[0]]
              : undefined;
          const batteryCharging =
            batteryEntityPair && batteryEntityPair[1]
              ? this.opp.states[batteryEntityPair[1]]
              : undefined;
          const batteryIsBinary =
            battery && computeStateDomain(battery) === "binary_sensor";
          return battery && (batteryIsBinary || !isNaN(battery.state as any))
            ? html`
                ${batteryIsBinary ? "" : battery.state + " %"}
                <op-battery-icon
                  .opp=${this.opp!}
                  .batteryStateObj=${battery}
                  .batteryChargingStateObj=${batteryCharging}
                ></op-battery-icon>
              `
            : html` - `;
        },
      };
      if (showDisabled) {
        columns.disabled_by = {
          title: "",
          type: "icon",
          template: (disabled_by) =>
            disabled_by
              ? html`<div
                  tabindex="0"
                  style="display:inline-block; position: relative;"
                >
                  <op-svg-icon .path=${mdiCancel}></op-svg-icon>
                  <paper-tooltip animation-delay="0" position="left">
                    ${this.opp.localize("ui.panel.config.devices.disabled")}
                  </paper-tooltip>
                </div>`
              : "",
        };
      }
      return columns;
    }
  );

  public constructor() {
    super();
    window.addEventListener("location-changed", () => {
      this._searchParms = new URLSearchParams(window.location.search);
    });
    window.addEventListener("popstate", () => {
      this._searchParms = new URLSearchParams(window.location.search);
    });
  }

  protected render(): TemplateResult {
    const { devicesOutput, filteredDomains } = this._devicesAndFilterDomains(
      this.devices,
      this.entries,
      this.entities,
      this.areas,
      this._searchParms,
      this._showDisabled,
      this.opp.localize
    );
    const includeZHAFab = filteredDomains.includes("zha");
    const activeFilters = this._activeFilters(
      this.entries,
      this._searchParms,
      this.opp.localize
    );

    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        .backPath=${this._searchParms.has("historyBack")
          ? undefined
          : "/config"}
        .tabs=${configSections.integrations}
        .route=${this.route}
        .activeFilters=${activeFilters}
        .numHidden=${this._numHiddenDevices}
        .searchLabel=${this.opp.localize(
          "ui.panel.config.devices.picker.search"
        )}
        .hiddenLabel=${this.opp.localize(
          "ui.panel.config.devices.picker.filter.hidden_devices",
          "number",
          this._numHiddenDevices
        )}
        .columns=${this._columns(this.narrow, this._showDisabled)}
        .data=${devicesOutput}
        .filter=${this._filter}
        @clear-filter=${this._clearFilter}
        @search-changed=${this._handleSearchChange}
        @row-click=${this._handleRowClicked}
        clickable
        .hasFab=${includeZHAFab}
      >
        ${includeZHAFab
          ? html`<a href="/config/zha/add" slot="fab">
              <op-fab
                .label=${this.opp.localize("ui.panel.config.zha.add_device")}
                extended
                ?rtl=${computeRTL(this.opp)}
              >
                <op-svg-icon slot="icon" .path=${mdiPlus}></op-svg-icon>
              </op-fab>
            </a>`
          : html``}
        <op-button-menu slot="filter-menu" corner="BOTTOM_START" multi>
          <mwc-icon-button
            slot="trigger"
            .label=${this.opp!.localize(
              "ui.panel.config.devices.picker.filter.filter"
            )}
            .title=${this.opp!.localize(
              "ui.panel.config.devices.picker.filter.filter"
            )}
          >
            <op-svg-icon .path=${mdiFilterVariant}></op-svg-icon>
          </mwc-icon-button>
          <mwc-list-item
            @request-selected="${this._showDisabledChanged}"
            graphic="control"
            .selected=${this._showDisabled}
          >
            <op-checkbox
              slot="graphic"
              .checked=${this._showDisabled}
            ></op-checkbox>
            ${this.opp!.localize(
              "ui.panel.config.devices.picker.filter.show_disabled"
            )}
          </mwc-list-item>
        </op-button-menu>
      </opp-tabs-subpage-data-table>
    `;
  }

  private _batteryEntity(
    deviceId: string,
    deviceEntityLookup: DeviceEntityLookup
  ): string | undefined {
    const batteryEntity = findBatteryEntity(
      this.opp,
      deviceEntityLookup[deviceId] || []
    );
    return batteryEntity ? batteryEntity.entity_id : undefined;
  }

  private _batteryChargingEntity(
    deviceId: string,
    deviceEntityLookup: DeviceEntityLookup
  ): string | undefined {
    const batteryChargingEntity = findBatteryChargingEntity(
      this.opp,
      deviceEntityLookup[deviceId] || []
    );
    return batteryChargingEntity ? batteryChargingEntity.entity_id : undefined;
  }

  private _handleRowClicked(ev: OPPDomEvent<RowClickedEvent>) {
    const deviceId = ev.detail.id;
    navigate(this, `/config/devices/device/${deviceId}`);
  }

  private _showDisabledChanged(ev: CustomEvent<RequestSelectedDetail>) {
    if (ev.detail.source !== "property") {
      return;
    }
    this._showDisabled = ev.detail.selected;
  }

  private _handleSearchChange(ev: CustomEvent) {
    this._filter = ev.detail.value;
  }

  private _clearFilter() {
    if (
      this._activeFilters(this.entries, this._searchParms, this.opp.localize)
    ) {
      navigate(this, window.location.pathname, true);
    }
    this._showDisabled = true;
  }

  static get styles(): CSSResult[] {
    return [
      css`
        ha-button-menu {
          margin: 0 -8px 0 8px;
        }
      `,
      haStyle,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-devices-dashboard": HaConfigDeviceDashboard;
  }
}