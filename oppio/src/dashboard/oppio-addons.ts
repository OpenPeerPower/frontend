import { mdiArrowUpBoldCircle, mdiPuzzle } from "@mdi/js";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { atLeastVersion } from "../../../src/common/config/version";
import { navigate } from "../../../src/common/navigate";
import { compare } from "../../../src/common/string/compare";
import "../../../src/components/ha-card";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import { haStyle } from "../../../src/resources/styles";
import { OpenPeerPower } from "../../../src/types";
import "../components/oppio-card-content";
import { oppioStyle } from "../resources/oppio-style";

@customElement("oppio-addons")
class OppioAddons extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  protected render(): TemplateResult {
    return html`
      <div class="content">
        <h1>${this.supervisor.localize("dashboard.addons")}</h1>
        <div class="card-group">
          ${!this.supervisor.supervisor.addons?.length
            ? html`
                <ha-card>
                  <div class="card-content">
                    <button class="link" @click=${this._openStore}>
                      ${this.supervisor.localize("dashboard.no_addons")}
                    </button>
                  </div>
                </ha-card>
              `
            : this.supervisor.supervisor.addons
                .sort((a, b) => compare(a.name, b.name))
                .map(
                  (addon) => html`
                    <ha-card .addon=${addon} @click=${this._addonTapped}>
                      <div class="card-content">
                        <oppio-card-content
                          .opp=${this.opp}
                          .title=${addon.name}
                          .description=${addon.description}
                          available
                          .showTopbar=${addon.update_available}
                          topbarClass="update"
                          .icon=${addon.update_available!
                            ? mdiArrowUpBoldCircle
                            : mdiPuzzle}
                          .iconTitle=${addon.state !== "started"
                            ? this.supervisor.localize(
                                "dashboard.addon_stopped"
                              )
                            : addon.update_available!
                            ? this.supervisor.localize(
                                "dashboard.addon_new_version"
                              )
                            : this.supervisor.localize(
                                "dashboard.addon_running"
                              )}
                          .iconClass=${addon.update_available
                            ? addon.state === "started"
                              ? "update"
                              : "update stopped"
                            : addon.state === "started"
                            ? "running"
                            : "stopped"}
                          .iconImage=${atLeastVersion(
                            this.opp.config.version,
                            0,
                            105
                          ) && addon.icon
                            ? `/api/oppio/addons/${addon.slug}/icon`
                            : undefined}
                        ></oppio-card-content>
                      </div>
                    </ha-card>
                  `
                )}
        </div>
      </div>
    `;
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      oppioStyle,
      css`
        ha-card {
          cursor: pointer;
        }
      `,
    ];
  }

  private _addonTapped(ev: any): void {
    navigate(this, `/oppio/addon/${ev.currentTarget.addon.slug}/info`);
  }

  private _openStore(): void {
    navigate(this, "/oppio/store");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addons": OppioAddons;
  }
}
