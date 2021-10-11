import { mdiRefresh } from "@mdi/js";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
} from "lit-element";
import { computeRTL } from "../../common/util/compute_rtl";
import "../../components/entity/op-entity-picker";
import "../../components/ha-circular-progress";
import "../../components/ha-date-range-picker";
import type { DateRangePickerRanges } from "../../components/ha-date-range-picker";
import "../../components/op-icon-button";
import "../../components/ha-menu-button";
import { TraceContexts, loadTraceContexts } from "../../data/trace";
import {
  clearLogbookCache,
  getLogbookData,
  LogbookEntry,
} from "../../data/logbook";
import { fetchPersons } from "../../data/person";
import { fetchUsers } from "../../data/user";
import "../../layouts/ha-app-layout";
import { haStyle } from "../../resources/styles";
import { OpenPeerPower } from "../../types";
import "./ha-logbook";
import { isComponentLoaded } from "../../common/config/is_component_loaded";

@customElement("ha-panel-logbook")
export class HaPanelLogbook extends LitElement {
  @property() opp!: OpenPeerPower;

  @property({ reflect: true, type: Boolean }) narrow!: boolean;

  @property() _startDate: Date;

  @property() _endDate: Date;

  @property() _entityId = "";

  @property() _isLoading = false;

  @property() _entries: LogbookEntry[] = [];

  @property({ reflect: true, type: Boolean }) rtl = false;

  @internalProperty() private _ranges?: DateRangePickerRanges;

  private _fetchUserDone?: Promise<unknown>;

  @internalProperty() private _userIdToName = {};

  @internalProperty() private _traceContexts: TraceContexts = {};

  public constructor() {
    super();

    const start = new Date();
    start.setHours(start.getHours() - 2);
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    this._startDate = start;

    const end = new Date();
    end.setHours(end.getHours() + 1);
    end.setMinutes(0);
    end.setSeconds(0);
    end.setMilliseconds(0);
    this._endDate = end;
  }

  protected render() {
    return html`
      <op-app-layout>
        <app-header slot="header" fixed>
          <app-toolbar>
            <op-menu-button
              .opp=${this.opp}
              .narrow=${this.narrow}
            ></op-menu-button>
            <div main-title>${this.opp.localize("panel.logbook")}</div>
            <mwc-icon-button
              @click=${this._refreshLogbook}
              .disabled=${this._isLoading}
            >
              <op-svg-icon .path=${mdiRefresh}></op-svg-icon>
            </mwc-icon-button>
          </app-toolbar>
        </app-header>

        ${this._isLoading ? html`` : ""}

        <div class="filters">
          <op-date-range-picker
            .opp=${this.opp}
            ?disabled=${this._isLoading}
            .startDate=${this._startDate}
            .endDate=${this._endDate}
            .ranges=${this._ranges}
            @change=${this._dateRangeChanged}
          ></op-date-range-picker>

          <op-entity-picker
            .opp=${this.opp}
            .value=${this._entityId}
            .label=${this.opp.localize(
              "ui.components.entity.entity-picker.entity"
            )}
            .disabled=${this._isLoading}
            @change=${this._entityPicked}
          ></op-entity-picker>
        </div>

        ${this._isLoading
          ? html`
              <div class="progress-wrapper">
                <op-circular-progress
                  active
                  alt=${this.opp.localize("ui.common.loading")}
                ></op-circular-progress>
              </div>
            `
          : html`
              <op-logbook
                .opp=${this.opp}
                .entries=${this._entries}
                .userIdToName=${this._userIdToName}
                .traceContexts=${this._traceContexts}
                virtualize
              ></op-logbook>
            `}
      </op-app-layout>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this.opp.loadBackendTranslation("title");

    this._fetchUserDone = this._fetchUserNames();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);
    todayEnd.setMilliseconds(todayEnd.getMilliseconds() - 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayEnd = new Date(today);
    yesterdayEnd.setMilliseconds(yesterdayEnd.getMilliseconds() - 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);
    thisWeekEnd.setMilliseconds(thisWeekEnd.getMilliseconds() - 1);

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 7);
    lastWeekEnd.setMilliseconds(lastWeekEnd.getMilliseconds() - 1);

    this._ranges = {
      [this.opp.localize("ui.panel.logbook.ranges.today")]: [today, todayEnd],
      [this.opp.localize("ui.panel.logbook.ranges.yesterday")]: [
        yesterday,
        yesterdayEnd,
      ],
      [this.opp.localize("ui.panel.logbook.ranges.this_week")]: [
        thisWeekStart,
        thisWeekEnd,
      ],
      [this.opp.localize("ui.panel.logbook.ranges.last_week")]: [
        lastWeekStart,
        lastWeekEnd,
      ],
    };
  }

  protected updated(changedProps: PropertyValues<this>) {
    if (
      changedProps.has("_startDate") ||
      changedProps.has("_endDate") ||
      changedProps.has("_entityId")
    ) {
      this._getData();
    }

    if (changedProps.has("opp")) {
      const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
      if (!oldOpp || oldOpp.language !== this.opp.language) {
        this.rtl = computeRTL(this.opp);
      }
    }
  }

  private async _fetchUserNames() {
    const userIdToName = {};

    // Start loading all the data
    const personProm = fetchPersons(this.opp);
    const userProm = this.opp.user!.is_admin && fetchUsers(this.opp);

    // Process persons
    const persons = await personProm;

    for (const person of persons.storage) {
      if (person.user_id) {
        userIdToName[person.user_id] = person.name;
      }
    }
    for (const person of persons.config) {
      if (person.user_id) {
        userIdToName[person.user_id] = person.name;
      }
    }

    // Process users
    if (userProm) {
      const users = await userProm;
      for (const user of users) {
        if (!(user.id in userIdToName)) {
          userIdToName[user.id] = user.name;
        }
      }
    }

    this._userIdToName = userIdToName;
  }

  private _dateRangeChanged(ev) {
    this._startDate = ev.detail.startDate;
    const endDate = ev.detail.endDate;
    if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
      endDate.setDate(endDate.getDate() + 1);
      endDate.setMilliseconds(endDate.getMilliseconds() - 1);
    }
    this._endDate = endDate;
  }

  private _entityPicked(ev) {
    this._entityId = ev.target.value;
  }

  private _refreshLogbook() {
    this._entries = [];
    clearLogbookCache(
      this._startDate.toISOString(),
      this._endDate.toISOString()
    );
    this._getData();
  }

  private async _getData() {
    this._isLoading = true;
    const [entries, traceContexts] = await Promise.all([
      getLogbookData(
        this.opp,
        this._startDate.toISOString(),
        this._endDate.toISOString(),
        this._entityId
      ),
      isComponentLoaded(this.opp, "trace") ? loadTraceContexts(this.opp) : {},
      this._fetchUserDone,
    ]);

    this._entries = entries;
    this._traceContexts = traceContexts;
    this._isLoading = false;
  }

  static get styles() {
    return [
      haStyle,
      css`
        ha-logbook,
        .progress-wrapper {
          height: calc(100vh - 136px);
        }

        :host([narrow]) ha-logbook,
        :host([narrow]) .progress-wrapper {
          height: calc(100vh - 198px);
        }

        ha-date-range-picker {
          margin-right: 16px;
          max-width: 100%;
        }

        :host([narrow]) ha-date-range-picker {
          margin-right: 0;
        }

        .progress-wrapper {
          position: relative;
        }

        ha-circular-progress {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .filters {
          display: flex;
          align-items: flex-end;
          padding: 0 16px;
        }

        :host([narrow]) .filters {
          flex-wrap: wrap;
        }

        op-entity-picker {
          display: inline-block;
          flex-grow: 1;
          max-width: 400px;
        }

        :host([narrow]) op-entity-picker {
          max-width: none;
          width: 100%;
        }
      `,
    ];
  }
}
