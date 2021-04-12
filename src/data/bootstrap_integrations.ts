import { OpenPeerPower } from "../types";

export type BootstrapIntegrationsTimings = { [key: string]: number };

export const subscribeBootstrapIntegrations = (
  opp: OpenPeerPower,
  callback: (message: BootstrapIntegrationsTimings) => void
) => {
  const unsubProm = opp.connection.subscribeMessage<
    BootstrapIntegrationsTimings
  >((message) => callback(message), {
    type: "subscribe_bootstrap_integrations",
  });

  return unsubProm;
};
