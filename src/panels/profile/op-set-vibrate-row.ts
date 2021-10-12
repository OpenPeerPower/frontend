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
import { forwardHaptic } from "../../data/haptics";
import type { OpenPeerPower } from "../../types";

@customElement("op-set-vibrate-row")
class HaSetVibrateRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  protected render(): TemplateResult {
    return html`
      <op-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.vibrate.header")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.vibrate.description")}
        </span>
        <op-switch
          .checked=${this.opp.vibrate}
          @change=${this._checkedChanged}
        ></op-switch>
      </op-settings-row>
    `;
  }

  private async _checkedChanged(ev: Event) {
    const vibrate = (ev.target as HaSwitch).checked;
    if (vibrate === this.opp.vibrate) {
      return;
    }
    fireEvent(this, "opp-vibrate", {
      vibrate,
    });
    forwardHaptic("light");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-set-vibrate-row": HaSetVibrateRow;
  }
}
