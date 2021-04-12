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
  getEntity("light", "bed_light", "on", {
    friendly_name: "Bed Light",
  }),
];

const CONFIGS = [
  {
    heading: "Basic example",
    config: `
- type: button
  entity: light.bed_light
    `,
  },
  {
    heading: "With Name (defined in card)",
    config: `
- type: button
  name: Custom Name
  entity: light.bed_light
    `,
  },
  {
    heading: "With Icon",
    config: `
- type: button
  entity: light.bed_light
  icon: mdi:tools
    `,
  },
  {
    heading: "Without State",
    config: `
- type: button
  entity: light.bed_light
  show_state: false
    `,
  },
  {
    heading: "Custom Tap Action (toggle)",
    config: `
- type: button
  entity: light.bed_light
  tap_action:
    action: toggle
    `,
  },
  {
    heading: "Running Service",
    config: `
- type: button
  entity: light.bed_light
  service: light.toggle
    `,
  },
  {
    heading: "Invalid Entity",
    config: `
- type: button
  entity: sensor.invalid_entity
    `,
  },
];

@customElement("demo-hui-entity-button-card")
class DemoButtonEntity extends LitElement {
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

customElements.define("demo-hui-entity-button-card", DemoButtonEntity);
