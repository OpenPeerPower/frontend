import {
  customElement,
  html,
  internalProperty,
  property,
  TemplateResult,
} from "lit-element";
import { mockHistory } from "../../../../demo/src/stubs/history";
import { LovelaceConfig } from "../../../../src/data/lovelace";
import {
  MockOpenPeerPower,
  provideOpp,
} from "../../../../src/fake_data/provide_opp";
import { OppElement } from "../../../../src/state/opp-element";
import { OpenPeerPower } from "../../../../src/types";
import { castDemoEntities } from "../demo/cast-demo-entities";
import { castDemoLovelace } from "../demo/cast-demo-lovelace";
import "./hc-lovelace";

@customElement("hc-demo")
class HcDemo extends OppElement {
  @property({ attribute: false }) public lovelacePath!: string;

  @internalProperty() private _lovelaceConfig?: LovelaceConfig;

  protected render(): TemplateResult {
    if (!this._lovelaceConfig) {
      return html``;
    }
    return html`
      <hc-lovelace
        .opp=${this.opp}
        .lovelaceConfig=${this._lovelaceConfig}
        .viewPath=${this.lovelacePath}
      ></hc-lovelace>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this._initialize();
  }

  private async _initialize() {
    const initial: Partial<MockOpenPeerPower> = {
      // Override updateOpp so that the correct opp lifecycle methods are called
      updateOpp: (oppUpdate: Partial<OpenPeerPower>) =>
        this._updateOpp(oppUpdate),
    };

    const opp = (this.opp = provideOpp(this, initial));

    mockHistory(opp);

    opp.addEntities(castDemoEntities());
    this._lovelaceConfig = castDemoLovelace();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hc-demo": HcDemo;
  }
}
