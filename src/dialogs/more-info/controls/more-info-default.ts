import { OppEntity } from "open-peer-power-js-websocket";
import {
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../components/ha-attributes";
import { OpenPeerPower } from "../../../types";

@customElement("more-info-default")
class MoreInfoDefault extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public stateObj?: OppEntity;

  protected render(): TemplateResult {
    if (!this.opp || !this.stateObj) {
      return html``;
    }

    return html` <ha-attributes .stateObj=${this.stateObj}></ha-attributes> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-default": MoreInfoDefault;
  }
}
