import { mdiPlus } from "@mdi/js";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { OPPDomEvent } from "../../../common/dom/fire_event";
import { navigate } from "../../../common/navigate";
import {
  DataTableColumnContainer,
  RowClickedEvent,
} from "../../../components/data-table/ha-data-table";
import "../../../components/ha-fab";
import "../../../components/ha-icon-button";
import "../../../components/ha-svg-icon";
import {
  AreaRegistryEntry,
  createAreaRegistryEntry,
} from "../../../data/area_registry";
import {
  DeviceRegistryEntry,
  devicesInArea,
} from "../../../data/device_registry";
import { showAlertDialog } from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/opp-loading-screen";
import "../../../layouts/opp-tabs-subpage-data-table";
import { OpenPeerPower, Route } from "../../../types";
import "../ha-config-section";
import { configSections } from "../ha-panel-config";
import {
  loadAreaRegistryDetailDialog,
  showAreaRegistryDetailDialog,
} from "./show-dialog-area-registry-detail";

@customElement("ha-config-areas-dashboard")
export class HaConfigAreasDashboard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide?: boolean;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @property() public areas!: AreaRegistryEntry[];

  @property() public devices!: DeviceRegistryEntry[];

  private _areas = memoizeOne(
    (areas: AreaRegistryEntry[], devices: DeviceRegistryEntry[]) => {
      return areas.map((area) => {
        return {
          ...area,
          devices: devicesInArea(devices, area.area_id).length,
        };
      });
    }
  );

  private _columns = memoizeOne(
    (narrow: boolean): DataTableColumnContainer =>
      narrow
        ? {
            name: {
              title: this.opp.localize(
                "ui.panel.config.areas.data_table.area"
              ),
              sortable: true,
              filterable: true,
              grows: true,
              direction: "asc",
            },
          }
        : {
            name: {
              title: this.opp.localize(
                "ui.panel.config.areas.data_table.area"
              ),
              sortable: true,
              filterable: true,
              grows: true,
              direction: "asc",
            },
            devices: {
              title: this.opp.localize(
                "ui.panel.config.areas.data_table.devices"
              ),
              sortable: true,
              type: "numeric",
              width: "20%",
              direction: "asc",
            },
          }
  );

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        .isWide=${this.isWide}
        back-path="/config"
        .tabs=${configSections.integrations}
        .route=${this.route}
        .columns=${this._columns(this.narrow)}
        .data=${this._areas(this.areas, this.devices)}
        @row-click=${this._handleRowClicked}
        .noDataText=${this.opp.localize(
          "ui.panel.config.areas.picker.no_areas"
        )}
        id="area_id"
        hasFab
        clickable
      >
        <ha-icon-button
          slot="toolbar-icon"
          icon="opp:help-circle"
          @click=${this._showHelp}
        ></ha-icon-button>
        <ha-fab
          slot="fab"
          .label=${this.opp.localize(
            "ui.panel.config.areas.picker.create_area"
          )}
          extended
          @click=${this._createArea}
        >
          <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
      </opp-tabs-subpage-data-table>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    loadAreaRegistryDetailDialog();
  }

  private _createArea() {
    this._openDialog();
  }

  private _showHelp() {
    showAlertDialog(this, {
      title: this.opp.localize("ui.panel.config.areas.caption"),
      text: html`
        ${this.opp.localize("ui.panel.config.areas.picker.introduction")}
        <p>
          ${this.opp.localize("ui.panel.config.areas.picker.introduction2")}
        </p>
        <a href="/config/integrations/dashboard">
          ${this.opp.localize(
            "ui.panel.config.areas.picker.integrations_page"
          )}
        </a>
      `,
    });
  }

  private _handleRowClicked(ev: OPPDomEvent<RowClickedEvent>) {
    const areaId = ev.detail.id;
    navigate(this, `/config/areas/area/${areaId}`);
  }

  private _openDialog(entry?: AreaRegistryEntry) {
    showAreaRegistryDetailDialog(this, {
      entry,
      createEntry: async (values) =>
        createAreaRegistryEntry(this.opp!, values),
    });
  }

  static get styles(): CSSResult {
    return css`
      opp-loading-screen {
        --app-header-background-color: var(--sidebar-background-color);
        --app-header-text-color: var(--sidebar-text-color);
      }
    `;
  }
}
