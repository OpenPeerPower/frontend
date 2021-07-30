import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../components/ha-card";
import "../../components/ha-settings-row";
import "../../components/ha-switch";
import {
  CoreFrontendUserData,
  getOptimisticFrontendUserDataCollection,
} from "../../data/frontend";
import { OpenPeerPower } from "../../types";

@customElement("ha-advanced-mode-row")
class AdvancedModeRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public coreUserData?: CoreFrontendUserData;

  protected render(): TemplateResult {
    return html`
      <ha-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.advanced_mode.title")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.advanced_mode.description")}
          <a
            href="https://www.openpeerpower.io/blog/2019/07/17/release-96/#advanced-mode"
            target="_blank"
            rel="noreferrer"
            >${this.opp.localize("ui.panel.profile.advanced_mode.link_promo")}
          </a>
        </span>
        <ha-switch
          .checked=${this.coreUserData && this.coreUserData.showAdvanced}
          .disabled=${this.coreUserData === undefined}
          @change=${this._advancedToggled}
        ></ha-switch>
      </ha-settings-row>
    `;
  }

  private async _advancedToggled(ev) {
    getOptimisticFrontendUserDataCollection(this.opp.connection, "core").save({
      ...this.coreUserData,
      showAdvanced: ev.currentTarget.checked,
    });
  }

  static get styles(): CSSResult {
    return css`
      a {
        color: var(--primary-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-advanced-mode-row": AdvancedModeRow;
  }
}
