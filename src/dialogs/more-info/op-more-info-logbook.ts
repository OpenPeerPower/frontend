import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { isComponentLoaded } from "../../common/config/is_component_loaded";
import { computeStateDomain } from "../../common/entity/compute_state_domain";
import { throttle } from "../../common/util/throttle";
import "../../components/op-circular-progress";
import { fetchUsers } from "../../data/user";
import { getLogbookData, LogbookEntry } from "../../data/logbook";
import { loadTraceContexts, TraceContexts } from "../../data/trace";
import "../../panels/logbook/op-logbook";
import { haStyle } from "../../resources/styles";
import { OpenPeerPower } from "../../types";
import { closeDialog } from "../make-dialog-manager";

@customElement("ha-more-info-logbook")
export class MoreInfoLogbook extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public entityId!: string;

  @state() private _logbookEntries?: LogbookEntry[];

  @state() private _traceContexts?: TraceContexts;

  @state() private _userIdToName = {};

  private _lastLogbookDate?: Date;

  private _fetchUserPromise?: Promise<void>;

  private _error?: string;

  private _throttleGetLogbookEntries = throttle(() => {
    this._getLogBookData();
  }, 10000);

  protected render(): TemplateResult {
    if (!this.entityId) {
      return html``;
    }
    const stateObj = this.opp.states[this.entityId];

    if (!stateObj) {
      return html``;
    }

    return html`
      ${isComponentLoaded(this.opp, "logbook")
        ? this._error
          ? html`<div class="no-entries">
              ${`${this.opp.localize(
                "ui.components.logbook.retrieval_error"
              )}: ${this._error}`}
            </div>`
          : !this._logbookEntries
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
                no-icon
                no-name
                relative-time
                .opp=${this.opp}
                .entries=${this._logbookEntries}
                .traceContexts=${this._traceContexts}
                .userIdToName=${this._userIdToName}
              ></op-logbook>
            `
          : html`<div class="no-entries">
              ${this.opp.localize("ui.components.logbook.entries_not_found")}
            </div>`
        : ""}
    `;
  }

  protected firstUpdated(): void {
    this._fetchUserPromise = this._fetchUserNames();
    this.addEventListener("click", (ev) => {
      if ((ev.composedPath()[0] as HTMLElement).tagName === "A") {
        setTimeout(() => closeDialog("ha-more-info-dialog"), 500);
      }
    });
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has("entityId")) {
      this._lastLogbookDate = undefined;
      this._logbookEntries = undefined;

      if (!this.entityId) {
        return;
      }

      this._throttleGetLogbookEntries();
      return;
    }

    if (!this.entityId || !changedProps.has("opp")) {
      return;
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;

    if (
      oldOpp &&
      this.opp.states[this.entityId] !== oldOpp?.states[this.entityId]
    ) {
      // wait for commit of data (we only account for the default setting of 1 sec)
      setTimeout(this._throttleGetLogbookEntries, 1000);
    }
  }

  private async _getLogBookData() {
    if (!isComponentLoaded(this.opp, "logbook")) {
      return;
    }
    const lastDate =
      this._lastLogbookDate ||
      new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();
    let newEntries;
    let traceContexts;

    try {
      [newEntries, traceContexts] = await Promise.all([
        getLogbookData(
          this.opp,
          lastDate.toISOString(),
          now.toISOString(),
          this.entityId,
          true
        ),
        this.opp.user?.is_admin ? loadTraceContexts(this.opp) : {},
        this._fetchUserPromise,
      ]);
    } catch (err) {
      this._error = err.message;
    }

    this._logbookEntries = this._logbookEntries
      ? [...newEntries, ...this._logbookEntries]
      : newEntries;
    this._lastLogbookDate = now;
    this._traceContexts = traceContexts;
  }

  private async _fetchUserNames() {
    const userIdToName = {};

    // Start loading users
    const userProm = this.opp.user?.is_admin && fetchUsers(this.opp);

    // Process persons
    Object.values(this.opp.states).forEach((entity) => {
      if (
        entity.attributes.user_id &&
        computeStateDomain(entity) === "person"
      ) {
        this._userIdToName[entity.attributes.user_id] =
          entity.attributes.friendly_name;
      }
    });

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

  static get styles() {
    return [
      haStyle,
      css`
        .no-entries {
          text-align: center;
          padding: 16px;
          color: var(--secondary-text-color);
        }
        op-logbook {
          --logbook-max-height: 250px;
        }
        @media all and (max-width: 450px), all and (max-height: 500px) {
          op-logbook {
            --logbook-max-height: unset;
          }
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
    "ha-more-info-logbook": MoreInfoLogbook;
  }
}
