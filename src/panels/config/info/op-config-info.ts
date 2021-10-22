import {
  css,
  CSSResult,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../layouts/opp-tabs-subpage";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import { configSections } from "../op-panel-config";
import "./integrations-card";
import "./system-health-card";

const JS_TYPE = __BUILD__;
const JS_VERSION = __VERSION__;

class HaConfigInfo extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public showAdvanced!: boolean;

  @property() public route!: Route;

  protected render(): TemplateResult {
    const opp = this.opp;
    const customUiList: Array<{ name: string; url: string; version: string }> =
      (window as any).CUSTOM_UI_LIST || [];

    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        back-path="/config"
        .route=${this.route}
        .tabs=${configSections.general}
      >
        <div class="about">
          <a
            href="${documentationUrl(this.opp, "")}"
            target="_blank"
            rel="noreferrer"
            ><img
              src="/static/icons/favicon-192x192.png"
              height="192"
              alt="${this.opp.localize(
                "ui.panel.config.info.open_peer_power_logo"
              )}"
          /></a>
          <br />
          <h2>Open Peer Power ${opp.connection.haVersion}</h2>
          <p>
            ${this.opp.localize(
              "ui.panel.config.info.path_configuration",
              "path",
              opp.config.config_dir
            )}
          </p>
          <p class="develop">
            <a
              href="${documentationUrl(this.opp, "/developers/credits/")}"
              target="_blank"
              rel="noreferrer"
            >
              ${this.opp.localize("ui.panel.config.info.developed_by")}
            </a>
          </p>
          <p>
            ${this.opp.localize("ui.panel.config.info.license")}<br />
            ${this.opp.localize("ui.panel.config.info.source")}
            <a
              href="https://github.com/openpeerpower/core"
              target="_blank"
              rel="noreferrer"
              >${this.opp.localize("ui.panel.config.info.server")}</a
            >
            &mdash;
            <a
              href="https://github.com/openpeerpower/frontend"
              target="_blank"
              rel="noreferrer"
              >${this.opp.localize("ui.panel.config.info.frontend")}</a
            >
          </p>
          <p>
            ${this.opp.localize("ui.panel.config.info.built_using")}
            <a href="https://www.python.org" target="_blank" rel="noreferrer"
              >Python 3</a
            >,
            <a
              href="https://www.polymer-project.org"
              target="_blank"
              rel="noreferrer"
              >Polymer</a
            >, ${this.opp.localize("ui.panel.config.info.icons_by")}
            <a
              href="https://www.google.com/design/icons/"
              target="_blank"
              rel="noreferrer"
              >Google</a
            >
            ${this.opp.localize("ui.common.and")}
            <a
              href="https://MaterialDesignIcons.com"
              target="_blank"
              rel="noreferrer"
              >MaterialDesignIcons.com</a
            >.
          </p>
          <p>
            ${this.opp.localize(
              "ui.panel.config.info.frontend_version",
              "version",
              JS_VERSION,
              "type",
              JS_TYPE
            )}
            ${customUiList.length > 0
              ? html`
                  <div>
                    ${this.opp.localize("ui.panel.config.info.custom_uis")}
                    ${customUiList.map(
                      (item) => html`
                        <div>
                          <a href="${item.url}" target="_blank"> ${item.name}</a
                          >: ${item.version}
                        </div>
                      `
                    )}
                  </div>
                `
              : ""}
          </p>
        </div>
        <div class="content">
          <system-health-card .opp=${this.opp}></system-health-card>
          <integrations-card .opp=${this.opp}></integrations-card>
        </div>
      </opp-tabs-subpage>
    `;
  }

  protected firstUpdated(changedProps): void {
    super.firstUpdated(changedProps);

    // Legacy custom UI can be slow to register, give them time.
    const customUI = ((window as any).CUSTOM_UI_LIST || []).length;
    setTimeout(() => {
      if (((window as any).CUSTOM_UI_LIST || []).length !== customUI.length) {
        this.requestUpdate();
      }
    }, 1000);
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        :host {
          -ms-user-select: initial;
          -webkit-user-select: initial;
          -moz-user-select: initial;
        }

        .content {
          direction: ltr;
        }

        .about {
          text-align: center;
          line-height: 2em;
        }

        .version {
          @apply --paper-font-headline;
        }

        .develop {
          @apply --paper-font-subhead;
        }

        .about a {
          color: var(--primary-color);
        }

        system-health-card,
        integrations-card {
          display: block;
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-config-info": HaConfigInfo;
  }
}

customElements.define("op-config-info", HaConfigInfo);
