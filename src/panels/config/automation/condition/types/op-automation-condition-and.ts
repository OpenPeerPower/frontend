import { customElement } from "lit/decorators";
import { HaLogicalCondition } from "./op-automation-condition-logical";

@customElement("op-automation-condition-and")
export class HaAndCondition extends HaLogicalCondition {}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-condition-and": HaAndCondition;
  }
}
