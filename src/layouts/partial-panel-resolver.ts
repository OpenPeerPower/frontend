import { PolymerElement } from "@polymer/polymer";
import {
  STATE_NOT_RUNNING,
  STATE_RUNNING,
  STATE_STARTING,
} from "open-peer-power-js-websocket";
import { customElement, property, PropertyValues } from "lit-element";
import { deepActiveElement } from "../common/dom/deep-active-element";
import { deepEqual } from "../common/util/deep-equal";
import { getDefaultPanel } from "../data/panel";
import { CustomPanelInfo } from "../data/panel_custom";
import { OpenPeerPower, Panels } from "../types";
import { removeInitSkeleton } from "../util/init-skeleton";
import {
  OppRouterPage,
  RouteOptions,
  RouterOptions,
} from "./opp-router-page";

const CACHE_URL_PATHS = ["lovelace", "developer-tools"];
const COMPONENTS = {
  calendar: () => import("../panels/calendar/ha-panel-calendar"),
  config: () => import("../panels/config/ha-panel-config"),
  custom: () => import("../panels/custom/ha-panel-custom"),
  "developer-tools": () =>
    import("../panels/developer-tools/ha-panel-developer-tools"),
  lovelace: () => import("../panels/lovelace/ha-panel-lovelace"),
  history: () => import("../panels/history/ha-panel-history"),
  iframe: () => import("../panels/iframe/ha-panel-iframe"),
  logbook: () => import("../panels/logbook/ha-panel-logbook"),
  mailbox: () => import("../panels/mailbox/ha-panel-mailbox"),
  map: () => import("../panels/map/ha-panel-map"),
  my: () => import("../panels/my/ha-panel-my"),
  profile: () => import("../panels/profile/ha-panel-profile"),
  "shopping-list": () =>
    import("../panels/shopping-list/ha-panel-shopping-list"),
  "media-browser": () =>
    import("../panels/media-browser/ha-panel-media-browser"),
};

@customElement("partial-panel-resolver")
class PartialPanelResolver extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow?: boolean;

  private _waitForStart = false;

  private _disconnectedPanel?: HTMLElement;

  private _disconnectedActiveElement?: HTMLElement;

  private _hiddenTimeout?: number;

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);

    // Attach listeners for visibility
    document.addEventListener(
      "visibilitychange",
      () => this._checkVisibility(),
      false
    );
    document.addEventListener("resume", () => this._checkVisibility());
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    if (!changedProps.has("opp")) {
      return;
    }

    const oldOpp = changedProps.get("opp") as this["opp"];

    if (
      this._waitForStart &&
      (this.opp.config.state === STATE_STARTING ||
        this.opp.config.state === STATE_RUNNING)
    ) {
      this._waitForStart = false;
      this.rebuild();
    }

    if (this.opp.panels && (!oldOpp || oldOpp.panels !== this.opp.panels)) {
      this._updateRoutes(oldOpp?.panels);
    }
  }

  protected createLoadingScreen() {
    const el = super.createLoadingScreen();
    el.rootnav = true;
    el.opp = this.opp;
    el.narrow = this.narrow;
    return el;
  }

  protected updatePageEl(el) {
    const opp = this.opp;

    if ("setProperties" in el) {
      // As long as we have Polymer panels
      (el as PolymerElement).setProperties({
        opp: this.opp,
        narrow: this.narrow,
        route: this.routeTail,
        panel: opp.panels[this._currentPage],
      });
    } else {
      el.opp = opp;
      el.narrow = this.narrow;
      el.route = this.routeTail;
      el.panel = opp.panels[this._currentPage];
    }
  }

  private _checkVisibility() {
    if (this.opp.suspendWhenHidden === false) {
      return;
    }

    if (document.hidden) {
      this._onHidden();
    } else {
      this._onVisible();
    }
  }

  private getRoutes(panels: Panels): RouterOptions {
    const routes: RouterOptions["routes"] = {};
    Object.values(panels).forEach((panel) => {
      const data: RouteOptions = {
        tag: `ha-panel-${panel.component_name}`,
        cache: CACHE_URL_PATHS.includes(panel.url_path),
      };
      if (panel.component_name in COMPONENTS) {
        data.load = COMPONENTS[panel.component_name];
      }
      routes[panel.url_path] = data;
    });

    return {
      beforeRender: (page) => {
        if (!page || !routes[page]) {
          return getDefaultPanel(this.opp).url_path;
        }
        return undefined;
      },
      showLoading: true,
      routes,
    };
  }

  private _onHidden() {
    this._hiddenTimeout = window.setTimeout(() => {
      this._hiddenTimeout = undefined;
      // setTimeout can be delayed in the background and only fire
      // when we switch to the tab or app again (Hey Android!)
      if (!document.hidden) {
        return;
      }
      const curPanel = this.opp.panels[this._currentPage];
      if (
        this.lastChild &&
        // iFrames will lose their state when disconnected
        // Do not disconnect any iframe panel
        curPanel.component_name !== "iframe" &&
        // Do not disconnect any custom panel that embeds into iframe (ie oppio)
        (curPanel.component_name !== "custom" ||
          !(curPanel as CustomPanelInfo).config._panel_custom.embed_iframe)
      ) {
        this._disconnectedPanel = this.lastChild as HTMLElement;
        const activeEl = deepActiveElement(
          this._disconnectedPanel.shadowRoot || undefined
        );
        if (activeEl instanceof HTMLElement) {
          this._disconnectedActiveElement = activeEl;
        }
        this.removeChild(this.lastChild);
      }
    }, 300000);
    window.addEventListener("focus", () => this._onVisible(), { once: true });
  }

  private _onVisible() {
    if (this._hiddenTimeout) {
      clearTimeout(this._hiddenTimeout);
      this._hiddenTimeout = undefined;
    }
    if (this._disconnectedPanel) {
      this.appendChild(this._disconnectedPanel);
      this._disconnectedPanel = undefined;
    }
    if (this._disconnectedActiveElement) {
      this._disconnectedActiveElement.focus();
      this._disconnectedActiveElement = undefined;
    }
  }

  private async _updateRoutes(oldPanels?: OpenPeerPower["panels"]) {
    this.routerOptions = this.getRoutes(this.opp.panels);

    if (
      !this._waitForStart &&
      this._currentPage &&
      !this.opp.panels[this._currentPage]
    ) {
      if (this.opp.config.state !== STATE_NOT_RUNNING) {
        this._waitForStart = true;
        if (this.lastChild) {
          this.removeChild(this.lastChild);
        }
        this.appendChild(this.createLoadingScreen());
        return;
      }
    }

    if (
      !oldPanels ||
      !deepEqual(
        oldPanels[this._currentPage],
        this.opp.panels[this._currentPage]
      )
    ) {
      await this.rebuild();
      await this.pageRendered;
      removeInitSkeleton();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "partial-panel-resolver": PartialPanelResolver;
  }
}
