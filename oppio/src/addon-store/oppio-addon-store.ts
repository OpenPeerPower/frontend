import "@material/mwc-icon-button/mwc-icon-button";
import { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import "@material/mwc-list/mwc-list-item";
import { mdiDotsVertical } from "@mdi/js";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { property, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { atLeastVersion } from "../../../src/common/config/version";
import { fireEvent } from "../../../src/common/dom/fire_event";
import { navigate } from "../../../src/common/navigate";
import "../../../src/common/search/search-input";
import { extractSearchParam } from "../../../src/common/url/search-params";
import "../../../src/components/ha-button-menu";
import "../../../src/components/ha-svg-icon";
import {
  OppioAddonInfo,
  OppioAddonRepository,
  reloadOppioAddons,
} from "../../../src/data/oppio/addon";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import "../../../src/layouts/opp-loading-screen";
import "../../../src/layouts/opp-tabs-subpage";
import { OpenPeerPower, Route } from "../../../src/types";
import { showRegistriesDialog } from "../dialogs/registries/show-dialog-registries";
import { showRepositoriesDialog } from "../dialogs/repositories/show-dialog-repositories";
import { supervisorTabs } from "../oppio-tabs";
import "./oppio-addon-repository";

const sortRepos = (a: OppioAddonRepository, b: OppioAddonRepository) => {
  if (a.slug === "local") {
    return -1;
  }
  if (b.slug === "local") {
    return 1;
  }
  if (a.slug === "core") {
    return -1;
  }
  if (b.slug === "core") {
    return 1;
  }
  return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1;
};

class OppioAddonStore extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @state() private _filter?: string;

  public async refreshData() {
    await reloadOppioAddons(this.opp);
    await this._loadData();
  }

  protected render(): TemplateResult {
    let repos: TemplateResult[] = [];

    if (this.supervisor.addon.repositories) {
      repos = this.addonRepositories(
        this.supervisor.addon.repositories,
        this.supervisor.addon.addons,
        this._filter
      );
    }

    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .localizeFunc=${this.supervisor.localize}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${supervisorTabs}
        main-page
        supervisor
      >
        <span slot="header"> ${this.supervisor.localize("panel.store")} </span>
        <op-button-menu
          corner="BOTTOM_START"
          slot="toolbar-icon"
          @action=${this._handleAction}
        >
          <mwc-icon-button slot="trigger" alt="menu">
            <op-svg-icon .path=${mdiDotsVertical}></op-svg-icon>
          </mwc-icon-button>
          <mwc-list-item>
            ${this.supervisor.localize("store.repositories")}
          </mwc-list-item>
          <mwc-list-item>
            ${this.supervisor.localize("common.reload")}
          </mwc-list-item>
          ${this.opp.userData?.showAdvanced &&
          atLeastVersion(this.opp.config.version, 0, 117)
            ? html`<mwc-list-item>
                ${this.supervisor.localize("store.registries")}
              </mwc-list-item>`
            : ""}
        </op-button-menu>
        ${repos.length === 0
          ? html`<opp-loading-screen no-toolbar></opp-loading-screen>`
          : html`
              <div class="search">
                <search-input
                  no-label-float
                  no-underline
                  .filter=${this._filter}
                  @value-changed=${this._filterChanged}
                ></search-input>
              </div>

              ${repos}
            `}
        ${!this.opp.userData?.showAdvanced
          ? html`
              <div class="advanced">
                <a href="/profile" target="_top">
                  ${this.supervisor.localize("store.missing_addons")}
                </a>
              </div>
            `
          : ""}
      </opp-tabs-subpage>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    const repositoryUrl = extractSearchParam("repository_url");
    navigate("/oppio/store", { replace: true });
    if (repositoryUrl) {
      this._manageRepositories(repositoryUrl);
    }

    this.addEventListener("opp-api-called", (ev) => this.apiCalled(ev));
    this._loadData();
  }

  private addonRepositories = memoizeOne(
    (
      repositories: OppioAddonRepository[],
      addons: OppioAddonInfo[],
      filter?: string
    ) =>
      repositories.sort(sortRepos).map((repo) => {
        const filteredAddons = addons.filter(
          (addon) => addon.repository === repo.slug
        );

        return filteredAddons.length !== 0
          ? html`
              <oppio-addon-repository
                .opp=${this.opp}
                .repo=${repo}
                .addons=${filteredAddons}
                .filter=${filter!}
                .supervisor=${this.supervisor}
              ></oppio-addon-repository>
            `
          : html``;
      })
  );

  private _handleAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        this._manageRepositoriesClicked();
        break;
      case 1:
        this.refreshData();
        break;
      case 2:
        this._manageRegistries();
        break;
    }
  }

  private apiCalled(ev) {
    if (ev.detail.success) {
      this._loadData();
    }
  }

  private _manageRepositoriesClicked() {
    this._manageRepositories();
  }

  private async _manageRepositories(url?: string) {
    showRepositoriesDialog(this, {
      supervisor: this.supervisor,
      url,
    });
  }

  private async _manageRegistries() {
    showRegistriesDialog(this, { supervisor: this.supervisor });
  }

  private async _loadData() {
    fireEvent(this, "supervisor-collection-refresh", { collection: "addon" });
    fireEvent(this, "supervisor-collection-refresh", {
      collection: "supervisor",
    });
  }

  private async _filterChanged(e) {
    this._filter = e.detail.value;
  }

  static get styles(): CSSResultGroup {
    return css`
      oppio-addon-repository {
        margin-top: 24px;
      }
      .search {
        padding: 0 16px;
        background: var(--sidebar-background-color);
        border-bottom: 1px solid var(--divider-color);
      }
      .search search-input {
        position: relative;
        top: 2px;
      }
      .advanced {
        padding: 12px;
        display: flex;
        flex-wrap: wrap;
        color: var(--primary-text-color);
      }
      .advanced a {
        margin-left: 0.5em;
        color: var(--primary-color);
      }
    `;
  }
}

customElements.define("oppio-addon-store", OppioAddonStore);
