/**
 * Unit Test: Platform Commission & Net Payout Calculation Engine
 */

describe('Commission Calculation Engine', () => {
  function calculateCommission(grossAmount: number, ratePercent: number, gstRatePercent = 18) {
    const commissionAmount = Math.round((grossAmount * (ratePercent / 100)) * 100) / 100;
    const gstAmount = Math.round((commissionAmount * (gstRatePercent / 100)) * 100) / 100;
    const netPayoutAmount = Math.round((grossAmount - commissionAmount - gstAmount) * 100) / 100;

    return {
      grossAmount,
      ratePercent,
      commissionAmount,
      gstAmount,
      netPayoutAmount,
    };
  }

  it('should correctly calculate 10% platform commission + 18% GST on a ₹1000 service booking', () => {
    const res = calculateCommission(1000, 10);
    expect(res.commissionAmount).toBe(100);
    expect(res.gstAmount).toBe(18);
    expect(res.netPayoutAmount).toBe(882);
  });

  it('should correctly calculate 5% commission slab on a ₹50,000 property booking', () => {
    const res = calculateCommission(50000, 5);
    expect(res.commissionAmount).toBe(2500);
    expect(res.gstAmount).toBe(450);
    expect(res.netPayoutAmount).toBe(47050);
  });
});
