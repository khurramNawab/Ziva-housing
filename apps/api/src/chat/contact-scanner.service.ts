import { Injectable, Logger } from '@nestjs/common';

/**
 * ContactScannerService
 * ─────────────────────────────────────────────────────────────────────────────
 * Core lead-protection mechanism. Scans chat messages for contact information
 * (phone numbers, emails, WhatsApp links, social handles, external URLs) and:
 *   1. Returns the original content (stored as contentRaw — admin only)
 *   2. Returns a sanitized version with contact info masked (shown to users)
 *   3. Returns flagged patterns metadata (for admin review + UI warnings)
 */
@Injectable()
export class ContactScannerService {
  private readonly logger = new Logger(ContactScannerService.name);

  // ─── Regex Patterns ───────────────────────────────────────────────────────
  // Order matters: more specific first (WhatsApp before plain URL)
  private readonly patterns: Array<{
    type: FlaggedContentType;
    regex: RegExp;
    maskWith: (match: string) => string;
  }> = [
      // WhatsApp links
      {
        type: FlaggedContentType.WHATSAPP_LINK,
        regex: /(?:wa\.me|api\.whatsapp\.com|whatsapp\.com\/send)[^\s]*/gi,
        maskWith: () => '[WhatsApp Link Blocked]',
      },
      // Indian phone numbers (multiple formats)
      {
        type: FlaggedContentType.INDIAN_PHONE,
        regex:
          /(?:(?:\+?91|0)[\s\-.]?)?(?:[6-9]\d{2}[\s\-.]?\d{3}[\s\-.]?\d{4})/g,
        maskWith: (m) => {
          const digits = m.replace(/\D/g, '');
          const last4 = digits.slice(-4);
          return `${digits.slice(0, digits.length - 8)}XXXX${last4.slice(0, 2)}XX`;
        },
      },
      // International phone numbers
      {
        type: FlaggedContentType.ALTERNATE_PHONE,
        regex: /\+(?:[0-9]{1,3})[\s\-.]?\(?[0-9]{2,3}\)?[\s\-.]?[0-9]{3}[\s\-.]?[0-9]{4}/g,
        maskWith: () => '[Phone Number Blocked]',
      },
      // Email addresses
      {
        type: FlaggedContentType.EMAIL_ADDRESS,
        regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
        maskWith: (m) => {
          const [local, domain] = m.split('@');
          return `${local.slice(0, 2)}****@${domain}`;
        },
      },
      // Instagram handles/links
      {
        type: FlaggedContentType.SOCIAL_HANDLE,
        regex:
          /(?:instagram\.com\/|@)[a-zA-Z0-9_.]{1,30}(?:\b|$)/gi,
        maskWith: () => '[Social Handle Blocked]',
      },
      // Facebook links
      {
        type: FlaggedContentType.SOCIAL_HANDLE,
        regex: /(?:facebook\.com|fb\.me|fb\.com)\/[^\s]*/gi,
        maskWith: () => '[Social Profile Blocked]',
      },
      // External URLs (not Zivahousing.com)
      {
        type: FlaggedContentType.EXTERNAL_URL,
        regex:
          /https?:\/\/(?!(?:www\.)?Zivahousing\.com)[^\s<>"{}|\\^`[\]]+/gi,
        maskWith: (m) => `[External Link Blocked: ${new URL(m).hostname}]`,
      },
      // Encoded/word-form numbers (common evasion: "nine eight seven six ...")
      {
        type: FlaggedContentType.PHONE_NUMBER,
        regex:
          /\b(?:zero|one|two|three|four|five|six|seven|eight|nine)(?:\s+(?:zero|one|two|three|four|five|six|seven|eight|nine)){8,}\b/gi,
        maskWith: () => '[Encoded Number Blocked]',
      },
      // Number evasion with symbols: 98765-43210 or 98765.43210
      {
        type: FlaggedContentType.PHONE_NUMBER,
        regex: /\b\d{4,5}[\s\-_.]\d{4,5}\b/g,
        maskWith: () => '[Number Blocked]',
      },
    ];

  /**
   * Scan a message and return sanitized version + flagged patterns
   */
  scan(content: string): {
    contentRaw: string;
    contentSanitized: string;
    hasFlaggedContent: boolean;
    flaggedPatterns: FlaggedPattern[];
  } {
    const flaggedPatterns: FlaggedPattern[] = [];
    let sanitized = content;
    let offset = 0; // Track index offset as we replace strings

    // Process each pattern
    for (const { type, regex, maskWith } of this.patterns) {
      regex.lastIndex = 0; // Reset global regex
      let match: RegExpExecArray | null;

      const tempSanitized = sanitized;
      const newSanitized = sanitized.replace(regex, (m, ...args) => {
        const masked = this.safeMask(m, maskWith);
        flaggedPatterns.push({
          type,
          original: m,
          masked,
          startIndex: args[args.length - 2] + offset,
          endIndex: args[args.length - 2] + offset + m.length,
        });
        offset += masked.length - m.length;
        return masked;
      });

      sanitized = newSanitized;
      offset = 0; // Reset for next pattern (we work on progressively sanitized string)
    }

    return {
      contentRaw: content,
      contentSanitized: sanitized,
      hasFlaggedContent: flaggedPatterns.length > 0,
      flaggedPatterns,
    };
  }

  private safeMask(match: string, maskFn: (m: string) => string): string {
    try {
      return maskFn(match);
    } catch {
      return '[Content Blocked]';
    }
  }
}

// Expose enum locally since shared package may not be installed yet
export enum FlaggedContentType {
  PHONE_NUMBER = 'PHONE_NUMBER',
  INDIAN_PHONE = 'INDIAN_PHONE',
  EMAIL_ADDRESS = 'EMAIL_ADDRESS',
  WHATSAPP_LINK = 'WHATSAPP_LINK',
  SOCIAL_HANDLE = 'SOCIAL_HANDLE',
  EXTERNAL_URL = 'EXTERNAL_URL',
  ALTERNATE_PHONE = 'ALTERNATE_PHONE',
}

export interface FlaggedPattern {
  type: FlaggedContentType;
  original: string;
  masked: string;
  startIndex: number;
  endIndex: number;
}
