import {
  css,
  CSSResultArray,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { isComponentLoaded } from "../../../common/config/is_component_loaded";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { computeStateDomain } from "../../../common/entity/compute_state_domain";
import { throttle } from "../../../common/util/throttle";
import "../../../components/op-card";
import "../../../components/op-circular-progress";
import { getLogbookData, LogbookEntry } from "../../../data/logbook";
import type { OpenPeerPower } from "../../../types";
import "../../logbook/op-logbook";
import { findEntities } from "../common/find-entities";
import { processConfigEntities } from "../common/process-config-entities";
import "../components/hui-warning";
import type { EntityConfig } from "../entity-rows/types";
import type { LovelaceCard, LovelaceCardEditor } from "../types";
import type { LogbookCardConfig } from "./types";

@customElement("hui-logbook-card")
export class HuiLogbookCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-logbook-card-editor");
    return document.createElement("hui-logbook-card-editor");
  }

  public static getStubConfig(
    opp: OpenPeerPower,
    entities: string[],
    entitiesFill: string[]
  ) {
    const includeDomains = ["light", "switch"];
    const maxEntities = 3;
    const foundEntities = findEntities(
      opp,
      maxEntities,
      entities,
      entitiesFill,
      includeDomains
    );

    return {
      entities: foundEntities,
    };
  }

  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: LogbookCardConfig;

  @internalProperty() private _logbookEntries?: LogbookEntry[];

  @internalProperty() private _persons = {};

  @internalProperty() private _configEntities?: EntityConfig[];

  private _lastLogbookDate?: Date;

  private _throttleGetLogbookEntries = throttle(() => {
    this._getLogBookData();
  }, 10000);

  public getCardSize(): number {
    return 9 + (this._config?.title ? 1 : 0);
  }

  public setConfig(config: LogbookCardConfig): void {
    if (!config.entities.length) {
      throw new Error("Entities must be specified");
    }

    this._configEntities = processConfigEntities<EntityConfig>(config.entities);

    this._config = {
      hours_to_show: 24,
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (
      changedProps.has("_config") ||
      changedProps.has("_persons") ||
      changedProps.has("_logbookEntries")
    ) {
      return true;
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;

    if (
      !this._configEntities ||
      !oldOpp ||
      oldOpp.themes !== this.opp!.themes ||
      oldOpp.locale !== this.opp!.locale
    ) {
      return true;
    }

    for (const entity of this._configEntities) {
      if (oldOpp.states[entity.entity] !== this.opp!.states[entity.entity]) {
        return true;
      }
    }

    return false;
  }

  protected firstUpdated(): void {
    this._fetchPersonNames();
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (!this._config || !this.opp) {
      return;
    }

    const configChanged = changedProperties.has("_config");
    const oppChanged = changedProperties.has("opp");
    const oldOpp = changedProperties.get("opp") as OpenPeerPower | undefined;
    const oldConfig = changedProperties.get("_config") as LogbookCardConfig;

    if (
      (oppChanged && oldOpp?.themes !== this.opp.themes) ||
      (configChanged && oldConfig?.theme !== this._config.theme)
    ) {
      applyThemesOnElement(this, this.opp.themes, this._config.theme);
    }

    if (
      configChanged &&
      (oldConfig?.entities !== this._config.entities ||
        oldConfig?.hours_to_show !== this._config!.hours_to_show)
    ) {
      this._logbookEntries = undefined;
      this._lastLogbookDate = undefined;

      if (!this._configEntities) {
        return;
      }

      this._throttleGetLogbookEntries();
      return;
    }

    if (
      oldOpp &&
      this._configEntities!.some(
        (entity) =>
          oldOpp.states[entity.entity] !== this.opp!.states[entity.entity]
      )
    ) {
      // wait for commit of data (we only account for the default setting of 1 sec)
      setTimeout(this._throttleGetLogbookEntries, 1000);
    }
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
      return html``;
    }

    if (!isComponentLoaded(this.opp, "logbook")) {
      return html`
        <hui-warning>
          ${this.opp.localize(
            "ui.components.logbook.component_not_loaded"
          )}</hui-warning
        >
      `;
    }

    return html`
      <op-card
        .header=${this._config!.title}
        class=${classMap({ "no-header": !this._config!.title })}
      >
        <div class="content">
          ${!this._logbookEntries
            ? html`
                <op-circular-progress
                  active
                  alt=${this.opp.localize("ui.common.loading")}
                ></op-circular-progress>
              `
            : this._logbookEntries.length
            ? html`
                <op-logbook
                  narrow
                  relative-time
                  virtualize
                  .opp=${this.opp}
                  .entries=${this._logbookEntries}
                  .userIdToName=${this._persons}
                ></op-logbook>
              `
            : html`
                <div class="no-entries">
                  ${this.opp.localize(
                    "ui.components.logbook.entries_not_found"
                  )}
                </div>
              `}
        </div>
      </op-card>
    `;
  }

  private async _getLogBookData() {
    if (!this.opp || !this._config || !isComponentLoaded(this.opp, "logbook")) {
      return;
    }

    const hoursToShowDate = new Date(
      new Date().getTime() - this._config!.hours_to_show! * 60 * 60 * 1000
    );
    const lastDate = this._lastLogbookDate || hoursToShowDate;
    const now = new Date();

    const newEntries = await getLogbookData(
      this.opp,
      lastDate.toISOString(),
      now.toISOString(),
      this._configEntities!.map((entity) => entity.entity).toString(),
      true
    );

    const logbookEntries = this._logbookEntries
      ? [...newEntries, ...this._logbookEntries]
      : newEntries;

    this._logbookEntries = logbookEntries.filter(
      (logEntry) => new Date(logEntry.when) > hoursToShowDate
    );

    this._lastLogbookDate = now;
  }

  private _fetchPersonNames() {
    if (!this.opp) {
      return;
    }

    Object.values(this.opp!.states).forEach((entity) => {
      if (
        entity.attributes.user_id &&
        computeStateDomain(entity) === "person"
      ) {
        this._persons[entity.attributes.user_id] =
          entity.attributes.friendly_name;
      }
    });
  }

  static get styles(): CSSResultArray {
    return [
      css`
        op-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .content {
          padding: 0 16px 16px;
        }

        .no-header .content {
          padding-top: 16px;
        }

        .no-entries {
          text-align: center;
          padding: 16px;
          color: var(--secondary-text-color);
        }

        op-logbook {
          height: 385px;
          overflow: auto;
          display: block;
        }

        op-circular-progress {
          display: flex;
          justify-content: center;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-logbook-card": HuiLogbookCard;
  }
}
