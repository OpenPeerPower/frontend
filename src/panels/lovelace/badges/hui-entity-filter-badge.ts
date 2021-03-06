import {
  internalProperty,
  property,
  PropertyValues,
  UpdatingElement,
} from "lit-element";
import { OpenPeerPower } from "../../../types";
import { evaluateFilter } from "../common/evaluate-filter";
import { processConfigEntities } from "../common/process-config-entities";
import { createBadgeElement } from "../create-element/create-badge-element";
import { EntityFilterEntityConfig } from "../entity-rows/types";
import { LovelaceBadge } from "../types";
import { EntityFilterBadgeConfig } from "./types";

class EntityFilterBadge extends UpdatingElement implements LovelaceBadge {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _config?: EntityFilterBadgeConfig;

  private _elements?: LovelaceBadge[];

  private _configEntities?: EntityFilterEntityConfig[];

  private _oldEntities?: EntityFilterEntityConfig[];

  public setConfig(config: EntityFilterBadgeConfig): void {
    if (!config.entities.length || !Array.isArray(config.entities)) {
      throw new Error("Entities must be specified");
    }

    if (
      !(config.state_filter && Array.isArray(config.state_filter)) &&
      !config.entities.every(
        (entity) =>
          typeof entity === "object" &&
          entity.state_filter &&
          Array.isArray(entity.state_filter)
      )
    ) {
      throw new Error("Incorrect filter config");
    }

    while (this.lastChild) {
      this.removeChild(this.lastChild);
    }
    this._elements = undefined;

    this._configEntities = processConfigEntities(config.entities);
    this._oldEntities = undefined;
    this._config = config;
  }

  protected shouldUpdate(changedProperties: PropertyValues): boolean {
    if (
      changedProperties.has("_config") ||
      (changedProperties.has("opp") &&
        this.haveEntitiesChanged(
          changedProperties.get("opp") as OpenPeerPower | undefined
        ))
    ) {
      return true;
    }
    return false;
  }

  protected update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    if (!this.opp || !this._configEntities) {
      return;
    }

    if (this._elements) {
      for (const element of this._elements) {
        element.opp = this.opp;
      }
    }

    const entitiesList = this._configEntities.filter((entityConf) => {
      const stateObj = this.opp.states[entityConf.entity];

      if (!stateObj) {
        return false;
      }

      if (entityConf.state_filter) {
        for (const filter of entityConf.state_filter) {
          if (evaluateFilter(stateObj, filter)) {
            return true;
          }
        }
      } else {
        for (const filter of this._config!.state_filter) {
          if (evaluateFilter(stateObj, filter)) {
            return true;
          }
        }
      }

      return false;
    });

    if (entitiesList.length === 0) {
      this.style.display = "none";
      this._oldEntities = entitiesList;
      return;
    }

    const isSame =
      this._oldEntities &&
      entitiesList.length === this._oldEntities.length &&
      entitiesList.every((entity, idx) => entity === this._oldEntities![idx]);

    if (!isSame) {
      this._elements = [];
      for (const badgeConfig of entitiesList) {
        const element = createBadgeElement(badgeConfig);
        element.opp = this.opp;
        this._elements.push(element);
      }
      this._oldEntities = entitiesList;
    }

    if (!this._elements) {
      return;
    }

    while (this.lastChild) {
      this.removeChild(this.lastChild);
    }

    for (const element of this._elements) {
      this.appendChild(element);
    }

    this.style.display = "inline";
  }

  private haveEntitiesChanged(oldOpp?: OpenPeerPower): boolean {
    if (!oldOpp) {
      return true;
    }

    if (!this._oldEntities || this.opp.localize !== oldOpp.localize) {
      return true;
    }

    for (const config of this._configEntities!) {
      if (this.opp.states[config.entity] !== oldOpp.states[config.entity]) {
        return true;
      }
    }

    return false;
  }
}
customElements.define("hui-entity-filter-badge", EntityFilterBadge);
