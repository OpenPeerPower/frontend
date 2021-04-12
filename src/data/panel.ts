import { fireEvent } from "../common/dom/fire_event";
import { OpenPeerPower, PanelInfo } from "../types";

/** Panel to show when no panel is picked. */
export const DEFAULT_PANEL = "lovelace";

export const getStorageDefaultPanelUrlPath = (): string =>
  localStorage.defaultPanel
    ? JSON.parse(localStorage.defaultPanel)
    : DEFAULT_PANEL;

export const setDefaultPanel = (
  element: HTMLElement,
  urlPath: string
): void => {
  fireEvent(element, "opp-default-panel", { defaultPanel: urlPath });
};

export const getDefaultPanel = (opp: OpenPeerPower): PanelInfo =>
  opp.panels[opp.defaultPanel]
    ? opp.panels[opp.defaultPanel]
    : opp.panels[DEFAULT_PANEL];

export const getPanelNameTranslationKey = (panel: PanelInfo): string => {
  if (panel.url_path === "lovelace") {
    return "panel.states";
  }

  if (panel.url_path === "profile") {
    return "panel.profile";
  }

  return `panel.${panel.title}`;
};

export const getPanelTitle = (opp: OpenPeerPower): string | undefined => {
  if (!opp.panels) {
    return undefined;
  }

  const panel = Object.values(opp.panels).find(
    (p: PanelInfo): boolean => p.url_path === opp.panelUrl
  );

  if (!panel) {
    return undefined;
  }

  const translationKey = getPanelNameTranslationKey(panel);

  return opp.localize(translationKey) || panel.title || undefined;
};

export const getPanelIcon = (panel: PanelInfo): string | null => {
  if (!panel.icon) {
    switch (panel.component_name) {
      case "profile":
        return "opp:account";
      case "lovelace":
        return "opp:view-dashboard";
    }
  }

  return panel.icon;
};
