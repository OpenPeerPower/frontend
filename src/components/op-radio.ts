import { Radio } from "@material/mwc-radio";
import { customElement } from "lit/decorators";

@customElement("op-radio")
export class HaRadio extends Radio {
  public firstUpdated() {
    super.firstUpdated();
    this.style.setProperty("--mdc-theme-secondary", "var(--primary-color)");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-radio": HaRadio;
  }
}
