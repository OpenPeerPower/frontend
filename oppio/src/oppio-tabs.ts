import { mdiBackupRestore, mdiCogs, mdiStore, mdiViewDashboard } from "@mdi/js";
import type { PageNavigation } from "../../src/layouts/opp-tabs-subpage";

export const supervisorTabs: PageNavigation[] = [
  {
    translationKey: "panel.dashboard",
    path: `/oppio/dashboard`,
    iconPath: mdiViewDashboard,
  },
  {
    translationKey: "panel.store",
    path: `/oppio/store`,
    iconPath: mdiStore,
  },
  {
    translationKey: "panel.snapshots",
    path: `/oppio/snapshots`,
    iconPath: mdiBackupRestore,
  },
  {
    translationKey: "panel.system",
    path: `/oppio/system`,
    iconPath: mdiCogs,
  },
];
