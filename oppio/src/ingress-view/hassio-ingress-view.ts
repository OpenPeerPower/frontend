import { mdiMenu } from "@mdi/js";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../src/common/dom/fire_event";
import { navigate } from "../../../src/common/navigate";
import {
  fetchOppioAddonInfo,
  OppioAddonDetails,
} from "../../../src/data/oppio/addon";
import {
  createOppioSession,
  validateOppioSession,
} from "../../../src/data/oppio/ingress";
import { showAlertDialog } from "../../../src/dialogs/generic/show-dialog-box";
import "../../../src/layouts/opp-loading-screen";
import "../../../src/layouts/opp-subpage";
import { OpenPeerPower, Route } from "../../../src/types";

@customElement("oppio-ingress-view")
class OppioIngressView extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public route!: Route;

  @property() public ingressPanel = false;

  @internalProperty() private _addon?: OppioAddonDetails;

  @property({ type: Boolean })
  public narrow = false;

  private _sessionKeepAlive?: number;

  public disconnectedCallback() {
    super.disconnectedCallback();

    if (this._sessionKeepAlive) {
      clearInterval(this._sessionKeepAlive);
      this._sessionKeepAlive = undefined;
    }
  }

  protected render(): TemplateResult {
    if (!this._addon) {
      return html` <opp-loading-screen></opp-loading-screen> `;
    }

    const iframe = html`<iframe src=${this._addon.ingress_url!}></iframe>`;

    if (!this.ingressPanel) {
      return html`<opp-subpage
        .opp=${this.opp}
        .header=${this._addon.name}
        .narrow=${this.narrow}
      >
        ${iframe}
      </opp-subpage>`;
    }

    return html`${this.narrow || this.opp.dockedSidebar === "always_hidden"
      ? html`<div class="header">
            <mwc-icon-button
              aria-label=${this.opp.localize("ui.sidebar.sidebar_toggle")}
              @click=${this._toggleMenu}
            >
              <ha-svg-icon .path=${mdiMenu}></ha-svg-icon>
            </mwc-icon-button>
            <div class="main-title">${this._addon.name}</div>
          </div>
          ${iframe}`
      : iframe}`;
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    if (!changedProps.has("route")) {
      return;
    }

    const addon = this.route.path.substr(1);

    const oldRoute = changedProps.get("route") as this["route"] | undefined;
    const oldAddon = oldRoute ? oldRoute.path.substr(1) : undefined;

    if (addon && addon !== oldAddon) {
      this._fetchData(addon);
    }
  }

  private async _fetchData(addonSlug: string) {
    const createSessionPromise = createOppioSession(this.opp);

    let addon;

    try {
      addon = await fetchOppioAddonInfo(this.opp, addonSlug);
    } catch (err) {
      await showAlertDialog(this, {
        text: "Unable to fetch add-on info to start Ingress",
        title: "Supervisor",
      });
      history.back();
      return;
    }

    if (!addon.ingress_url) {
      await showAlertDialog(this, {
        text: "Add-on does not support Ingress",
        title: addon.name,
      });
      history.back();
      return;
    }

    if (addon.state !== "started") {
      await showAlertDialog(this, {
        text: "Add-on is not running. Please start it first",
        title: addon.name,
      });
      navigate(this, `/oppio/addon/${addon.slug}/info`, true);
      return;
    }

    let session;

    try {
      session = await createSessionPromise;
    } catch (err) {
      await showAlertDialog(this, {
        text: "Unable to create an Ingress session",
        title: addon.name,
      });
      history.back();
      return;
    }

    if (this._sessionKeepAlive) {
      clearInterval(this._sessionKeepAlive);
    }
    this._sessionKeepAlive = window.setInterval(async () => {
      try {
        await validateOppioSession(this.opp, session);
      } catch (err) {
        session = await createOppioSession(this.opp);
      }
    }, 60000);

    this._addon = addon;
  }

  private _toggleMenu(): void {
    fireEvent(this, "opp-toggle-menu");
  }

  static get styles(): CSSResult {
    return css`
      iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
      }

      .header + iframe {
        height: calc(100% - 40px);
      }

      .header {
        display: flex;
        align-items: center;
        font-size: 16px;
        height: 40px;
        padding: 0 16px;
        pointer-events: none;
        background-color: var(--app-header-background-color);
        font-weight: 400;
        color: var(--app-header-text-color, white);
        border-bottom: var(--app-header-border-bottom, none);
        box-sizing: border-box;
        --mdc-icon-size: 20px;
      }

      .main-title {
        margin: 0 0 0 24px;
        line-height: 20px;
        flex-grow: 1;
      }

      mwc-icon-button {
        pointer-events: auto;
      }

      opp-subpage {
        --app-header-background-color: var(--sidebar-background-color);
        --app-header-text-color: var(--sidebar-text-color);
        --app-header-border-bottom: 1px solid var(--divider-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-ingress-view": OppioIngressView;
  }
}
