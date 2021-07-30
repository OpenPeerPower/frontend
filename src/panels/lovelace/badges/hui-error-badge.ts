import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  TemplateResult,
} from "lit-element";
import "../../../components/ha-label-badge";
import { OpenPeerPower } from "../../../types";
import { LovelaceBadge } from "../types";
import { ErrorBadgeConfig } from "./types";

export const createErrorBadgeElement = (config) => {
  const el = document.createElement("hui-error-badge");
  el.setConfig(config);
  return el;
};

export const createErrorBadgeConfig = (error) => ({
  type: "error",
  error,
});

@customElement("hui-error-badge")
export class HuiErrorBadge extends LitElement implements LovelaceBadge {
  public opp?: OpenPeerPower;

  @internalProperty() private _config?: ErrorBadgeConfig;

  public setConfig(config: ErrorBadgeConfig): void {
    this._config = config;
  }

  protected render(): TemplateResult {
    if (!this._config) {
      return html``;
    }

    return html`
      <op-label-badge
        label="Error"
        icon="opp:alert"
        description=${this._config.error}
      ></op-label-badge>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        --op-label-badge-color: var(--label-badge-red, #fce588);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-error-badge": HuiErrorBadge;
  }
}
