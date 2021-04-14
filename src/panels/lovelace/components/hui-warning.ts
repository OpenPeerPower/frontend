import { STATE_NOT_RUNNING } from "openpeerpower-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  TemplateResult,
} from "lit-element";
import { OpenPeerPower } from "../../../types";

export const createEntityNotFoundWarning = (
  opp: OpenPeerPower,
  entityId: string
) => {
  return opp.config.state !== STATE_NOT_RUNNING
    ? opp.localize(
        "ui.panel.lovelace.warning.entity_not_found",
        "entity",
        entityId || "[empty]"
      )
    : opp.localize("ui.panel.lovelace.warning.starting");
};

@customElement("hui-warning")
export class HuiWarning extends LitElement {
  protected render(): TemplateResult {
    return html` <slot></slot> `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
        word-break: break-word;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-warning": HuiWarning;
  }
}
