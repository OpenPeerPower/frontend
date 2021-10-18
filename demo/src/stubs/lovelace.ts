import type { LocalizeFunc } from "../../../src/common/translations/localize";
import type { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";
import { selectedDemoConfig } from "../configs/demo-configs";
import "../custom-cards/cast-demo-row";
import "../custom-cards/op-demo-card";
import type { HADemoCard } from "../custom-cards/op-demo-card";

export const mockLovelace = (
  opp: MockOpenPeerPower,
  localizePromise: Promise<LocalizeFunc>
) => {
  opp.mockWS("lovelace/config", () =>
    Promise.all([
      selectedDemoConfig,
      localizePromise,
    ]).then(([config, localize]) => config.lovelace(localize))
  );

  opp.mockWS("lovelace/config/save", () => Promise.resolve());
  opp.mockWS("lovelace/resources", () => Promise.resolve([]));
};

customElements.whenDefined("hui-view").then(() => {
  // eslint-disable-next-line
  const HUIView = customElements.get("hui-view");
  // Patch HUI-VIEW to make the lovelace object available to the demo card
  const oldCreateCard = HUIView.prototype.createCardElement;

  HUIView.prototype.createCardElement = function (config) {
    const el = oldCreateCard.call(this, config);
    if (el.tagName === "HA-DEMO-CARD") {
      (el as HADemoCard).lovelace = this.lovelace;
    }
    return el;
  };
});
