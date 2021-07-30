import "@material/mwc-button/mwc-button";
import "@material/mwc-icon-button";
import { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import "@material/mwc-list/mwc-list-item";
import { mdiContentCopy } from "@mdi/js";
import "@polymer/paper-tooltip/paper-tooltip";
import {
  css,
  CSSResult,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { formatDateTime } from "../../../common/datetime/format_date_time";
import { copyToClipboard } from "../../../common/util/copy-clipboard";
import { isComponentLoaded } from "../../../common/config/is_component_loaded";
import "../../../components/ha-button-menu";
import "../../../components/ha-card";
import "../../../components/ha-circular-progress";
import "../../../components/ha-svg-icon";
import { domainToName } from "../../../data/integration";
import {
  subscribeSystemHealthInfo,
  SystemCheckValueObject,
  SystemHealthInfo,
} from "../../../data/system_health";
import { OpenPeerPower } from "../../../types";
import { showToast } from "../../../util/toast";

const sortKeys = (a: string, b: string) => {
  if (a === "openpeerpower") {
    return -1;
  }
  if (b === "openpeerpower") {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  if (b < a) {
    return 1;
  }
  return 0;
};

class SystemHealthCard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _info?: SystemHealthInfo;

  protected render(): TemplateResult {
    if (!this.opp) {
      return html``;
    }
    const sections: TemplateResult[] = [];

    if (!this._info) {
      sections.push(
        html`
          <div class="loading-container">
            <op-circular-progress active></op-circular-progress>
          </div>
        `
      );
    } else {
      const domains = Object.keys(this._info).sort(sortKeys);
      for (const domain of domains) {
        const domainInfo = this._info[domain];
        const keys: TemplateResult[] = [];

        for (const key of Object.keys(domainInfo.info)) {
          let value: unknown;

          if (
            domainInfo.info[key] &&
            typeof domainInfo.info[key] === "object"
          ) {
            const info = domainInfo.info[key] as SystemCheckValueObject;

            if (info.type === "pending") {
              value = html`
                <op-circular-progress active size="tiny"></op-circular-progress>
              `;
            } else if (info.type === "failed") {
              value = html`
                <span class="error">${info.error}</span>${!info.more_info
                  ? ""
                  : html`
                      –
                      <a
                        href=${info.more_info}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        ${this.opp.localize(
                          "ui.panel.config.info.system_health.more_info"
                        )}
                      </a>
                    `}
              `;
            } else if (info.type === "date") {
              value = formatDateTime(new Date(info.value), this.opp.locale);
            }
          } else {
            value = domainInfo.info[key];
          }

          keys.push(html`
            <tr>
              <td>
                ${this.opp.localize(
                  `component.${domain}.system_health.info.${key}`
                ) || key}
              </td>
              <td>${value}</td>
            </tr>
          `);
        }
        if (domain !== "openpeerpower") {
          sections.push(
            html`
              <div class="card-header">
                <h3>${domainToName(this.opp.localize, domain)}</h3>
                ${!domainInfo.manage_url
                  ? ""
                  : html`
                      <a class="manage" href=${domainInfo.manage_url}>
                        <mwc-button>
                          ${this.opp.localize(
                            "ui.panel.config.info.system_health.manage"
                          )}
                        </mwc-button>
                      </a>
                    `}
              </div>
            `
          );
        }
        sections.push(html`
          <table>
            ${keys}
          </table>
        `);
      }
    }

    return html`
      <op-card>
        <h1 class="card-header">
          <div class="card-header-text">
            ${domainToName(this.opp.localize, "system_health")}
          </div>
          <op-button-menu
            corner="BOTTOM_START"
            slot="toolbar-icon"
            @action=${this._copyInfo}
          >
            <mwc-icon-button slot="trigger" alt="menu">
              <op-svg-icon .path=${mdiContentCopy}></op-svg-icon>
            </mwc-icon-button>
            <mwc-list-item>
              ${this.opp.localize("ui.panel.config.info.copy_raw")}
            </mwc-list-item>
            <mwc-list-item>
              ${this.opp.localize("ui.panel.config.info.copy_github")}
            </mwc-list-item>
          </op-button-menu>
        </h1>
        <div class="card-content">${sections}</div>
      </op-card>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);

    this.opp!.loadBackendTranslation("system_health");

    if (!isComponentLoaded(this.opp!, "system_health")) {
      this._info = {
        system_health: {
          info: {
            error: this.opp.localize(
              "ui.panel.config.info.system_health_error"
            ),
          },
        },
      };
      return;
    }

    subscribeSystemHealthInfo(this.opp!, (info) => {
      this._info = info;
    });
  }

  private async _copyInfo(ev: CustomEvent<ActionDetail>): Promise<void> {
    const github = ev.detail.index === 1;
    let haContent: string | undefined;
    const domainParts: string[] = [];

    for (const domain of Object.keys(this._info!).sort(sortKeys)) {
      const domainInfo = this._info![domain];
      let first = true;
      const parts = [
        `${
          github && domain !== "openpeerpower"
            ? `<details><summary>${domainToName(
                this.opp.localize,
                domain
              )}</summary>\n`
            : ""
        }`,
      ];

      for (const key of Object.keys(domainInfo.info)) {
        let value: unknown;

        if (typeof domainInfo.info[key] === "object") {
          const info = domainInfo.info[key] as SystemCheckValueObject;

          if (info.type === "pending") {
            value = "pending";
          } else if (info.type === "failed") {
            value = `failed to load: ${info.error}`;
          } else if (info.type === "date") {
            value = formatDateTime(new Date(info.value), this.opp.locale);
          }
        } else {
          value = domainInfo.info[key];
        }
        if (github && first) {
          parts.push(`${key} | ${value}\n-- | --`);
          first = false;
        } else {
          parts.push(`${key}${github ? " | " : ": "}${value}`);
        }
      }

      if (domain === "openpeerpower") {
        haContent = parts.join("\n");
      } else {
        domainParts.push(parts.join("\n"));
        if (github && domain !== "openpeerpower") {
          domainParts.push("</details>");
        }
      }
    }

    await copyToClipboard(
      `${github ? "## " : ""}System Health\n${haContent}\n\n${domainParts.join(
        "\n\n"
      )}`
    );

    showToast(this, {
      message: this.opp.localize("ui.common.copied_clipboard"),
    });
  }

  static get styles(): CSSResult {
    return css`
      table {
        width: 100%;
      }

      td:first-child {
        width: 45%;
      }

      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card-header {
        justify-content: space-between;
        display: flex;
        align-items: center;
      }

      .error {
        color: var(--error-color);
      }

      a {
        color: var(--primary-color);
      }

      a.manage {
        text-decoration: none;
      }
    `;
  }
}

customElements.define("system-health-card", SystemHealthCard);
