import {
  css,
  CSSResult,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../components/ha-card";
import "../../../layouts/opp-loading-screen";
import "../../../layouts/opp-tabs-subpage";
import { OpenPeerPower, Route } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import "../ha-config-section";
import "../ha-entity-config";
import { configSections } from "../ha-panel-config";
import "./ha-form-customize";

class HaConfigCustomize extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide?: boolean;

  @property() public narrow?: boolean;

  @property() public route!: Route;

  @property() private _selectedEntityId = "";

  protected render(): TemplateResult {
    return html`
      <style include="op-style"></style>
      <opp-tabs-subpage
      .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        back-path="/config"
        .tabs=${configSections.advanced}
      >
        <op-config-section .isWide=${this.isWide}>
            <span slot="header">
            ${this.opp.localize("ui.panel.config.customize.picker.header")}
            </span>
            <span slot="introduction">
            ${this.opp.localize(
              "ui.panel.config.customize.picker.introduction"
            )}
              <br />
              <a
              href=${documentationUrl(
                this.opp,
                "/docs/configuration/customizing-devices/#customization-using-the-ui"
              )}
                target="_blank"
                rel="noreferrer"
              >
              ${this.opp.localize(
                "ui.panel.config.customize.picker.documentation"
              )}
              </a>
            </span>
            <op-entity-config
              .opp=${this.opp}
              .selectedEntityId=${this._selectedEntityId}
            >
            </op-entity-config>
          </op-config-section>
        </div>
      </opp-tabs-subpage>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);

    if (!this.route.path.includes("/edit/")) {
      return;
    }
    const routeSegments = this.route.path.split("/edit/");
    this._selectedEntityId = routeSegments.length > 1 ? routeSegments[1] : "";
  }

  static get styles(): CSSResult {
    return css`
      a {
        color: var(--primary-color);
      }
    `;
  }
}
customElements.define("ha-config-customize", HaConfigCustomize);
