// Compat needs to be first import
import "../../src/resources/compatibility";
import { isNavigationClick } from "../../src/common/dom/is-navigation-click";
import { navigate } from "../../src/common/navigate";
import {
  MockOpenPeerPower,
  provideOpp,
} from "../../src/fake_data/provide_opp";
import { OpenPeerPowerAppEl } from "../../src/layouts/openpeerpower";
import { OpenPeerPower } from "../../src/types";
import { selectedDemoConfig } from "./configs/demo-configs";
import { mockAuth } from "./stubs/auth";
import { mockEvents } from "./stubs/events";
import { mockFrontend } from "./stubs/frontend";
import { mockHistory } from "./stubs/history";
import { mockLovelace } from "./stubs/lovelace";
import { mockMediaPlayer } from "./stubs/media_player";
import { mockPersistentNotification } from "./stubs/persistent_notification";
import { mockShoppingList } from "./stubs/shopping_list";
import { mockSystemLog } from "./stubs/system_log";
import { mockTemplate } from "./stubs/template";
import { mockTranslations } from "./stubs/translations";

class HaDemo extends OpenPeerPowerAppEl {
  protected async _initialize() {
    const initial: Partial<MockOpenPeerPower> = {
      panelUrl: (this as any).panelUrl,
      // Override updateOpp so that the correct opp lifecycle methods are called
      updateOpp: (oppUpdate: Partial<OpenPeerPower>) =>
        this._updateOpp(oppUpdate),
    };

    const opp = (this.opp = provideOpp(this, initial));
    const localizePromise =
      // @ts-ignore
      this._loadFragmentTranslations(opp.language, "page-demo").then(
        () => this.opp!.localize
      );

    mockLovelace(opp, localizePromise);
    mockAuth(opp);
    mockTranslations(opp);
    mockHistory(opp);
    mockShoppingList(opp);
    mockSystemLog(opp);
    mockTemplate(opp);
    mockEvents(opp);
    mockMediaPlayer(opp);
    mockFrontend(opp);
    mockPersistentNotification(opp);

    // Once config is loaded AND localize, set entities and apply theme.
    Promise.all([selectedDemoConfig, localizePromise]).then(
      ([conf, localize]) => {
        opp.addEntities(conf.entities(localize));
        if (conf.theme) {
          opp.mockTheme(conf.theme());
        }
      }
    );

    // Taken from polymer/pwa-helpers. BSD-3 licensed
    document.body.addEventListener(
      "click",
      (e) => {
        const href = isNavigationClick(e);

        if (!href) {
          return;
        }

        e.preventDefault();
        navigate(this, href);
      },
      { capture: true }
    );

    (this as any).oppConnected();
  }
}

customElements.define("ha-demo", HaDemo);
