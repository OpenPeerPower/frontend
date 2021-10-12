import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import "../../components/ha-paper-dropdown-menu";
import "../../components/op-settings-row";
import { fetchDashboards, LovelaceDashboard } from "../../data/lovelace";
import { setDefaultPanel } from "../../data/panel";
import { OpenPeerPower } from "../../types";

@customElement("ha-pick-dashboard-row")
class HaPickDashboardRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @internalProperty() private _dashboards: LovelaceDashboard[] = [];

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._getDashboards();
  }

  protected render(): TemplateResult {
    return html`
      <op-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.dashboard.header")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.dashboard.description")}
        </span>
        <op-paper-dropdown-menu
          .label=${this.opp.localize(
            "ui.panel.profile.dashboard.dropdown_label"
          )}
          dynamic-align
          .disabled=${!this._dashboards.length}
        >
          <paper-listbox
            slot="dropdown-content"
            .selected=${this.opp.defaultPanel}
            @iron-select=${this._dashboardChanged}
            attr-for-selected="url-path"
          >
            <paper-item url-path="lovelace">default</paper-item>
            ${this._dashboards.map((dashboard) => {
              if (!this.opp.user!.is_admin && dashboard.require_admin) {
                return "";
              }
              return html`
                <paper-item url-path=${dashboard.url_path}
                  >${dashboard.title}</paper-item
                >
              `;
            })}
          </paper-listbox>
        </op-paper-dropdown-menu>
      </op-settings-row>
    `;
  }

  private async _getDashboards() {
    this._dashboards = await fetchDashboards(this.opp);
  }

  private _dashboardChanged(ev: CustomEvent) {
    const urlPath = ev.detail.item.getAttribute("url-path");
    if (!urlPath || urlPath === this.opp.defaultPanel) {
      return;
    }
    setDefaultPanel(this, urlPath);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-pick-dashboard-row": HaPickDashboardRow;
  }
}
