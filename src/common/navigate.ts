import { fireEvent } from "./dom/fire_event";

declare global {
  // for fire event
  interface OPPDomEvents {
    "location-changed": {
      replace: boolean;
    };
  }
}

export const navigate = (_node: any, path: string, replace = false) => {
  if (__DEMO__) {
    if (replace) {
      history.replaceState(
        history.state?.root ? { root: true } : null,
        "",
        `${location.pathname}#${path}`
      );
    } else {
      window.location.hash = path;
    }
  } else if (replace) {
    history.replaceState(history.state?.root ? { root: true } : null, "", path);
  } else {
    history.pushState(null, "", path);
  }
  fireEvent(window, "location-changed", {
    replace,
  });
};
