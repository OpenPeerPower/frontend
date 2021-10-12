import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";
import "../../../components/entity/op-state-label-badge";
import { ActionHandlerEvent } from "../../../data/lovelace";
import { OpenPeerPower } from "../../../types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { LovelaceBadge } from "../types";
import { StateLabelBadgeConfig } from "./types";

@customElement("hui-state-label-badge")
export class HuiStateLabelBadge extends LitElement implements LovelaceBadge {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() protected _config?: StateLabelBadgeConfig;

  public setConfig(config: StateLabelBadgeConfig): void {
    this._config = config;
  }

  protected render(): TemplateResult {
    if (!this._config || !this.opp) {
      return html``;
    }

    const stateObj = this.opp.states[this._config.entity!];

    return html`
      <op-state-label-badge
        .opp=${this.opp}
        .state=${stateObj}
        .name=${this._config.name}
        .icon=${this._config.icon}
        .image=${this._config.image}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config!.hold_action),
          hasDoubleClick: hasAction(this._config!.double_tap_action),
        })}
        tabindex=${ifDefined(
          hasAction(this._config.tap_action) || this._config.entity
            ? "0"
            : undefined
        )}
      ></op-state-label-badge>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.opp!, this._config!, ev.detail.action!);
  }

  static get styles(): CSSResult {
    return css`
      op-state-label-badge:focus {
        outline: none;
        background: var(--divider-color);
        border-radius: 4px;
      }
      op-state-label-badge {
        display: inline-block;
        padding: 4px 2px 4px 2px;
        margin: -4px -2px -4px -2px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-state-label-badge": HuiStateLabelBadge;
  }
}
