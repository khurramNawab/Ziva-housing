'use client';

import DynamicServiceDetailPage from '../[serviceSlug]/page';

export default function SolarPanelsPageWrapper() {
  return <DynamicServiceDetailPage overrideSlug="solar-panels" />;
}
