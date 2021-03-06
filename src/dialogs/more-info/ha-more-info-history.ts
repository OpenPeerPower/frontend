import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { isComponentLoaded } from "../../common/config/is_component_loaded";
import { throttle } from "../../common/util/throttle";
import "../../components/state-history-charts";
import { getRecentWithCache } from "../../data/cached-history";
import { HistoryResult } from "../../data/history";
import { OpenPeerPower } from "../../types";

@customElement("ha-more-info-history")
export class MoreInfoHistory extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public entityId!: string;

  @internalProperty() private _stateHistory?: HistoryResult;

  private _throttleGetStateHistory = throttle(() => {
    this._getStateHistory();
  }, 10000);

  protected render(): TemplateResult {
    if (!this.entityId) {
      return html``;
    }

    return html`${isComponentLoaded(this.opp, "history")
      ? html`<state-history-charts
          up-to-now
          .opp=${this.opp}
          .historyData=${this._stateHistory}
          .isLoadingData=${!this._stateHistory}
        ></state-history-charts>`
      : ""} `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has("entityId")) {
      this._stateHistory = undefined;

      if (!this.entityId) {
        return;
      }

      this._throttleGetStateHistory();
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
      setTimeout(this._throttleGetStateHistory, 1000);
    }
  }

  private async _getStateHistory(): Promise<void> {
    if (!isComponentLoaded(this.opp, "history")) {
      return;
    }
    this._stateHistory = await getRecentWithCache(
      this.opp!,
      this.entityId,
      {
        cacheKey: `more_info.${this.entityId}`,
        hoursToShow: 24,
      },
      this.opp!.localize,
      this.opp!.language
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-more-info-history": MoreInfoHistory;
  }
}
