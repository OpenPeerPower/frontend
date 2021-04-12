import { OPPDomEvent } from "../common/dom/fire_event";
import { Constructor } from "../types";
import { OppBaseEl } from "./opp-base-mixin";

interface WriteLogParams {
  level?: "debug" | "info" | "warning" | "error" | "critical";
  message: string;
}

declare global {
  // for fire event
  interface OPPDomEvents {
    write_log: WriteLogParams;
  }
  interface HTMLElementEventMap {
    write_log: OPPDomEvent<WriteLogParams>;
  }
}

export const loggingMixin = <T extends Constructor<OppBaseEl>>(
  superClass: T
) =>
  class extends superClass {
    protected firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      this.addEventListener("write_log", (ev) => {
        this._writeLog(ev.detail);
      });
    }

    private _writeLog(log: WriteLogParams) {
      this.opp?.callService("system_log", "write", {
        logger: `frontend.${
          __DEV__ ? "js_dev" : "js"
        }.${__BUILD__}.${__VERSION__.replace(".", "")}`,
        message: log.message,
        level: log.level || "error",
      });
    }
  };
