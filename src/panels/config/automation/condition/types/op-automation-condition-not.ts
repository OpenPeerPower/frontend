import { customElement } from "lit/decorators";
import { HaLogicalCondition } from "./op-automation-condition-logical";

@customElement("op-automation-condition-not")
export class HaNotCondition extends HaLogicalCondition {}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-condition-not": HaNotCondition;
  }
}
