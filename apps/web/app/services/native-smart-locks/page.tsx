'use client';

import DynamicServiceDetailPage from '../[serviceSlug]/page';

export default function NativeSmartLocksPageWrapper() {
  return <DynamicServiceDetailPage overrideSlug="native-smart-locks" />;
}
