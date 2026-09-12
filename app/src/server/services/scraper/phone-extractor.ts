/**
 * Phone Number Extractor & Validator
 * 
 * Extracts phone numbers from text and validates them.
 * Supports US numbers and international formats.
 */

// Common US phone number patterns
const PHONE_PATTERNS = [
  // Standard US formats
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
  // With extensions
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}(?:\s*(?:ext|x|extension)\s*\d{1,6})?/gi,
  // International format
  /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
];

// Known invalid/test numbers to filter out
const INVALID_NUMBERS = new Set([
  '555-0100', '555-0101', '555-0102', '555-0103', '555-0104',
  '555-0105', '555-0106', '555-0107', '555-0108', '555-0109',
  '555-1234', '555-5555', '000-0000', '111-1111', '222-2222',
  '333-3333', '444-4444', '555-5555', '666-6666', '777-7777',
  '888-8888', '999-9999',
]);

export interface ExtractedPhone {
  raw: string;
  normalized: string;
  country: string;
  isValid: boolean;
  type: 'landline' | 'mobile' | 'toll_free' | 'unknown';
}

/**
 * Normalize a phone number to E.164 format
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Already has country code
  if (digits.length > 10 && digits.startsWith('+')) {
    return `+${digits.replace(/^\+/, '')}`;
  }
  
  // Add + prefix if missing
  if (!phone.startsWith('+')) {
    return `+${digits}`;
  }
  
  return phone;
}

/**
 * Validate if a phone number is usable for calling
 */
export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, '');
  
  // Check if it's a known invalid number
  const rawDigits = phone.replace(/\D/g, '');
  if (INVALID_NUMBERS.has(rawDigits) || INVALID_NUMBERS.has(phone)) {
    return false;
  }
  
  // US numbers must be 11 digits (1 + 10)
  if (digits.startsWith('1') && digits.length === 11) {
    return true;
  }
  
  // International numbers (6-15 digits total)
  if (digits.length >= 6 && digits.length <= 15) {
    return true;
  }
  
  return false;
}

/**
 * Extract phone numbers from text
 */
export function extractPhones(text: string): ExtractedPhone[] {
  const phones: ExtractedPhone[] = [];
  const seen = new Set<string>();
  
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern) || [];
    
    for (const match of matches) {
      const normalized = normalizePhone(match);
      
      // Skip duplicates
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      
      // Determine phone type
      let type: ExtractedPhone['type'] = 'unknown';
      const digits = normalized.replace(/\D/g, '');
      
      if (digits.startsWith('1800') || digits.startsWith('1888') || 
          digits.startsWith('1877') || digits.startsWith('1866') ||
          digits.startsWith('1855') || digits.startsWith('1844')) {
        type = 'toll_free';
      } else if (digits.length === 11 && digits.startsWith('1')) {
        type = 'landline'; // Default for US
      }
      
      phones.push({
        raw: match,
        normalized,
        country: digits.startsWith('1') ? 'US' : 'International',
        isValid: validatePhone(match),
        type,
      });
    }
  }
  
  return phones.filter(p => p.isValid);
}

/**
 * Find the best phone number from a list (prioritize mobile > landline > toll_free)
 */
export function findBestPhone(phones: ExtractedPhone[]): ExtractedPhone | null {
  const validPhones = phones.filter(p => p.isValid);
  
  if (validPhones.length === 0) return null;
  
  // Priority: mobile > landline > toll_free > unknown
  const priority: ExtractedPhone['type'][] = ['mobile', 'landline', 'unknown', 'toll_free'];
  
  for (const type of priority) {
    const found = validPhones.find(p => p.type === type);
    if (found) return found;
  }
  
  return validPhones[0];
}
