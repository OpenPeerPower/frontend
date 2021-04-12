import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";

export const mockMediaPlayer = (opp: MockOpenPeerPower) => {
  opp.mockWS("media_player_thumbnail", () => Promise.reject());
};
