import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";

export const mockAuth = (opp: MockOpenPeerPower) => {
  opp.mockWS("config/auth/list", () => []);
  opp.mockWS("auth/refresh_tokens", () => []);
};
