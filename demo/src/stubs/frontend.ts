import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";

export const mockFrontend = (opp: MockOpenPeerPower) => {
  opp.mockWS("frontend/get_user_data", () => ({
    value: null,
  }));
};
