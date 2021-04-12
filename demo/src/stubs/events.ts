import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";

export const mockEvents = (opp: MockOpenPeerPower) => {
  opp.mockAPI("events", () => []);
};
