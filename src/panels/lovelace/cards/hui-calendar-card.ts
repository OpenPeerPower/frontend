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
import { HA_COLOR_PALETTE } from "../../../common/const";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { OPPDomEvent } from "../../../common/dom/fire_event";
import { debounce } from "../../../common/util/debounce";
import "../../../components/ha-card";
import "../../../components/ha-icon";
import { Calendar, fetchCalendarEvents } from "../../../data/calendar";
import type {
  CalendarEvent,
  CalendarViewChanged,
  FullCalendarView,
  OpenPeerPower,
} from "../../../types";
import "../../calendar/ha-full-calendar";
import type { HAFullCalendar } from "../../calendar/ha-full-calendar";
import { findEntities } from "../common/find-entities";
import { installResizeObserver } from "../common/install-resize-observer";
import "../components/hui-warning";
import type { LovelaceCard, LovelaceCardEditor } from "../types";
import type { CalendarCardConfig } from "./types";

@customElement("hui-calendar-card")
export class HuiCalendarCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-calendar-card-editor");
    return document.createElement("hui-calendar-card-editor");
  }

  public static getStubConfig(
    opp: OpenPeerPower,
    entities: string[],
    entitiesFill: string[]
  ) {
    const includeDomains = ["calendar"];
    const maxEntities = 2;
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

  @property({ attribute: false }) public _events: CalendarEvent[] = [];

  @internalProperty() private _config?: CalendarCardConfig;

  @internalProperty() private _calendars: Calendar[] = [];

  @internalProperty() private _narrow = false;

  @internalProperty() private _veryNarrow = false;

  @query("ha-full-calendar", true) private _calendar?: HAFullCalendar;

  private _startDate?: Date;

  private _endDate?: Date;

  private _resizeObserver?: ResizeObserver;

  public setConfig(config: CalendarCardConfig): void {
    if (!config.entities?.length) {
      throw new Error("Entities must be specified");
    }

    if (!Array.isArray(config.entities)) {
      throw new Error("Entities need to be an array");
    }

    this._calendars = config!.entities.map((entity, idx) => {
      return {
        entity_id: entity,
        backgroundColor: `#${HA_COLOR_PALETTE[idx % HA_COLOR_PALETTE.length]}`,
      };
    });

    if (this._config?.entities !== config.entities) {
      this._fetchCalendarEvents();
    }

    this._config = { initial_view: "dayGridMonth", ...config };
  }

  public getCardSize(): number {
    return this._config?.header ? 1 : 0 + 11;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this.updateComplete.then(() => this._attachObserver());
  }

  public disconnectedCallback(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  protected render(): TemplateResult {
    if (!this._config || !this.opp || !this._calendars.length) {
      return html``;
    }

    const views: FullCalendarView[] = this._veryNarrow
      ? ["list"]
      : ["list", "dayGridMonth", "dayGridDay"];

    return html`
      <ha-card>
        <div class="header">${this._config.title}</div>
        <ha-full-calendar
          .narrow=${this._narrow}
          .events=${this._events}
          .opp=${this.opp}
          .views=${views}
          .initialView=${this._config.initial_view!}
          @view-changed=${this._handleViewChanged}
        ></ha-full-calendar>
      </ha-card>
    `;
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (!this._config || !this.opp) {
      return;
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    const oldConfig = changedProps.get("_config") as
      | CalendarCardConfig
      | undefined;

    if (
      !oldOpp ||
      !oldConfig ||
      (changedProps.has("opp") && oldOpp.themes !== this.opp.themes) ||
      (changedProps.has("_config") && oldConfig.theme !== this._config.theme)
    ) {
      applyThemesOnElement(this, this.opp.themes, this._config!.theme);
    }
  }

  private _handleViewChanged(ev: OPPDomEvent<CalendarViewChanged>): void {
    this._startDate = ev.detail.start;
    this._endDate = ev.detail.end;
    this._fetchCalendarEvents();
  }

  private async _fetchCalendarEvents(): Promise<void> {
    if (!this._startDate || !this._endDate) {
      return;
    }

    this._events = await fetchCalendarEvents(
      this.opp!,
      this._startDate,
      this._endDate,
      this._calendars
    );
  }

  private _measureCard() {
    const card = this.shadowRoot!.querySelector("ha-card");
    if (!card) {
      return;
    }
    this._narrow = card.offsetWidth < 870;
    this._veryNarrow = card.offsetWidth < 350;

    this._calendar?.updateSize();
  }

  private async _attachObserver(): Promise<void> {
    if (!this._resizeObserver) {
      await installResizeObserver();
      this._resizeObserver = new ResizeObserver(
        debounce(() => this._measureCard(), 250, false)
      );
    }
    const card = this.shadowRoot!.querySelector("ha-card");
    // If we show an error or warning there is no ha-card
    if (!card) {
      return;
    }
    this._resizeObserver.observe(card);
  }

  static get styles(): CSSResult {
    return css`
      ha-card {
        position: relative;
        padding: 0 8px 8px;
        box-sizing: border-box;
        height: 100%;
      }

      .header {
        color: var(--op-card-header-color, --primary-text-color);
        font-size: var(--op-card-header-font-size, 24px);
        line-height: 1.2;
        padding-top: 16px;
        padding-left: 8px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-calendar-card": HuiCalendarCard;
  }
}
