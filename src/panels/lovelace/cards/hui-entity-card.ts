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
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { computeStateName } from "../../../common/entity/compute_state_name";
import { stateIcon } from "../../../common/entity/state_icon";
import { isValidEntityId } from "../../../common/entity/valid_entity_id";
import { formatNumber } from "../../../common/string/format_number";
import "../../../components/ha-card";
import "../../../components/ha-icon";
import { UNAVAILABLE_STATES } from "../../../data/entity";
import { OpenPeerPower } from "../../../types";
import { computeCardSize } from "../common/compute-card-size";
import { findEntities } from "../common/find-entities";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { createHeaderFooterElement } from "../create-element/create-header-footer-element";
import {
  LovelaceCard,
  LovelaceCardEditor,
  LovelaceHeaderFooter,
} from "../types";
import { HuiErrorCard } from "./hui-error-card";
import { EntityCardConfig } from "./types";

@customElement("hui-entity-card")
export class HuiEntityCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-entity-card-editor");
    return document.createElement("hui-entity-card-editor");
  }

  public static getStubConfig(
    opp: OpenPeerPower,
    entities: string[],
    entitiesFill: string[]
  ) {
    const includeDomains = ["sensor", "light", "switch"];
    const maxEntities = 1;
    const foundEntities = findEntities(
      opp,
      maxEntities,
      entities,
      entitiesFill,
      includeDomains
    );

    return {
      entity: foundEntities[0] || "",
    };
  }

  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntityCardConfig;

  private _footerElement?: HuiErrorCard | LovelaceHeaderFooter;

  public setConfig(config: EntityCardConfig): void {
    if (!config.entity) {
      throw new Error("Entity must be specified");
    }
    if (config.entity && !isValidEntityId(config.entity)) {
      throw new Error("Invalid entity");
    }

    this._config = config;

    if (this._config.footer) {
      this._footerElement = createHeaderFooterElement(this._config.footer);
    } else if (this._footerElement) {
      this._footerElement = undefined;
    }
  }

  public async getCardSize(): Promise<number> {
    let size = 2;
    if (this._footerElement) {
      const footerSize = computeCardSize(this._footerElement);
      size += footerSize instanceof Promise ? await footerSize : footerSize;
    }
    return size;
  }

  protected render(): TemplateResult {
    if (!this._config || !this.opp) {
      return html``;
    }

    const stateObj = this.opp.states[this._config.entity];

    if (!stateObj) {
      return html`
        <hui-warning>
          ${createEntityNotFoundWarning(this.opp, this._config.entity)}
        </hui-warning>
      `;
    }

    const showUnit = this._config.attribute
      ? this._config.attribute in stateObj.attributes
      : !UNAVAILABLE_STATES.includes(stateObj.state);

    return html`
      <op-card @click=${this._handleClick} tabindex="0">
        <div class="header">
          <div class="name">
            ${this._config.name || computeStateName(stateObj)}
          </div>
          <div class="icon">
            <op-icon
              .icon=${this._config.icon || stateIcon(stateObj)}
            ></op-icon>
          </div>
        </div>
        <div class="info">
          <span class="value"
            >${"attribute" in this._config
              ? stateObj.attributes[this._config.attribute!] ??
                this.opp.localize("state.default.unknown")
              : stateObj.attributes.unit_of_measurement
              ? formatNumber(stateObj.state, this.opp.locale)
              : computeStateDisplay(
                  this.opp.localize,
                  stateObj,
                  this.opp.locale
                )}</span
          >${showUnit
            ? html`
                <span class="measurement"
                  >${this._config.unit ||
                  (this._config.attribute
                    ? ""
                    : stateObj.attributes.unit_of_measurement)}</span
                >
              `
            : ""}
        </div>
        ${this._footerElement}
      </op-card>
    `;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    // Side Effect used to update footer opp while keeping optimizations
    if (this._footerElement) {
      this._footerElement.opp = this.opp;
    }

    return hasConfigOrEntityChanged(this, changedProps);
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (!this._config || !this.opp) {
      return;
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    const oldConfig = changedProps.get("_config") as
      | EntityCardConfig
      | undefined;

    if (
      !oldOpp ||
      !oldConfig ||
      oldOpp.themes !== this.opp.themes ||
      oldConfig.theme !== this._config.theme
    ) {
      applyThemesOnElement(this, this.opp.themes, this._config!.theme);
    }
  }

  private _handleClick(): void {
    fireEvent(this, "opp-more-info", { entityId: this._config!.entity });
  }

  static get styles(): CSSResult {
    return css`
      ha-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        outline: none;
      }

      .header {
        display: flex;
        padding: 8px 16px 0;
        justify-content: space-between;
      }

      .name {
        color: var(--secondary-text-color);
        line-height: 40px;
        font-weight: 500;
        font-size: 16px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .icon {
        color: var(--state-icon-color, #44739e);
        line-height: 40px;
      }

      .info {
        padding: 0px 16px 16px;
        margin-top: -4px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: 28px;
      }

      .value {
        font-size: 28px;
        margin-right: 4px;
      }

      .measurement {
        font-size: 18px;
        color: var(--secondary-text-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-entity-card": HuiEntityCard;
  }
}
