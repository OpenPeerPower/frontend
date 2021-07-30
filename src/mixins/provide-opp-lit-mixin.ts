import { PropertyValues, ReactiveElement } from "lit";
import { Constructor, OpenPeerPower } from "../types";

export interface ProvideOppElement {
  provideOpp(element: HTMLElement);
}

export const ProvideOppLitMixin = <T extends Constructor<ReactiveElement>>(
  superClass: T
) =>
  class extends superClass {
    protected opp!: OpenPeerPower;

    private __provideOpp: HTMLElement[] = [];

    public provideOpp(el) {
      this.__provideOpp.push(el);
      el.opp = this.opp;
    }

    protected updated(changedProps: PropertyValues) {
      super.updated(changedProps);

      if (changedProps.has("opp")) {
        this.__provideOpp.forEach((el) => {
          (el as any).opp = this.opp;
        });
      }
    }
  };
