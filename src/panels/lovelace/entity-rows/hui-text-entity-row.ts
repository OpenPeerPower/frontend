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
import { classMap } from "lit-html/directives/class-map";
import { DOMAINS_HIDE_MORE_INFO } from "../../../common/const";
import { computeDomain } from "../../../common/entity/compute_domain";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { ActionHandlerEvent } from "../../../data/lovelace";
import { OpenPeerPower } from "../../../types";
import { EntitiesCardEntityConfig } from "../cards/types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { LovelaceRow } from "./types";

@customElement("hui-text-entity-row")
class HuiTextEntityRow extends LitElement implements LovelaceRow {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntitiesCardEntityConfig;

  public setConfig(config: EntitiesCardEntityConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = config;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps);
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

    const pointer =
      (this._config.tap_action && this._config.tap_action.action !== "none") ||
      (this._config.entity &&
        !DOMAINS_HIDE_MORE_INFO.includes(computeDomain(this._config.entity)));

    return html`
      <hui-generic-entity-row .opp=${this.opp} .config=${this._config}>
        <div
          class="text-content ${classMap({
            pointer,
          })}"
          @action=${this._handleAction}
          .actionHandler=${actionHandler({
            hasHold: hasAction(this._config.hold_action),
            hasDoubleClick: hasAction(this._config.double_tap_action),
          })}
        >
          ${computeStateDisplay(
            this.opp!.localize,
            stateObj,
            this.opp.locale
          )}
        </div>
      </hui-generic-entity-row>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.opp!, this._config!, ev.detail.action);
  }

  static get styles(): CSSResult {
    return css`
      div {
        text-align: right;
      }
      .pointer {
        cursor: pointer;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-text-entity-row": HuiTextEntityRow;
  }
}
