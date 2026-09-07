import { ContactScannerService } from '../src/chat/contact-scanner.service';

describe('ContactScannerService', () => {
  let scanner: ContactScannerService;

  beforeEach(() => {
    scanner = new ContactScannerService();
  });

  describe('Indian phone number detection', () => {
    const cases = [
      '9876543210',
      '98765 43210',
      '98765-43210',
      '+91 9876543210',
      '09876543210',
      '+919876543210',
      '91-9876-543-210',
    ];

    cases.forEach((phone) => {
      it(`should detect and mask "${phone}"`, () => {
        const result = scanner.scan(`Hello my number is ${phone} call me`);
        expect(result.hasFlaggedContent).toBe(true);
        expect(result.contentSanitized).not.toContain('98765');
        expect(result.flaggedPatterns.length).toBeGreaterThan(0);
        // Verify raw content is preserved
        expect(result.contentRaw).toContain(phone.includes(' ') ? phone : phone);
      });
    });
  });

  describe('Email detection', () => {
    const cases = [
      'rahul@gmail.com',
      'test.user+tag@company.co.in',
    ];

    cases.forEach((email) => {
      it(`should detect and partially mask email "${email}"`, () => {
        const result = scanner.scan(`Contact me at ${email} for details`);
        expect(result.hasFlaggedContent).toBe(true);
        expect(result.contentSanitized).toContain('****@');
        expect(result.flaggedPatterns[0].type).toBe('EMAIL_ADDRESS');
      });
    });
  });

  describe('WhatsApp link detection', () => {
    it('should block wa.me links', () => {
      const result = scanner.scan('Message me on wa.me/919876543210');
      expect(result.hasFlaggedContent).toBe(true);
      expect(result.contentSanitized).toContain('[WhatsApp Link Blocked]');
    });

    it('should block whatsapp.com/send links', () => {
      const result = scanner.scan('Click https://api.whatsapp.com/send?phone=919876543210');
      expect(result.hasFlaggedContent).toBe(true);
    });
  });

  describe('External URL detection', () => {
    it('should block external URLs', () => {
      const result = scanner.scan('Visit http://example.com for details');
      expect(result.hasFlaggedContent).toBe(true);
      expect(result.contentSanitized).toContain('[External Link Blocked');
    });

    it('should NOT block Zivahousing.com URLs', () => {
      const result = scanner.scan('See https://Zivahousing.com/properties/123 for the listing');
      expect(result.hasFlaggedContent).toBe(false);
    });
  });

  describe('Encoded number detection', () => {
    it('should detect word-form numbers', () => {
      const result = scanner.scan('call me at nine eight seven six five four three two one zero');
      expect(result.hasFlaggedContent).toBe(true);
      expect(result.contentSanitized).toContain('[Encoded Number Blocked]');
    });
  });

  describe('Clean messages', () => {
    const cleanMessages = [
      'When can I visit the property?',
      'Is the price negotiable?',
      'I am interested in 2BHK on 3rd floor.',
      'The property looks great in the photos!',
    ];

    cleanMessages.forEach((msg) => {
      it(`should pass clean message: "${msg}"`, () => {
        const result = scanner.scan(msg);
        expect(result.hasFlaggedContent).toBe(false);
        expect(result.contentSanitized).toBe(msg);
        expect(result.flaggedPatterns).toHaveLength(0);
      });
    });
  });

  describe('Raw vs sanitized content preservation', () => {
    it('should always preserve raw content exactly', () => {
      const message = 'Call me at 9876543210 urgently';
      const result = scanner.scan(message);
      expect(result.contentRaw).toBe(message);
      expect(result.contentSanitized).not.toBe(message);
    });
  });
});
