import { mdiArrowUpBoldCircle, mdiPuzzle } from "@mdi/js";
import {
  css,
  CSSResultArray,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { atLeastVersion } from "../../../src/common/config/version";
import { navigate } from "../../../src/common/navigate";
import "../../../src/components/ha-card";
import {
  OppioAddonInfo,
  OppioAddonRepository,
} from "../../../src/data/oppio/addon";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import { OpenPeerPower } from "../../../src/types";
import "../components/oppio-card-content";
import { filterAndSort } from "../components/oppio-filter-addons";
import { oppioStyle } from "../resources/oppio-style";

class OppioAddonRepositoryEl extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public repo!: OppioAddonRepository;

  @property({ attribute: false }) public addons!: OppioAddonInfo[];

  @property() public filter!: string;

  private _getAddons = memoizeOne(
    (addons: OppioAddonInfo[], filter?: string) => {
      if (filter) {
        return filterAndSort(addons, filter);
      }
      return addons.sort((a, b) =>
        a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1
      );
    }
  );

  protected render(): TemplateResult {
    const repo = this.repo;
    let _addons = this.addons;
    if (!this.opp.userData?.showAdvanced) {
      _addons = _addons.filter((addon) => {
        return !addon.advanced;
      });
    }
    const addons = this._getAddons(_addons, this.filter);

    if (this.filter && addons.length < 1) {
      return html`
        <div class="content">
          <p class="description">
            ${this.supervisor.localize(
              "store.no_results_found",
              "repository",
              repo.name
            )}
          </p>
        </div>
      `;
    }
    return html`
      <div class="content">
        <h1>
          ${repo.name}
        </h1>
        <div class="card-group">
          ${addons.map(
            (addon) => html`
              <ha-card
                .addon=${addon}
                class=${addon.available ? "" : "not_available"}
                @click=${this._addonTapped}
              >
                <div class="card-content">
                  <oppio-card-content
                    .opp=${this.opp}
                    .title=${addon.name}
                    .description=${addon.description}
                    .available=${addon.available}
                    .icon=${addon.installed && addon.update_available
                      ? mdiArrowUpBoldCircle
                      : mdiPuzzle}
                    .iconTitle=${addon.installed
                      ? addon.update_available
                        ? this.supervisor.localize(
                            "common.new_version_available"
                          )
                        : this.supervisor.localize("addon.installed")
                      : addon.available
                      ? this.supervisor.localize("addon.not_installed")
                      : this.supervisor.localize("addon.not_available")}
                    .iconClass=${addon.installed
                      ? addon.update_available
                        ? "update"
                        : "installed"
                      : !addon.available
                      ? "not_available"
                      : ""}
                    .iconImage=${atLeastVersion(
                      this.opp.config.version,
                      0,
                      105
                    ) && addon.icon
                      ? `/api/oppio/addons/${addon.slug}/icon`
                      : undefined}
                    .showTopbar=${addon.installed || !addon.available}
                    .topbarClass=${addon.installed
                      ? addon.update_available
                        ? "update"
                        : "installed"
                      : !addon.available
                      ? "unavailable"
                      : ""}
                  ></oppio-card-content>
                </div>
              </ha-card>
            `
          )}
        </div>
      </div>
    `;
  }

  private _addonTapped(ev) {
    navigate(this, `/oppio/addon/${ev.currentTarget.addon.slug}`);
  }

  static get styles(): CSSResultArray {
    return [
      oppioStyle,
      css`
        ha-card {
          cursor: pointer;
        }
        .not_available {
          opacity: 0.6;
        }
        a.repo {
          color: var(--primary-text-color);
        }
      `,
    ];
  }
}

customElements.define("oppio-addon-repository", OppioAddonRepositoryEl);
