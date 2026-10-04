'use client';

import DynamicServiceDetailPage from '../[serviceSlug]/page';

export default function SolarPanelPageWrapper() {
  return <DynamicServiceDetailPage overrideSlug="solar-panels" />;
}
