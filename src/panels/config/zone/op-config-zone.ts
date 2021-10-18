import "../../../components/op-fab";
import "@material/mwc-icon-button";
import { mdiPencil, mdiPencilOff, mdiPlus } from "@mdi/js";
import "@polymer/paper-item/paper-icon-item";
import "@polymer/paper-item/paper-item-body";
import "@polymer/paper-listbox/paper-listbox";
import "@polymer/paper-tooltip/paper-tooltip";
import { OppEntity, UnsubscribeFunc } from "openpeerpower-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  query,
  TemplateResult,
} from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";
import memoizeOne from "memoize-one";
import { computeStateDomain } from "../../../common/entity/compute_state_domain";
import { navigate } from "../../../common/navigate";
import { compare } from "../../../common/string/compare";
import "../../../components/op-card";
import "../../../components/op-svg-icon";
import "../../../components/map/ha-locations-editor";
import type {
  HaLocationsEditor,
  MarkerLocation,
} from "../../../components/map/ha-locations-editor";
import { saveCoreConfig } from "../../../data/core";
import { subscribeEntityRegistry } from "../../../data/entity_registry";
import {
  createZone,
  defaultRadiusColor,
  deleteZone,
  fetchZones,
  homeRadiusColor,
  passiveRadiusColor,
  updateZone,
  Zone,
  ZoneMutableParams,
} from "../../../data/zone";
import { showConfirmationDialog } from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/opp-loading-screen";
import "../../../layouts/opp-tabs-subpage";
import { SubscribeMixin } from "../../../mixins/subscribe-mixin";
import type { OpenPeerPower, Route } from "../../../types";
import "../ha-config-section";
import { configSections } from "../op-panel-config";
import { showZoneDetailDialog } from "./show-dialog-zone-detail";

@customElement("ha-config-zone")
export class HaConfigZone extends SubscribeMixin(LitElement) {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide?: boolean;

  @property() public narrow?: boolean;

  @property() public route!: Route;

  @internalProperty() private _storageItems?: Zone[];

  @internalProperty() private _stateItems?: OppEntity[];

  @internalProperty() private _activeEntry = "";

  @internalProperty() private _canEditCore = false;

  @query("ha-locations-editor") private _map?: HaLocationsEditor;

  private _regEntities: string[] = [];

  private _getZones = memoizeOne(
    (storageItems: Zone[], stateItems: OppEntity[]): MarkerLocation[] => {
      const stateLocations: MarkerLocation[] = stateItems.map((state) => {
        return {
          id: state.entity_id,
          icon: state.attributes.icon,
          name: state.attributes.friendly_name || state.entity_id,
          latitude: state.attributes.latitude,
          longitude: state.attributes.longitude,
          radius: state.attributes.radius,
          radius_color:
            state.entity_id === "zone.home"
              ? homeRadiusColor
              : state.attributes.passive
              ? passiveRadiusColor
              : defaultRadiusColor,
          location_editable:
            state.entity_id === "zone.home" && this._canEditCore,
          radius_editable: false,
        };
      });
      const storageLocations: MarkerLocation[] = storageItems.map((zone) => {
        return {
          ...zone,
          radius_color: zone.passive ? passiveRadiusColor : defaultRadiusColor,
          location_editable: true,
          radius_editable: true,
        };
      });
      return storageLocations.concat(stateLocations);
    }
  );

  public oppSubscribe(): UnsubscribeFunc[] {
    return [
      subscribeEntityRegistry(this.opp.connection!, (entities) => {
        this._regEntities = entities.map(
          (registryEntry) => registryEntry.entity_id
        );
        this._filterStates();
      }),
    ];
  }

  protected render(): TemplateResult {
    if (
      !this.opp ||
      this._storageItems === undefined ||
      this._stateItems === undefined
    ) {
      return html` <opp-loading-screen></opp-loading-screen> `;
    }
    const opp = this.opp;
    const listBox =
      this._storageItems.length === 0 && this._stateItems.length === 0
        ? html`
            <div class="empty">
              ${opp.localize("ui.panel.config.zone.no_zones_created_yet")}
              <br />
              <mwc-button @click=${this._createZone}>
                ${opp.localize("ui.panel.config.zone.create_zone")}</mwc-button
              >
            </div>
          `
        : html`
            <paper-listbox
              attr-for-selected="data-id"
              .selected=${this._activeEntry || ""}
            >
              ${this._storageItems.map((entry) => {
                return html`
                  <paper-icon-item
                    data-id=${entry.id}
                    @click=${this._itemClicked}
                    .entry=${entry}
                  >
                    <op-icon .icon=${entry.icon} slot="item-icon"></op-icon>
                    <paper-item-body> ${entry.name} </paper-item-body>
                    ${!this.narrow
                      ? html`
                          <mwc-icon-button
                            .entry=${entry}
                            @click=${this._openEditEntry}
                          >
                            <op-svg-icon .path=${mdiPencil}></op-svg-icon>
                          </mwc-icon-button>
                        `
                      : ""}
                  </paper-icon-item>
                `;
              })}
              ${this._stateItems.map((state) => {
                return html`
                  <paper-icon-item
                    data-id=${state.entity_id}
                    @click=${this._stateItemClicked}
                  >
                    <op-icon .icon=${state.attributes.icon} slot="item-icon">
                    </op-icon>
                    <paper-item-body>
                      ${state.attributes.friendly_name || state.entity_id}
                    </paper-item-body>
                    <div style="display:inline-block">
                      <mwc-icon-button
                        .entityId=${state.entity_id}
                        @click=${this._openCoreConfig}
                        disabled=${ifDefined(
                          state.entity_id === "zone.home" &&
                            this.narrow &&
                            this._canEditCore
                            ? undefined
                            : true
                        )}
                      >
                        <op-svg-icon
                          .path=${state.entity_id === "zone.home" &&
                          this.narrow &&
                          this._canEditCore
                            ? mdiPencil
                            : mdiPencilOff}
                        ></op-svg-icon>
                      </mwc-icon-button>
                      <paper-tooltip animation-delay="0" position="left">
                        ${state.entity_id === "zone.home"
                          ? this.opp.localize(
                              `ui.panel.config.zone.${
                                this.narrow
                                  ? "edit_home_zone_narrow"
                                  : "edit_home_zone"
                              }`
                            )
                          : this.opp.localize(
                              "ui.panel.config.zone.configured_in_yaml"
                            )}
                      </paper-tooltip>
                    </div>
                  </paper-icon-item>
                `;
              })}
            </paper-listbox>
          `;

    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        back-path="/config"
        .tabs=${configSections.persons}
      >
        ${this.narrow
          ? html`
              <op-config-section .isWide=${this.isWide}>
                <span slot="introduction">
                  ${opp.localize("ui.panel.config.zone.introduction")}
                </span>
                <op-card>${listBox}</op-card>
              </op-config-section>
            `
          : ""}
        ${!this.narrow
          ? html`
              <div class="flex">
                <op-locations-editor
                  .opp=${this.opp}
                  .locations=${this._getZones(
                    this._storageItems,
                    this._stateItems
                  )}
                  @location-updated=${this._locationUpdated}
                  @radius-updated=${this._radiusUpdated}
                  @marker-clicked=${this._markerClicked}
                ></op-locations-editor>
                <div class="overflow">${listBox}</div>
              </div>
            `
          : ""}
        <op-fab
          slot="fab"
          .label=${opp.localize("ui.panel.config.zone.add_zone")}
          extended
          @click=${this._createZone}
        >
          <op-svg-icon slot="icon" .path=${mdiPlus}></op-svg-icon>
        </op-fab>
      </opp-tabs-subpage>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._canEditCore =
      Boolean(this.opp.user?.is_admin) &&
      ["storage", "default"].includes(this.opp.config.config_source);
    this._fetchData();
    if (this.route.path === "/new") {
      navigate(this, "/config/zone", true);
      this._createZone();
    }
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    if (oldOpp && this._stateItems) {
      this._getStates(oldOpp);
    }
  }

  private async _fetchData() {
    this._storageItems = (await fetchZones(this.opp!)).sort((ent1, ent2) =>
      compare(ent1.name, ent2.name)
    );
    this._getStates();
  }

  private _getStates(oldOpp?: OpenPeerPower) {
    let changed = false;
    const tempStates = Object.values(this.opp!.states).filter((entity) => {
      if (computeStateDomain(entity) !== "zone") {
        return false;
      }
      if (oldOpp?.states[entity.entity_id] !== entity) {
        changed = true;
      }
      if (this._regEntities.includes(entity.entity_id)) {
        return false;
      }
      return true;
    });

    if (changed) {
      this._stateItems = tempStates;
    }
  }

  private _filterStates() {
    if (!this._stateItems) {
      return;
    }
    const tempStates = this._stateItems.filter(
      (entity) => !this._regEntities.includes(entity.entity_id)
    );
    if (tempStates.length !== this._stateItems.length) {
      this._stateItems = tempStates;
    }
  }

  private async _locationUpdated(ev: CustomEvent) {
    this._activeEntry = ev.detail.id;
    if (ev.detail.id === "zone.home" && this._canEditCore) {
      await saveCoreConfig(this.opp, {
        latitude: ev.detail.location[0],
        longitude: ev.detail.location[1],
      });
      return;
    }
    const entry = this._storageItems!.find((item) => item.id === ev.detail.id);
    if (!entry) {
      return;
    }
    this._updateEntry(entry, {
      latitude: ev.detail.location[0],
      longitude: ev.detail.location[1],
    });
  }

  private _radiusUpdated(ev: CustomEvent) {
    this._activeEntry = ev.detail.id;
    const entry = this._storageItems!.find((item) => item.id === ev.detail.id);
    if (!entry) {
      return;
    }
    this._updateEntry(entry, {
      radius: ev.detail.radius,
    });
  }

  private _markerClicked(ev: CustomEvent) {
    this._activeEntry = ev.detail.id;
  }

  private _createZone() {
    this._openDialog();
  }

  private _itemClicked(ev: Event) {
    if (this.narrow) {
      this._openEditEntry(ev);
      return;
    }
    const entry: Zone = (ev.currentTarget! as any).entry;
    this._zoomZone(entry.id);
  }

  private _stateItemClicked(ev: Event) {
    const entityId = (ev.currentTarget! as HTMLElement).getAttribute(
      "data-id"
    )!;
    this._zoomZone(entityId);
  }

  private _zoomZone(id: string) {
    this._map?.fitMarker(id);
  }

  private _openEditEntry(ev: Event) {
    const entry: Zone = (ev.currentTarget! as any).entry;
    this._openDialog(entry);
  }

  private async _openCoreConfig(ev: Event) {
    const entityId: string = (ev.currentTarget! as any).entityId;
    if (entityId !== "zone.home" || !this.narrow || !this._canEditCore) {
      return;
    }
    if (
      !(await showConfirmationDialog(this, {
        title: this.opp.localize("ui.panel.config.zone.go_to_core_config"),
        text: this.opp.localize("ui.panel.config.zone.home_zone_core_config"),
        confirmText: this.opp!.localize("ui.common.yes"),
        dismissText: this.opp!.localize("ui.common.no"),
      }))
    ) {
      return;
    }
    navigate(this, "/config/core");
  }

  private async _createEntry(values: ZoneMutableParams) {
    const created = await createZone(this.opp!, values);
    this._storageItems = this._storageItems!.concat(created).sort(
      (ent1, ent2) => compare(ent1.name, ent2.name)
    );
    if (this.narrow) {
      return;
    }
    await this.updateComplete;
    this._activeEntry = created.id;
    this._map?.fitMarker(created.id);
  }

  private async _updateEntry(
    entry: Zone,
    values: Partial<ZoneMutableParams>,
    fitMap = false
  ) {
    const updated = await updateZone(this.opp!, entry!.id, values);
    this._storageItems = this._storageItems!.map((ent) =>
      ent === entry ? updated : ent
    );
    if (this.narrow || !fitMap) {
      return;
    }
    await this.updateComplete;
    this._activeEntry = entry.id;
    this._map?.fitMarker(entry.id);
  }

  private async _removeEntry(entry: Zone) {
    if (
      !(await showConfirmationDialog(this, {
        title: this.opp!.localize("ui.panel.config.zone.confirm_delete"),
        dismissText: this.opp!.localize("ui.common.cancel"),
        confirmText: this.opp!.localize("ui.common.delete"),
      }))
    ) {
      return false;
    }

    try {
      await deleteZone(this.opp!, entry!.id);
      this._storageItems = this._storageItems!.filter((ent) => ent !== entry);
      if (!this.narrow) {
        this._map?.fitMap();
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  private async _openDialog(entry?: Zone) {
    showZoneDetailDialog(this, {
      entry,
      createEntry: (values) => this._createEntry(values),
      updateEntry: entry
        ? (values) => this._updateEntry(entry, values, true)
        : undefined,
      removeEntry: entry ? () => this._removeEntry(entry) : undefined,
    });
  }

  static get styles(): CSSResult {
    return css`
      opp-loading-screen {
        --app-header-background-color: var(--sidebar-background-color);
        --app-header-text-color: var(--sidebar-text-color);
      }
      a {
        color: var(--primary-color);
      }
      op-card {
        max-width: 600px;
        margin: 16px auto;
        overflow: hidden;
      }
      op-icon,
      mwc-icon-button:not([disabled]) {
        color: var(--secondary-text-color);
      }
      mwc-icon-button {
        --mdc-theme-text-disabled-on-light: var(--disabled-text-color);
      }
      .empty {
        text-align: center;
        padding: 8px;
      }
      .flex {
        display: flex;
        height: 100%;
      }
      .overflow {
        height: 100%;
        overflow: auto;
      }
      ha-locations-editor {
        flex-grow: 1;
        height: 100%;
      }
      .flex paper-listbox,
      .flex .empty {
        border-left: 1px solid var(--divider-color);
        width: 250px;
        min-height: 100%;
        box-sizing: border-box;
      }
      paper-icon-item {
        padding-top: 4px;
        padding-bottom: 4px;
      }
      .overflow paper-icon-item:last-child {
        margin-bottom: 80px;
      }
      paper-icon-item.iron-selected:before {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        pointer-events: none;
        content: "";
        background-color: var(--sidebar-selected-icon-color);
        opacity: 0.12;
        transition: opacity 15ms linear;
        will-change: opacity;
      }
      op-card {
        margin-bottom: 100px;
      }
      op-card paper-item {
        cursor: pointer;
      }
    `;
  }
}
