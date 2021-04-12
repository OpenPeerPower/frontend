/** Return an icon representing a cover state. */
import { OppEntity } from "open-peer-power-js-websocket";

export const coverIcon = (state?: string, stateObj?: OppEntity): string => {
  const open = state !== "closed";

  switch (stateObj?.attributes.device_class) {
    case "garage":
      switch (state) {
        case "opening":
          return "opp:arrow-up-box";
        case "closing":
          return "opp:arrow-down-box";
        case "closed":
          return "opp:garage";
        default:
          return "opp:garage-open";
      }
    case "gate":
      switch (state) {
        case "opening":
        case "closing":
          return "opp:gate-arrow-right";
        case "closed":
          return "opp:gate";
        default:
          return "opp:gate-open";
      }
    case "door":
      return open ? "opp:door-open" : "opp:door-closed";
    case "damper":
      return open ? "opp:circle" : "opp:circle-slice-8";
    case "shutter":
      switch (state) {
        case "opening":
          return "opp:arrow-up-box";
        case "closing":
          return "opp:arrow-down-box";
        case "closed":
          return "opp:window-shutter";
        default:
          return "opp:window-shutter-open";
      }
    case "blind":
    case "curtain":
    case "shade":
      switch (state) {
        case "opening":
          return "opp:arrow-up-box";
        case "closing":
          return "opp:arrow-down-box";
        case "closed":
          return "opp:blinds";
        default:
          return "opp:blinds-open";
      }
    case "window":
      switch (state) {
        case "opening":
          return "opp:arrow-up-box";
        case "closing":
          return "opp:arrow-down-box";
        case "closed":
          return "opp:window-closed";
        default:
          return "opp:window-open";
      }
  }

  switch (state) {
    case "opening":
      return "opp:arrow-up-box";
    case "closing":
      return "opp:arrow-down-box";
    case "closed":
      return "opp:window-closed";
    default:
      return "opp:window-open";
  }
};

export const computeOpenIcon = (stateObj: OppEntity): string => {
  switch (stateObj.attributes.device_class) {
    case "awning":
    case "door":
    case "gate":
      return "opp:arrow-expand-horizontal";
    default:
      return "opp:arrow-up";
  }
};

export const computeCloseIcon = (stateObj: OppEntity): string => {
  switch (stateObj.attributes.device_class) {
    case "awning":
    case "door":
    case "gate":
      return "opp:arrow-collapse-horizontal";
    default:
      return "opp:arrow-down";
  }
};
