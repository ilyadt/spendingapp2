import { test, expect } from '@playwright/experimental-ct-react';
import SpendingTable from "@src/components/SpendingTable.tsx";

test('SpendingTable', async ({ mount, page }) => {
  const component = await mount(<SpendingTable date={new Date()} initSpendings={[]} />);
  await component.page().pause()
  await expect(page).toHaveScreenshot();
});
