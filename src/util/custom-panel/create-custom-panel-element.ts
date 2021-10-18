export const createCustomPanelElement = (panelConfig) => {
  // Legacy support. Custom panels used to have to define element op-panel-{name}
  const tagName =
    "html_url" in panelConfig
      ? `op-panel-${panelConfig.name}`
      : panelConfig.name;
  return document.createElement(tagName);
};
