import {
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent, OPPDomEvent } from "../../common/dom/fire_event";
import "../../components/op-settings-row";
import "../../components/op-switch";
import type { HaSwitch } from "../../components/op-switch";
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

@customElement("op-set-suspend-row")
class HaSetSuspendRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  protected render(): TemplateResult {
    return html`
      <op-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.suspend.header")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.suspend.description")}
        </span>
        <op-switch
          .checked=${this.opp.suspendWhenHidden}
          @change=${this._checkedChanged}
        ></op-switch>
      </op-settings-row>
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
    "op-set-suspend-row": HaSetSuspendRow;
  }
}
