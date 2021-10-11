import { OppEntity, UnsubscribeFunc } from "openpeerpower-js-websocket";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { computeStateDomain } from "../../common/entity/compute_state_domain";
import { subscribeEntityRegistry } from "../../data/entity_registry";
import { EntitySelector } from "../../data/selector";
import { SubscribeMixin } from "../../mixins/subscribe-mixin";
import { OpenPeerPower } from "../../types";
import "../entity/op-entity-picker";

@customElement("ha-selector-entity")
export class HaEntitySelector extends SubscribeMixin(LitElement) {
  @property() public opp!: OpenPeerPower;

  @property() public selector!: EntitySelector;

  @state() private _entityPlaformLookup?: Record<string, string>;

  @property() public value?: any;

  @property() public label?: string;

  @property({ type: Boolean }) public disabled = false;

  protected render() {
    return html`<op-entity-picker
      .opp=${this.opp}
      .value=${this.value}
      .label=${this.label}
      .entityFilter=${(entity) => this._filterEntities(entity)}
      .disabled=${this.disabled}
      allow-custom-entity
    ></op-entity-picker>`;
  }

  public oppSubscribe(): UnsubscribeFunc[] {
    return [
      subscribeEntityRegistry(this.opp.connection!, (entities) => {
        const entityLookup = {};
        for (const confEnt of entities) {
          if (!confEnt.platform) {
            continue;
          }
          entityLookup[confEnt.entity_id] = confEnt.platform;
        }
        this._entityPlaformLookup = entityLookup;
      }),
    ];
  }

  private _filterEntities(entity: OppEntity): boolean {
    if (this.selector.entity?.domain) {
      if (computeStateDomain(entity) !== this.selector.entity.domain) {
        return false;
      }
    }
    if (this.selector.entity?.device_class) {
      if (
        !entity.attributes.device_class ||
        entity.attributes.device_class !== this.selector.entity.device_class
      ) {
        return false;
      }
    }
    if (this.selector.entity?.integration) {
      if (
        !this._entityPlaformLookup ||
        this._entityPlaformLookup[entity.entity_id] !==
          this.selector.entity.integration
      ) {
        return false;
      }
    }
    return true;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-selector-entity": HaEntitySelector;
  }
}
