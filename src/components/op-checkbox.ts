import { Checkbox } from "@material/mwc-checkbox";
import { customElement } from "lit/decorators";

@customElement("op-checkbox")
export class HaCheckbox extends Checkbox {
  public firstUpdated() {
    super.firstUpdated();
    this.style.setProperty("--mdc-theme-secondary", "var(--primary-color)");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-checkbox": HaCheckbox;
  }
}
