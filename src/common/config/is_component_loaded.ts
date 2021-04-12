import { OpenPeerPower } from "../../types";

/** Return if a component is loaded. */
export const isComponentLoaded = (
  opp: OpenPeerPower,
  component: string
): boolean => opp && opp.config.components.includes(component);
