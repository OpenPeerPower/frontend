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

const CONFIGS = [
  {
    heading: "List example",
    config: `
- type: shopping-list
    `,
  },
  {
    heading: "List with title example",
    config: `
- type: shopping-list
  title: Shopping List
    `,
  },
];

@customElement("demo-hui-shopping-list-card")
class DemoShoppingListEntity extends LitElement {
  @query("#demos") private _demoRoot!: HTMLElement;

  protected render(): TemplateResult {
    return html`<demo-cards id="demos" .configs=${CONFIGS}></demo-cards>`;
  }

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    const opp = provideOpp(this._demoRoot);
    opp.updateTranslations(null, "en");
    opp.updateTranslations("lovelace", "en");

    opp.mockAPI("shopping_list", () => [
      { name: "list", id: 1, complete: false },
      { name: "all", id: 2, complete: false },
      { name: "the", id: 3, complete: false },
      { name: "things", id: 4, complete: true },
    ]);
  }
}

customElements.define("demo-hui-shopping-list-card", DemoShoppingListEntity);
