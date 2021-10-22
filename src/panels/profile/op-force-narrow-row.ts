import {
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/op-settings-row";
import "../../components/op-switch";
import type { HaSwitch } from "../../components/op-switch";
import type { OpenPeerPower } from "../../types";

@customElement("op-force-narrow-row")
class HaForcedNarrowRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  protected render(): TemplateResult {
    return html`
      <op-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.force_narrow.header")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.force_narrow.description")}
        </span>
        <op-switch
          .checked=${this.opp.dockedSidebar === "always_hidden"}
          @change=${this._checkedChanged}
        ></op-switch>
      </op-settings-row>
    `;
  }

  private async _checkedChanged(ev: Event) {
    const newValue = (ev.target as HaSwitch).checked;
    if (newValue === (this.opp.dockedSidebar === "always_hidden")) {
      return;
    }
    fireEvent(this, "opp-dock-sidebar", {
      dock: newValue ? "always_hidden" : "auto",
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-force-narrow-row": HaForcedNarrowRow;
  }
}
