export interface SystemAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  entityType?: string;
  entityId?: string;
  isResolved: boolean;
  createdAt: Date;
}

export interface BypassIncidentRecord {
  id: string;
  leadId: string;
  senderId: string;
  messageRaw: string;
  detectedPatterns: any;
  policyApplied: string;
  createdAt: Date;
  lead?: { id: string; property?: { title: string } };
}

export const sharedSystemSettings = new Map<string, string>([
  ['bypassPolicy', 'MASK'],
  ['maintenanceMode', 'false'],
  ['minCommissionRate', '1.5'],
]);

export const sharedIncidents: BypassIncidentRecord[] = [
  {
    id: 'inc-1',
    leadId: 'lead-101',
    senderId: 'user-c1',
    messageRaw: 'Call me directly at 9876543210 for property inspection',
    detectedPatterns: [{ type: 'PHONE', match: '9876543210' }],
    policyApplied: 'MASK',
    createdAt: new Date('2026-03-08T10:30:00Z'),
    lead: { id: 'lead-101', property: { title: 'Prestige Golfshire Luxury Villa' } },
  },
  {
    id: 'inc-2',
    leadId: 'lead-102',
    senderId: 'user-o1',
    messageRaw: 'Send token advance to my email: vikram@personal-realty.in',
    detectedPatterns: [{ type: 'EMAIL', match: 'vikram@personal-realty.in' }],
    policyApplied: 'MASK',
    createdAt: new Date('2026-03-08T11:15:00Z'),
    lead: { id: 'lead-102', property: { title: 'Sobha City Casa Paradiso' } },
  },
];

export const sharedAlerts: SystemAlert[] = [
  {
    id: 'alert-1',
    type: 'PRICE_OUTLIER',
    severity: 'HIGH',
    details: 'Property listing ID prop-seeded-2 submitted with price 35% below locality average.',
    entityType: 'Property',
    entityId: 'prop-seeded-2',
    isResolved: false,
    createdAt: new Date('2026-03-07'),
  },
  {
    id: 'alert-2',
    type: 'DUPLICATE_LISTING',
    severity: 'HIGH',
    details: 'Owner phone 9123456789 associated with duplicate property listing in Worli.',
    entityType: 'Property',
    entityId: 'prop-seeded-4',
    isResolved: false,
    createdAt: new Date('2026-03-07'),
  },
  {
    id: 'alert-3',
    type: 'CONTACT_INFO_SHARING',
    severity: 'MEDIUM',
    details: 'User user-c1 attempted to share phone number in lead lead-101. Anti-bypass policy applied.',
    entityType: 'Lead',
    entityId: 'lead-101',
    isResolved: false,
    createdAt: new Date('2026-03-08'),
  },
];
