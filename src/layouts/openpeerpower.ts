import "@polymer/app-route/app-location";
import {
  customElement,
  html,
  internalProperty,
  PropertyValues,
} from "lit-element";
import { navigate } from "../common/navigate";
import { getStorageDefaultPanelUrlPath } from "../data/panel";
import "../resources/custom-card-support";
import { OppElement } from "../state/opp-element";
import QuickBarMixin from "../state/quick-bar-mixin";
import { OpenPeerPower, Route } from "../types";
import { storeState } from "../util/ha-pref-storage";
import {
  registerServiceWorker,
  supportsServiceWorker,
} from "../util/register-service-worker";
import "./ha-init-page";
import "./openpeerpower-main";

@customElement("openpeerpower")
export class OpenPeerPowerAppEl extends QuickBarMixin(OppElement) {
  @internalProperty() private _route?: Route;

  @internalProperty() private _error = false;

  @internalProperty() private _panelUrl?: string;

  private _haVersion?: string;

  private _hiddenTimeout?: number;

  private _visiblePromiseResolve?: () => void;

  protected render() {
    const opp = this.opp;

    return html`
      <app-location
        @route-changed=${this._routeChanged}
        ?use-hash-as-path=${__DEMO__}
      ></app-location>
      ${this._panelUrl === undefined || this._route === undefined
        ? ""
        : opp && opp.states && opp.config && opp.services
        ? html`
            <openpeerpower-main
              .opp=${this.opp}
              .route=${this._route}
            ></openpeerpower-main>
          `
        : html` <ha-init-page .error=${this._error}></ha-init-page> `}
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this._initialize();
    setTimeout(() => registerServiceWorker(this), 1000);
    /* polyfill for paper-dropdown */
    import("web-animations-js/web-animations-next-lite.min");
    this.addEventListener("opp-suspend-when-hidden", (ev) => {
      this._updateOpp({ suspendWhenHidden: ev.detail.suspend });
      storeState(this.opp!);
    });
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has("_panelUrl")) {
      this.panelUrlChanged(this._panelUrl!);
      this._updateOpp({ panelUrl: this._panelUrl });
    }
    if (changedProps.has("opp")) {
      this.oppChanged(
        this.opp!,
        changedProps.get("opp") as OpenPeerPower | undefined
      );
    }
  }

  protected oppConnected() {
    super.oppConnected();
    // @ts-ignore
    this._loadOppTranslations(this.opp!.language, "state");

    document.addEventListener(
      "visibilitychange",
      () => this._checkVisibility(),
      false
    );
    document.addEventListener("freeze", () => this._suspendApp());
    document.addEventListener("resume", () => this._checkVisibility());
  }

  protected oppReconnected() {
    super.oppReconnected();

    // If backend has been upgraded, make sure we update frontend
    if (this.opp!.connection.haVersion !== this._haVersion) {
      if (supportsServiceWorker()) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          } else {
            location.reload(true);
          }
        });
      } else {
        location.reload(true);
      }
    }
  }

  protected async _initialize() {
    try {
      let result;

      if (window.oppConnection) {
        result = await window.oppConnection;
      } else {
        // In the edge case that
        result = await new Promise((resolve) => {
          window.oppConnectionReady = resolve;
        });
      }

      const { auth, conn } = result;
      this._haVersion = conn.haVersion;
      this.initializeOpp(auth, conn);
    } catch (err) {
      this._error = true;
    }
  }

  private async _routeChanged(ev) {
    // routeChangged event listener is called while we're doing the fist render,
    // causing the update to be ignored. So delay it to next task (Lit render is sync).
    await new Promise((resolve) => setTimeout(resolve, 0));

    const route = ev.detail.value as Route;
    // If it's the first route that we process,
    // check if we should navigate away from /
    if (
      this._route === undefined &&
      (route.path === "" || route.path === "/")
    ) {
      navigate(window, `/${getStorageDefaultPanelUrlPath()}`, true);
      return;
    }

    this._route = route;

    const dividerPos = route.path.indexOf("/", 1);
    this._panelUrl =
      dividerPos === -1
        ? route.path.substr(1)
        : route.path.substr(1, dividerPos - 1);
  }

  protected _checkVisibility() {
    if (document.hidden) {
      // If the document is hidden, we will prevent reconnects until we are visible again
      this._onHidden();
    } else {
      this._onVisible();
    }
  }

  private _onHidden() {
    if (this._visiblePromiseResolve) {
      return;
    }
    this.opp!.connection.suspendReconnectUntil(
      new Promise((resolve) => {
        this._visiblePromiseResolve = resolve;
      })
    );
    if (this.opp!.suspendWhenHidden !== false) {
      // We close the connection to Open Peer Power after being hidden for 5 minutes
      this._hiddenTimeout = window.setTimeout(() => {
        this._hiddenTimeout = undefined;
        // setTimeout can be delayed in the background and only fire
        // when we switch to the tab or app again (Hey Android!)
        if (document.hidden) {
          this._suspendApp();
        }
      }, 300000);
    }
    window.addEventListener("focus", () => this._onVisible(), { once: true });
  }

  private _suspendApp() {
    if (!this.opp!.connection.connected) {
      return;
    }
    this.opp!.connection.suspend();
  }

  private _onVisible() {
    // Clear timer to close the connection
    if (this._hiddenTimeout) {
      clearTimeout(this._hiddenTimeout);
      this._hiddenTimeout = undefined;
    }
    // Unsuspend the reconnect
    if (this._visiblePromiseResolve) {
      this._visiblePromiseResolve();
      this._visiblePromiseResolve = undefined;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    openpeerpower: OpenPeerPowerAppEl;
  }
}
