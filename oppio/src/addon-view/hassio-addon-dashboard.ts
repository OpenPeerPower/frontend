import {
  mdiCogs,
  mdiFileDocument,
  mdiInformationVariant,
  mdiMathLog,
} from "@mdi/js";
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
import { fireEvent } from "../../../src/common/dom/fire_event";
import { navigate } from "../../../src/common/navigate";
import { extractSearchParam } from "../../../src/common/url/search-params";
import "../../../src/components/ha-circular-progress";
import {
  fetchOppioAddonInfo,
  fetchOppioAddonsInfo,
  OppioAddonDetails,
} from "../../../src/data/oppio/addon";
import { extractApiErrorMessage } from "../../../src/data/oppio/common";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import "../../../src/layouts/opp-error-screen";
import "../../../src/layouts/opp-loading-screen";
import "../../../src/layouts/opp-tabs-subpage";
import type { PageNavigation } from "../../../src/layouts/opp-tabs-subpage";
import { haStyle } from "../../../src/resources/styles";
import { OpenPeerPower, Route } from "../../../src/types";
import { oppioStyle } from "../resources/oppio-style";
import "./config/oppio-addon-audio";
import "./config/oppio-addon-config";
import "./config/oppio-addon-network";
import "./oppio-addon-router";
import "./info/oppio-addon-info";
import "./log/oppio-addon-logs";

@customElement("oppio-addon-dashboard")
class OppioAddonDashboard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public route!: Route;

  @property({ attribute: false }) public addon?: OppioAddonDetails;

  @property({ type: Boolean }) public narrow!: boolean;

  @internalProperty() _error?: string;

  private _computeTail = memoizeOne((route: Route) => {
    const dividerPos = route.path.indexOf("/", 1);
    return dividerPos === -1
      ? {
          prefix: route.prefix + route.path,
          path: "",
        }
      : {
          prefix: route.prefix + route.path.substr(0, dividerPos),
          path: route.path.substr(dividerPos),
        };
  });

  protected render(): TemplateResult {
    if (this._error) {
      return html`<opp-error-screen
        .error=${this._error}
      ></opp-error-screen>`;
    }

    if (!this.addon) {
      return html`<opp-loading-screen></opp-loading-screen>`;
    }

    const addonTabs: PageNavigation[] = [
      {
        translationKey: "addon.panel.info",
        path: `/oppio/addon/${this.addon.slug}/info`,
        iconPath: mdiInformationVariant,
      },
    ];

    if (this.addon.documentation) {
      addonTabs.push({
        translationKey: "addon.panel.documentation",
        path: `/oppio/addon/${this.addon.slug}/documentation`,
        iconPath: mdiFileDocument,
      });
    }

    if (this.addon.version) {
      addonTabs.push(
        {
          translationKey: "addon.panel.configuration",
          path: `/oppio/addon/${this.addon.slug}/config`,
          iconPath: mdiCogs,
        },
        {
          translationKey: "addon.panel.log",
          path: `/oppio/addon/${this.addon.slug}/logs`,
          iconPath: mdiMathLog,
        }
      );
    }

    const route = this._computeTail(this.route);

    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .localizeFunc=${this.supervisor.localize}
        .narrow=${this.narrow}
        .backPath=${this.addon.version ? "/oppio/dashboard" : "/oppio/store"}
        .route=${route}
        .tabs=${addonTabs}
        supervisor
      >
        <span slot="header">${this.addon.name}</span>
        <oppio-addon-router
          .route=${route}
          .narrow=${this.narrow}
          .opp=${this.opp}
          .supervisor=${this.supervisor}
          .addon=${this.addon}
        ></oppio-addon-router>
      </opp-tabs-subpage>
    `;
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      oppioStyle,
      css`
        :host {
          color: var(--primary-text-color);
        }
        .content {
          padding: 24px 0 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        oppio-addon-info,
        oppio-addon-network,
        oppio-addon-audio,
        oppio-addon-config {
          margin-bottom: 24px;
          width: 600px;
        }
        oppio-addon-logs {
          max-width: calc(100% - 8px);
          min-width: 600px;
        }
        @media only screen and (max-width: 600px) {
          oppio-addon-info,
          oppio-addon-network,
          oppio-addon-audio,
          oppio-addon-config,
          oppio-addon-logs {
            max-width: 100%;
            min-width: 100%;
          }
        }
      `,
    ];
  }

  protected async firstUpdated(): Promise<void> {
    if (this.route.path === "") {
      const requestedAddon = extractSearchParam("addon");
      if (requestedAddon) {
        const addonsInfo = await fetchOppioAddonsInfo(this.opp);
        const validAddon = addonsInfo.addons
          .some((addon) => addon.slug === requestedAddon);
        if (!validAddon) {
          this._error = this.supervisor.localize("my.error_addon_not_found");
        } else {
          navigate(this, `/oppio/addon/${requestedAddon}`, true);
        }
      }
    }
    this.addEventListener("opp-api-called", (ev) => this._apiCalled(ev));
  }

  private async _apiCalled(ev): Promise<void> {
    const pathSplit: string[] = ev.detail.path?.split("/");

    if (!pathSplit || pathSplit.length === 0) {
      return;
    }

    const path: string = pathSplit[pathSplit.length - 1];

    if (["uninstall", "install", "update", "start", "stop"].includes(path)) {
      fireEvent(this, "supervisor-collection-refresh", {
        collection: "supervisor",
      });
    }

    if (path === "uninstall") {
      window.history.back();
    } else {
      await this._routeDataChanged();
    }
  }

  protected updated(changedProperties) {
    if (changedProperties.has("route") && !this.addon) {
      this._routeDataChanged();
    }
  }

  private async _routeDataChanged(): Promise<void> {
    const addon = this.route.path.split("/")[1];
    if (!addon) {
      return;
    }
    try {
      const addoninfo = await fetchOppioAddonInfo(this.opp, addon);
      this.addon = addoninfo;
    } catch (err) {
      this._error = `Error fetching addon info: ${extractApiErrorMessage(err)}`;
      this.addon = undefined;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addon-dashboard": OppioAddonDashboard;
  }
}
