import "@material/mwc-icon-button";
import type { Corner } from "@material/mwc-menu";
import { mdiFilterVariant } from "@mdi/js";
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
import "@material/mwc-menu/mwc-menu-surface";
import { fireEvent } from "../common/dom/fire_event";
import { findRelated, RelatedResult } from "../data/search";
import type { OpenPeerPower } from "../types";
import "./ha-svg-icon";
import "./ha-area-picker";
import "./device/ha-device-picker";
import "./entity/ha-entity-picker";
import { computeStateName } from "../common/entity/compute_state_name";
import { computeDeviceName } from "../data/device_registry";

declare global {
  // for fire event
  interface OPPDomEvents {
    "related-changed": {
      value?: FilterValue;
      items?: RelatedResult;
      filter?: string;
    };
  }
}

interface FilterValue {
  area?: string;
  device?: string;
  entity?: string;
}

@customElement("ha-button-related-filter-menu")
export class HaRelatedFilterButtonMenu extends LitElement {
  @property() public opp!: OpenPeerPower;

  @property() public corner: Corner = "TOP_START";

  @property({ type: Boolean, reflect: true }) public narrow = false;

  @property({ type: Boolean }) public disabled = false;

  @property({ attribute: false }) public value?: FilterValue;

  /**
   * Show no entities of these domains.
   * @type {Array}
   * @attr exclude-domains
   */
  @property({ type: Array, attribute: "exclude-domains" })
  public excludeDomains?: string[];

  @internalProperty() private _open = false;

  protected render(): TemplateResult {
    return html`
      <mwc-icon-button @click=${this._handleClick}>
        <ha-svg-icon .path=${mdiFilterVariant}></ha-svg-icon>
      </mwc-icon-button>
      <mwc-menu-surface
        .open=${this._open}
        .anchor=${this}
        .fullwidth=${this.narrow}
        .corner=${this.corner}
        @closed=${this._onClosed}
      >
        <ha-area-picker
          .label=${this.opp.localize(
            "ui.components.related-filter-menu.filter_by_area"
          )}
          .opp=${this.opp}
          .value=${this.value?.area}
          no-add
          @value-changed=${this._areaPicked}
        ></ha-area-picker>
        <ha-device-picker
          .label=${this.opp.localize(
            "ui.components.related-filter-menu.filter_by_device"
          )}
          .opp=${this.opp}
          .value=${this.value?.device}
          @value-changed=${this._devicePicked}
        ></ha-device-picker>
        <ha-entity-picker
          .label=${this.opp.localize(
            "ui.components.related-filter-menu.filter_by_entity"
          )}
          .opp=${this.opp}
          .value=${this.value?.entity}
          .excludeDomains=${this.excludeDomains}
          @value-changed=${this._entityPicked}
        ></ha-entity-picker>
      </mwc-menu-surface>
    `;
  }

  private _handleClick(): void {
    if (this.disabled) {
      return;
    }
    this._open = true;
  }

  private _onClosed(): void {
    this._open = false;
  }

  private async _entityPicked(ev: CustomEvent) {
    const entityId = ev.detail.value;
    if (!entityId) {
      fireEvent(this, "related-changed", { value: undefined });
      return;
    }
    const filter = this.opp.localize(
      "ui.components.related-filter-menu.filtered_by_entity",
      "entity_name",
      computeStateName((ev.currentTarget as any).comboBox.selectedItem)
    );
    const items = await findRelated(this.opp, "entity", entityId);
    fireEvent(this, "related-changed", {
      value: { entity: entityId },
      filter,
      items,
    });
  }

  private async _devicePicked(ev: CustomEvent) {
    const deviceId = ev.detail.value;
    if (!deviceId) {
      fireEvent(this, "related-changed", { value: undefined });
      return;
    }
    const filter = this.opp.localize(
      "ui.components.related-filter-menu.filtered_by_device",
      "device_name",
      computeDeviceName(
        (ev.currentTarget as any).comboBox.selectedItem,
        this.opp
      )
    );
    const items = await findRelated(this.opp, "device", deviceId);

    fireEvent(this, "related-changed", {
      value: { device: deviceId },
      filter,
      items,
    });
  }

  private async _areaPicked(ev: CustomEvent) {
    const areaId = ev.detail.value;
    if (!areaId) {
      fireEvent(this, "related-changed", { value: undefined });
      return;
    }
    const filter = this.opp.localize(
      "ui.components.related-filter-menu.filtered_by_area",
      "area_name",
      (ev.currentTarget as any).comboBox.selectedItem.name
    );
    const items = await findRelated(this.opp, "area", areaId);
    fireEvent(this, "related-changed", {
      value: { area: areaId },
      filter,
      items,
    });
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: inline-block;
        position: relative;
      }
      :host([narrow]) {
        position: static;
      }
      ha-area-picker,
      ha-device-picker,
      ha-entity-picker {
        display: block;
        width: 300px;
        padding: 4px 16px;
        box-sizing: border-box;
      }
      :host([narrow]) ha-area-picker,
      :host([narrow]) ha-device-picker {
        width: 100%;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-button-related-filter-menu": HaRelatedFilterButtonMenu;
  }
}
