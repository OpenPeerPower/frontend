import {
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent, OPPDomEvent } from "../../common/dom/fire_event";
import "../../components/ha-settings-row";
import "../../components/ha-switch";
import type { HaSwitch } from "../../components/ha-switch";
import type { OpenPeerPower } from "../../types";

declare global {
  // for fire event
  interface OPPDomEvents {
    "opp-suspend-when-hidden": { suspend: OpenPeerPower["suspendWhenHidden"] };
  }
  // for add event listener
  interface HTMLElementEventMap {
    "opp-suspend-when-hidden": OPPDomEvent<{
      suspend: OpenPeerPower["suspendWhenHidden"];
    }>;
  }
}

@customElement("ha-set-suspend-row")
class HaSetSuspendRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  protected render(): TemplateResult {
    return html`
      <ha-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.suspend.header")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.suspend.description")}
        </span>
        <ha-switch
          .checked=${this.opp.suspendWhenHidden}
          @change=${this._checkedChanged}
        ></ha-switch>
      </ha-settings-row>
    `;
  }

  private async _checkedChanged(ev: Event) {
    const suspend = (ev.target as HaSwitch).checked;
    if (suspend === this.opp.suspendWhenHidden) {
      return;
    }
    fireEvent(this, "opp-suspend-when-hidden", {
      suspend,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-set-suspend-row": HaSetSuspendRow;
  }
}
