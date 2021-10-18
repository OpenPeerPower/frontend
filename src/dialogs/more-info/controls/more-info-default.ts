import { OppEntity } from "openpeerpower-js-websocket";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../../../components/op-attributes";
import { OpenPeerPower } from "../../../types";

@customElement("more-info-default")
class MoreInfoDefault extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public stateObj?: OppEntity;

  protected render(): TemplateResult {
    if (!this.opp || !this.stateObj) {
      return html``;
    }

    return html`<op-attributes
      .opp=${this.opp}
      .stateObj=${this.stateObj}
    ></op-attributes>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-default": MoreInfoDefault;
  }
}
