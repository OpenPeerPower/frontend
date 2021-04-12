import { Constructor } from "../types";
import { OppBaseEl } from "./opp-base-mixin";

export default <T extends Constructor<OppBaseEl>>(superClass: T) =>
  class extends superClass {
    protected firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      // @ts-ignore
      this.registerDialog({
        dialogShowEvent: "opp-notification",
        dialogTag: "notification-manager",
        dialogImport: () => import("../managers/notification-manager"),
      });
    }
  };
