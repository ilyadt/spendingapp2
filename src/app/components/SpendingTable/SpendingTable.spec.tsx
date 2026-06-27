import { test, expect } from '@playwright/experimental-ct-react';
import SpendingTable from "./SpendingTable.tsx";

test('SpendingTable', async ({ mount, page }) => {
  const component = await mount(<SpendingTable date={new Date('2026-06-24')} initSpendings={[]} />);
  await component.page().pause()
  await expect(page).toHaveScreenshot();
});
