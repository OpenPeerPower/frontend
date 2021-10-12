import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import "../../../components/op-card";
import {
  domainToName,
  fetchIntegrationManifests,
  integrationIssuesUrl,
  IntegrationManifest,
} from "../../../data/integration";
import { OpenPeerPower } from "../../../types";
import { brandsUrl } from "../../../util/brands-url";

@customElement("integrations-card")
class IntegrationsCard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _manifests?: {
    [domain: string]: IntegrationManifest;
  };

  private _sortedIntegrations = memoizeOne((components: string[]) => {
    return Array.from(
      new Set(
        components.map((comp) =>
          comp.includes(".") ? comp.split(".")[1] : comp
        )
      )
    ).sort();
  });

  firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this._fetchManifests();
  }

  protected render(): TemplateResult {
    return html`
      <op-card
        .header=${this.opp.localize("ui.panel.config.info.integrations")}
      >
        <table class="card-content">
          <tbody>
            ${this._sortedIntegrations(this.opp!.config.components).map(
              (domain) => {
                const manifest = this._manifests && this._manifests[domain];
                return html`
                  <tr>
                    <td>
                      <img
                        loading="lazy"
                        src=${brandsUrl(domain, "icon", true)}
                        referrerpolicy="no-referrer"
                      />
                    </td>
                    <td class="name">
                      ${domainToName(this.opp.localize, domain, manifest)}<br />
                      <span class="domain">${domain}</span>
                    </td>
                    ${!manifest
                      ? ""
                      : html`
                          <td>
                            <a
                              href=${manifest.documentation}
                              target="_blank"
                              rel="noreferrer"
                            >
                              ${this.opp.localize(
                                "ui.panel.config.info.documentation"
                              )}
                            </a>
                          </td>
                          ${manifest.is_built_in || manifest.issue_tracker
                            ? html`
                                <td>
                                  <a
                                    href=${integrationIssuesUrl(
                                      domain,
                                      manifest
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    ${this.opp.localize(
                                      "ui.panel.config.info.issues"
                                    )}
                                  </a>
                                </td>
                              `
                            : ""}
                        `}
                  </tr>
                `;
              }
            )}
          </tbody>
        </table>
      </op-card>
    `;
  }

  private async _fetchManifests() {
    const manifests = {};
    for (const manifest of await fetchIntegrationManifests(this.opp)) {
      manifests[manifest.domain] = manifest;
    }
    this._manifests = manifests;
  }

  static get styles(): CSSResult {
    return css`
      td {
        padding: 0 8px;
      }
      td:first-child {
        padding-left: 0;
      }
      td.name {
        padding: 8px;
      }
      .domain {
        color: var(--secondary-text-color);
      }
      img {
        display: block;
        max-height: 40px;
        max-width: 40px;
      }
      a {
        color: var(--primary-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "integrations-card": IntegrationsCard;
  }
}
