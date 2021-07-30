import {
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/ha-settings-row";
import "../../components/ha-switch";
import type { HaSwitch } from "../../components/ha-switch";
import { forwardHaptic } from "../../data/haptics";
import type { OpenPeerPower } from "../../types";

@customElement("ha-set-vibrate-row")
class HaSetVibrateRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  protected render(): TemplateResult {
    return html`
      <ha-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.vibrate.header")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.vibrate.description")}
        </span>
        <ha-switch
          .checked=${this.opp.vibrate}
          @change=${this._checkedChanged}
        ></ha-switch>
      </ha-settings-row>
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
    "ha-set-vibrate-row": HaSetVibrateRow;
  }
}
