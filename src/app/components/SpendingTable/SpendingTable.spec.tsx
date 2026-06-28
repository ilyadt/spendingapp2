import { test, expect } from '@playwright/experimental-ct-react';
import {SpendingTableForTest} from "./SpendingTable.story.tsx";


test('SpendingTable', async ({ mount, page }) => {
  page.on('dialog', () => null); // prevents auto-dismissing dialog

  const component = await mount(
    <SpendingTableForTest />
  );

  await component.page().pause()
  await expect(page).toHaveScreenshot();
});
