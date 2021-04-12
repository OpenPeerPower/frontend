import {
  customElement,
  html,
  LitElement,
  PropertyValues,
  query,
  TemplateResult,
} from "lit-element";
import { provideOpp } from "../../../src/fake_data/provide_opp";
import "../components/demo-cards";
import { createPlantEntities } from "../data/plants";

const CONFIGS = [
  {
    heading: "Basic example",
    config: `
- type: plant-status
  entity: plant.lemon_tree
    `,
  },
  {
    heading: "Problem (too bright) + low battery",
    config: `
- type: plant-status
  entity: plant.apple_tree
    `,
  },
  {
    heading: "With picture + multiple problems",
    config: `
- type: plant-status
  entity: plant.sunflowers
  name: Sunflowers Name Overwrite
    `,
  },
];

@customElement("demo-hui-plant-card")
export class DemoPlantEntity extends LitElement {
  @query("#demos") private _demoRoot!: HTMLElement;

  protected render(): TemplateResult {
    return html`<demo-cards id="demos" .configs=${CONFIGS}></demo-cards>`;
  }

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    const opp = provideOpp(this._demoRoot);
    opp.updateTranslations(null, "en");
    opp.updateTranslations("lovelace", "en");
    opp.addEntities(createPlantEntities());
  }
}

customElements.define("demo-hui-plant-card", DemoPlantEntity);
