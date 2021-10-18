import { customElement } from "lit/decorators";
import { HaLogicalCondition } from "./op-automation-condition-logical";

@customElement("op-automation-condition-or")
export class HaOrCondition extends HaLogicalCondition {}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-condition-or": HaOrCondition;
  }
}
