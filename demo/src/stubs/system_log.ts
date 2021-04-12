import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";

export const mockSystemLog = (opp: MockOpenPeerPower) => {
  opp.mockAPI("error/all", () => []);
};
