import { customElement, property } from "lit/decorators";
import { OppioPanelInfo } from "../../src/data/oppio/supervisor";
import { Supervisor } from "../../src/data/supervisor/supervisor";
import {
  OppRouterPage,
  RouterOptions,
} from "../../src/layouts/opp-router-page";
import "../../src/resources/op-style";
import { OpenPeerPower } from "../../src/types";
// Don't codesplit it, that way the dashboard always loads fast.
import "./oppio-panel";

@customElement("oppio-router")
class OppioRouter extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public panel!: OppioPanelInfo;

  @property({ type: Boolean }) public narrow!: boolean;

  protected routerOptions: RouterOptions = {
    // Opp.io has a page with tabs, so we route all non-matching routes to it.
    defaultPage: "dashboard",
    initialLoad: () => this._redirectIngress(),
    showLoading: true,
    routes: {
      dashboard: {
        tag: "oppio-panel",
        cache: true,
      },
      snapshots: "dashboard",
      store: "dashboard",
      system: "dashboard",
      addon: {
        tag: "oppio-addon-dashboard",
        load: () => import("./addon-view/oppio-addon-dashboard"),
      },
      ingress: {
        tag: "oppio-ingress-view",
        load: () => import("./ingress-view/oppio-ingress-view"),
      },
      _my_redirect: {
        tag: "oppio-my-redirect",
        load: () => import("./oppio-my-redirect"),
      },
    },
  };

  protected updatePageEl(el) {
    // the tabs page does its own routing so needs full route.
    const oppioPanel = el.nodeName === "OPPIO-PANEL";
    const route = oppioPanel ? this.route : this.routeTail;

    if (oppioPanel && this.panel.config?.ingress) {
      this._redirectIngress();
      return;
    }

    el.opp = this.opp;
    el.narrow = this.narrow;
    el.route = route;
    el.supervisor = this.supervisor;

    if (el.localName === "oppio-ingress-view") {
      el.ingressPanel = this.panel.config && this.panel.config.ingress;
    }
  }

  private async _redirectIngress() {
    if (this.panel.config && this.panel.config.ingress) {
      this.route = {
        prefix: "/oppio",
        path: `/ingress/${this.panel.config.ingress}`,
      };
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-router": OppioRouter;
  }
}
