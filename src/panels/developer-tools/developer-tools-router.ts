import { PolymerElement } from "@polymer/polymer";
import { customElement, property } from "lit-element";
import { OppRouterPage, RouterOptions } from "../../layouts/opp-router-page";
import { OpenPeerPower } from "../../types";

@customElement("developer-tools-router")
class DeveloperToolsRouter extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  protected routerOptions: RouterOptions = {
    // defaultPage: "info",
    beforeRender: (page) => {
      if (!page || page === "not_found") {
        // If we can, we are going to restore the last visited page.
        return this._currentPage ? this._currentPage : "state";
      }
      return undefined;
    },
    cacheAll: true,
    showLoading: true,
    routes: {
      event: {
        tag: "developer-tools-event",
        load: () => import("./event/developer-tools-event"),
      },
      service: {
        tag: "developer-tools-service",
        load: () => import("./service/developer-tools-service"),
      },
      state: {
        tag: "developer-tools-state",
        load: () => import("./state/developer-tools-state"),
      },
      template: {
        tag: "developer-tools-template",
        load: () => import("./template/developer-tools-template"),
      },
    },
  };

  protected createLoadingScreen() {
    const loadingScreen = super.createLoadingScreen();
    loadingScreen.noToolbar = true;
    return loadingScreen;
  }

  protected createErrorScreen(error: string) {
    const errorEl = super.createErrorScreen(error);
    errorEl.toolbar = false;
    return errorEl;
  }

  protected updatePageEl(el) {
    if ("setProperties" in el) {
      // As long as we have Polymer pages
      (el as PolymerElement).setProperties({
        opp: this.opp,
        narrow: this.narrow,
      });
    } else {
      el.opp = this.opp;
      el.narrow = this.narrow;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "developer-tools-router": DeveloperToolsRouter;
  }
}
