import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import {
  css,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
} from "lit-element";
import { html } from "lit-html";
import { computeRTL } from "../../common/util/compute_rtl";
import "../../components/entity/op-entity-picker";
import "../../components/op-circular-progress";
import "../../components/op-date-range-picker";
import type { DateRangePickerRanges } from "../../components/op-date-range-picker";
import "../../components/op-menu-button";
import "../../components/state-history-charts";
import { computeHistory, fetchDate } from "../../data/history";
import "../../layouts/op-app-layout";
import { haStyle } from "../../resources/styles";
import { OpenPeerPower } from "../../types";

class HaPanelHistory extends LitElement {
  @property() opp!: OpenPeerPower;

  @property({ reflect: true, type: Boolean }) narrow!: boolean;

  @property() _startDate: Date;

  @property() _endDate: Date;

  @property() _entityId = "";

  @property() _isLoading = false;

  @property() _stateHistory?;

  @property({ reflect: true, type: Boolean }) rtl = false;

  @internalProperty() private _ranges?: DateRangePickerRanges;

  public constructor() {
    super();

    const start = new Date();
    start.setHours(start.getHours() - 2);
    start.setMinutes(0);
    start.setSeconds(0);
    this._startDate = start;

    const end = new Date();
    end.setHours(end.getHours() + 1);
    end.setMinutes(0);
    end.setSeconds(0);
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
            <div main-title>${this.opp.localize("panel.history")}</div>
          </app-toolbar>
        </app-header>

        <div class="flex content">
          <div class="flex layout horizontal wrap">
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
            ? html`<div class="progress-wrapper">
                <op-circular-progress
                  active
                  alt=${this.opp.localize("ui.common.loading")}
                ></op-circular-progress>
              </div>`
            : html`
                <state-history-charts
                  .opp=${this.opp}
                  .historyData=${this._stateHistory}
                  .endTime=${this._endDate}
                  no-single
                >
                </state-history-charts>
              `}
        </div>
      </op-app-layout>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);

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
      [this.opp.localize("ui.panel.history.ranges.today")]: [today, todayEnd],
      [this.opp.localize("ui.panel.history.ranges.yesterday")]: [
        yesterday,
        yesterdayEnd,
      ],
      [this.opp.localize("ui.panel.history.ranges.this_week")]: [
        thisWeekStart,
        thisWeekEnd,
      ],
      [this.opp.localize("ui.panel.history.ranges.last_week")]: [
        lastWeekStart,
        lastWeekEnd,
      ],
    };
  }

  protected updated(changedProps: PropertyValues) {
    if (
      changedProps.has("_startDate") ||
      changedProps.has("_endDate") ||
      changedProps.has("_entityId")
    ) {
      this._getHistory();
    }

    if (changedProps.has("opp")) {
      const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
      if (!oldOpp || oldOpp.language !== this.opp.language) {
        this.rtl = computeRTL(this.opp);
      }
    }
  }

  private async _getHistory() {
    this._isLoading = true;
    const dateHistory = await fetchDate(
      this.opp,
      this._startDate,
      this._endDate,
      this._entityId
    );
    this._stateHistory = computeHistory(
      this.opp,
      dateHistory,
      this.opp.localize
    );
    this._isLoading = false;
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

  static get styles() {
    return [
      haStyle,
      css`
        .content {
          padding: 0 16px 16px;
        }

        .progress-wrapper {
          height: calc(100vh - 136px);
        }

        :host([narrow]) .progress-wrapper {
          height: calc(100vh - 198px);
        }

        .progress-wrapper {
          position: relative;
        }

        op-date-range-picker {
          margin-right: 16px;
          max-width: 100%;
        }

        :host([narrow]) op-date-range-picker {
          margin-right: 0;
        }

        op-circular-progress {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
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

customElements.define("op-panel-history", HaPanelHistory);
