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
import type { OpenPeerPower } from "../../types";

@customElement("ha-enable-shortcuts-row")
class HaEnableShortcutsRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  protected render(): TemplateResult {
    return html`
      <ha-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.enable_shortcuts.header")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.enable_shortcuts.description")}
        </span>
        <ha-switch
          .checked=${this.opp.enableShortcuts}
          @change=${this._checkedChanged}
        ></ha-switch>
      </ha-settings-row>
    `;
  }

  private async _checkedChanged(ev: Event) {
    const enabled = (ev.target as HaSwitch).checked;
    if (enabled === this.opp.enableShortcuts) {
      return;
    }

    fireEvent(this, "opp-enable-shortcuts", enabled);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-enable-shortcuts-row": HaEnableShortcutsRow;
  }
}
