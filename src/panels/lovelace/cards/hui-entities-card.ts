import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { DOMAINS_TOGGLE } from "../../../common/const";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { computeDomain } from "../../../common/entity/compute_domain";
import "../../../components/ha-card";
import { OpenPeerPower } from "../../../types";
import { computeCardSize } from "../common/compute-card-size";
import { findEntities } from "../common/find-entities";
import { processConfigEntities } from "../common/process-config-entities";
import "../components/hui-entities-toggle";
import { createHeaderFooterElement } from "../create-element/create-header-footer-element";
import { createRowElement } from "../create-element/create-row-element";
import {
  EntityConfig,
  LovelaceRow,
  LovelaceRowConfig,
} from "../entity-rows/types";
import {
  LovelaceCard,
  LovelaceCardEditor,
  LovelaceHeaderFooter,
} from "../types";
import { EntitiesCardConfig } from "./types";

@customElement("hui-entities-card")
class HuiEntitiesCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-entities-card-editor");
    return document.createElement("hui-entities-card-editor");
  }

  public static getStubConfig(
    opp: OpenPeerPower,
    entities: string[],
    entitiesFallback: string[]
  ): EntitiesCardConfig {
    const maxEntities = 3;
    const foundEntities = findEntities(
      opp,
      maxEntities,
      entities,
      entitiesFallback,
      ["light", "switch", "sensor"]
    );

    return { type: "entities", entities: foundEntities };
  }

  @internalProperty() private _config?: EntitiesCardConfig;

  private _opp?: OpenPeerPower;

  private _configEntities?: LovelaceRowConfig[];

  private _showHeaderToggle?: boolean;

  private _headerElement?: LovelaceHeaderFooter;

  private _footerElement?: LovelaceHeaderFooter;

  set opp(opp: OpenPeerPower) {
    this._opp = opp;
    this.shadowRoot!.querySelectorAll("#states > div > *").forEach(
      (element: unknown) => {
        (element as LovelaceRow).opp = opp;
      }
    );
    if (this._headerElement) {
      this._headerElement.opp = opp;
    }
    if (this._footerElement) {
      this._footerElement.opp = opp;
    }
    const entitiesToggle = this.shadowRoot!.querySelector(
      "hui-entities-toggle"
    );
    if (entitiesToggle) {
      (entitiesToggle as any).opp = opp;
    }
  }

  public async getCardSize(): Promise<number> {
    if (!this._config) {
      return 0;
    }
    // +1 for the header
    let size =
      (this._config.title || this._showHeaderToggle ? 2 : 0) +
      (this._config.entities.length || 1);
    if (this._headerElement) {
      const headerSize = computeCardSize(this._headerElement);
      size += headerSize instanceof Promise ? await headerSize : headerSize;
    }
    if (this._footerElement) {
      const footerSize = computeCardSize(this._footerElement);
      size += footerSize instanceof Promise ? await footerSize : footerSize;
    }

    return size;
  }

  public setConfig(config: EntitiesCardConfig): void {
    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error("Entities must be specified");
    }

    const entities = processConfigEntities(config.entities);

    this._config = config;
    this._configEntities = entities;
    if (config.title !== undefined && config.show_header_toggle === undefined) {
      // Default value is show toggle if we can at least toggle 2 entities.
      let toggleable = 0;
      for (const rowConf of entities) {
        if (!("entity" in rowConf)) {
          continue;
        }
        toggleable += Number(DOMAINS_TOGGLE.has(computeDomain(rowConf.entity)));
        if (toggleable === 2) {
          break;
        }
      }
      this._showHeaderToggle = toggleable === 2;
    } else {
      this._showHeaderToggle = config.show_header_toggle;
    }

    if (this._config.header) {
      this._headerElement = createHeaderFooterElement(this._config.header);
      if (this._opp) {
        this._headerElement.opp = this._opp;
      }
    } else {
      this._headerElement = undefined;
    }

    if (this._config.footer) {
      this._footerElement = createHeaderFooterElement(this._config.footer);
      if (this._opp) {
        this._footerElement.opp = this._opp;
      }
    } else {
      this._footerElement = undefined;
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this._opp) {
      return;
    }
    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    const oldConfig = changedProps.get("_config") as
      | EntitiesCardConfig
      | undefined;

    if (
      !oldOpp ||
      !oldConfig ||
      oldOpp.themes !== this.opp.themes ||
      oldConfig.theme !== this._config.theme
    ) {
      applyThemesOnElement(this, this._opp.themes, this._config.theme);
    }
  }

  protected render(): TemplateResult {
    if (!this._config || !this._opp) {
      return html``;
    }

    return html`
      <ha-card>
        ${this._headerElement
          ? html`<div class="header-footer header">
              ${this._headerElement}
            </div>`
          : ""}
        ${!this._config.title && !this._showHeaderToggle && !this._config.icon
          ? ""
          : html`
              <h1 class="card-header">
                <div class="name">
                  ${this._config.icon
                    ? html`
                        <ha-icon
                          class="icon"
                          .icon=${this._config.icon}
                        ></ha-icon>
                      `
                    : ""}
                  ${this._config.title}
                </div>
                ${!this._showHeaderToggle
                  ? html``
                  : html`
                      <hui-entities-toggle
                        .opp=${this._opp}
                        .entities=${(this._configEntities!.filter(
                          (conf) => "entity" in conf
                        ) as EntityConfig[]).map((conf) => conf.entity)}
                      ></hui-entities-toggle>
                    `}
              </h1>
            `}
        <div id="states" class="card-content">
          ${this._configEntities!.map((entityConf) =>
            this.renderEntity(entityConf)
          )}
        </div>

        ${this._footerElement
          ? html`<div class="header-footer footer">
              ${this._footerElement}
            </div>`
          : ""}
      </ha-card>
    `;
  }

  static get styles(): CSSResult {
    return css`
      ha-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
      }

      .card-header .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #states {
        flex: 1;
      }

      #states > * {
        margin: 8px 0;
      }

      #states > *:first-child {
        margin-top: 0;
      }

      #states > *:last-child {
        margin-bottom: 0;
      }

      #states > div > * {
        overflow: hidden;
      }

      #states > div {
        position: relative;
      }

      .icon {
        padding: 0px 18px 0px 8px;
      }

      .header {
        border-top-left-radius: var(--op-card-border-radius, 2px);
        border-top-right-radius: var(--op-card-border-radius, 2px);
        margin-bottom: 16px;
        overflow: hidden;
      }

      .footer {
        border-bottom-left-radius: var(--op-card-border-radius, 2px);
        border-bottom-right-radius: var(--op-card-border-radius, 2px);
        margin-top: -16px;
        overflow: hidden;
      }
    `;
  }

  private renderEntity(entityConf: LovelaceRowConfig): TemplateResult {
    const element = createRowElement(
      !("type" in entityConf) && this._config!.state_color
        ? ({
            state_color: true,
            ...(entityConf as EntityConfig),
          } as EntityConfig)
        : entityConf
    );
    if (this._opp) {
      element.opp = this._opp;
    }

    return html`<div>${element}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-entities-card": HuiEntitiesCard;
  }
}
