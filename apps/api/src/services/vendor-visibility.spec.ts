/**
 * Unit Test: Vendor Visibility & Strict Verification Enforcement
 */

describe('Vendor Visibility Enforcement', () => {
  const sampleProviders = [
    {
      id: 'p-1',
      categoryName: 'Electrician',
      isVerified: true,
      verificationStatus: 'APPROVED',
      requiresBackgroundCheck: false,
      backgroundCheckStatus: 'NOT_REQUIRED',
    },
    {
      id: 'p-2',
      categoryName: 'Electrician',
      isVerified: false,
      verificationStatus: 'PENDING',
      requiresBackgroundCheck: false,
      backgroundCheckStatus: 'NOT_REQUIRED',
    },
    {
      id: 'p-3',
      categoryName: 'Babysitter',
      isVerified: true,
      verificationStatus: 'APPROVED',
      requiresBackgroundCheck: true,
      backgroundCheckStatus: 'PASSED',
    },
    {
      id: 'p-4',
      categoryName: 'Babysitter',
      isVerified: true,
      verificationStatus: 'APPROVED',
      requiresBackgroundCheck: true,
      backgroundCheckStatus: 'PENDING', // Fails strict check
    },
  ];

  function filterPublicBookableProviders(providers: typeof sampleProviders, category?: string) {
    return providers.filter((p) => {
      if (!p.isVerified || p.verificationStatus !== 'APPROVED') return false;
      if (category && p.categoryName.toLowerCase() !== category.toLowerCase()) return false;
      if (p.requiresBackgroundCheck && p.backgroundCheckStatus !== 'PASSED') return false;
      return true;
    });
  }

  it('should strictly exclude unverified or pending vendors from public listings', () => {
    const result = filterPublicBookableProviders(sampleProviders);
    expect(result.map((r) => r.id)).toEqual(['p-1', 'p-3']);
    expect(result.some((r) => r.id === 'p-2')).toBe(false);
  });

  it('should exclude vendors requiring background check whose status is NOT PASSED', () => {
    const result = filterPublicBookableProviders(sampleProviders, 'Babysitter');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('p-3');
    expect(result.some((r) => r.id === 'p-4')).toBe(false);
  });
});
