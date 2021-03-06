import { PersistentNotification } from "../../../src/data/persistent_notification";
import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";

export const mockPersistentNotification = (opp: MockOpenPeerPower) => {
  opp.mockWS("persistent_notification/get", () =>
    Promise.resolve([
      {
        created_at: new Date().toISOString(),
        message: "There was motion detected in the backyard.",
        notification_id: "demo-1",
        title: "Motion Detected!",
        status: "unread",
      },
    ] as PersistentNotification[])
  );
};
