import {
  customElement,
  html,
  LitElement,
  PropertyValues,
  query,
  TemplateResult,
} from "lit-element";
import { getEntity } from "../../../src/fake_data/entity";
import { provideOpp } from "../../../src/fake_data/provide_opp";
import "../components/demo-cards";

const ENTITIES = [
  getEntity("light", "controller_1", "on", {
    friendly_name: "Controller 1",
  }),
  getEntity("light", "controller_2", "on", {
    friendly_name: "Controller 2",
  }),
  getEntity("light", "floor", "off", {
    friendly_name: "Floor light",
  }),
  getEntity("light", "kitchen", "on", {
    friendly_name: "Kitchen light",
  }),
];

const CONFIGS = [
  {
    heading: "Controller",
    config: `
- type: entities
  entities:
    - light.controller_1
    - light.controller_2
    - type: divider
    - light.floor
    - light.kitchen
    `,
  },
  {
    heading: "Demo",
    config: `
- type: conditional
  conditions:
    - entity: light.controller_1
      state: "on"
    - entity: light.controller_2
      state_not: "off"
  card:
    type: entities
    entities:
      - light.controller_1
      - light.controller_2
      - light.floor
      - light.kitchen
    `,
  },
];

@customElement("demo-hui-conditional-card")
class DemoConditional extends LitElement {
  @query("#demos") private _demoRoot!: HTMLElement;

  protected render(): TemplateResult {
    return html`<demo-cards id="demos" .configs=${CONFIGS}></demo-cards>`;
  }

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    const opp = provideOpp(this._demoRoot);
    opp.updateTranslations(null, "en");
    opp.updateTranslations("lovelace", "en");
    opp.addEntities(ENTITIES);
  }
}

customElements.define("demo-hui-conditional-card", DemoConditional);
