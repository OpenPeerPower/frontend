import "@polymer/paper-radio-button/paper-radio-button";
import { customElement, html, LitElement, property } from "lit-element";
import { fireEvent } from "../../../../../common/dom/fire_event";
import { computeStateDomain } from "../../../../../common/entity/compute_state_domain";
import { hasLocation } from "../../../../../common/entity/has_location";
import "../../../../../components/entity/op-entity-picker";
import { ZoneCondition } from "../../../../../data/automation";
import { PolymerChangedEvent } from "../../../../../polymer-types";
import { OpenPeerPower } from "../../../../../types";

function zoneAndLocationFilter(stateObj) {
  return hasLocation(stateObj) && computeStateDomain(stateObj) !== "zone";
}

const includeDomains = ["zone"];

@customElement("ha-automation-condition-zone")
export class HaZoneCondition extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public condition!: ZoneCondition;

  public static get defaultConfig() {
    return {
      entity_id: "",
      zone: "",
    };
  }

  protected render() {
    const { entity_id, zone } = this.condition;
    return html`
      <op-entity-picker
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.zone.entity"
        )}
        .value=${entity_id}
        @value-changed=${this._entityPicked}
        .opp=${this.opp}
        allow-custom-entity
        .entityFilter=${zoneAndLocationFilter}
      ></op-entity-picker>
      <op-entity-picker
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.zone.zone"
        )}
        .value=${zone}
        @value-changed=${this._zonePicked}
        .opp=${this.opp}
        allow-custom-entity
        .includeDomains=${includeDomains}
      ></op-entity-picker>
      <label id="eventlabel">
        ${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.zone.event"
        )}
      </label>
    `;
  }

  private _entityPicked(ev: PolymerChangedEvent<string>) {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: { ...this.condition, entity_id: ev.detail.value },
    });
  }

  private _zonePicked(ev: PolymerChangedEvent<string>) {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: { ...this.condition, zone: ev.detail.value },
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-condition-zone": HaZoneCondition;
  }
}
