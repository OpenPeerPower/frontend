import "@material/mwc-icon-button/mwc-icon-button";
import { mdiArrowLeft, mdiArrowRight } from "@mdi/js";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { OpenPeerPower } from "../types";
import "./ha-svg-icon";

@customElement("op-icon-button-arrow-next")
export class HaIconButtonArrowNext extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property({ type: Boolean }) public disabled = false;

  @property() public label?: string;

  @state() private _icon = mdiArrowRight;

  public connectedCallback() {
    super.connectedCallback();

    // wait to check for direction since otherwise direction is wrong even though top level is RTL
    setTimeout(() => {
      this._icon =
        window.getComputedStyle(this).direction === "ltr"
          ? mdiArrowRight
          : mdiArrowLeft;
    }, 100);
  }

  protected render(): TemplateResult {
    return html`<mwc-icon-button
      .disabled=${this.disabled}
      .label=${this.label || this.opp?.localize("ui.common.next") || "Next"}
    >
      <op-svg-icon .path=${this._icon}></op-svg-icon>
    </mwc-icon-button> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-icon-button-arrow-next": HaIconButtonArrowNext;
  }
}
