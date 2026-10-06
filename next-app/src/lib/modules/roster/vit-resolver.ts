// VBridgeConnect — VIT Name-to-Email Resolver
// Converts student & faculty names from official allocation documents to institutional emails.
// Format: firstname.lastname@vit.edu.in

export interface ResolvedMember {
  rawName: string;
  normalizedName: string;
  email: string | null;
  firstName: string;
  lastName: string;
}

/**
 * Parses names from university spreadsheets/PDFs into official institutional emails.
 * Handles:
 * - 3-word names with father's name (e.g. "Harshad Prakash Panchal" -> "harshad.panchal@vit.edu.in")
 * - 2-word names (e.g. "Arya Suryavanshi" -> "arya.suryavanshi@vit.edu.in")
 * - ALL CAPS entries (e.g. "ANJALI HEMANT SHEWALE" -> "anjali.shewale@vit.edu.in")
 * - Honorary prefixes ("Dr. Sheetal Patil" -> "sheetal.patil@vit.edu.in")
 * - "NA" / "N/A" / empty strings -> null email
 */
export function nameToVitEmail(
  rawName: string,
  domain: string = 'vit.edu.in'
): ResolvedMember {
  if (!rawName || typeof rawName !== 'string') {
    return { rawName: '', normalizedName: '', email: null, firstName: '', lastName: '' };
  }

  const trimmed = rawName.trim();
  if (/^(na|n\/a|nil|-)$/i.test(trimmed) || trimmed === '') {
    return { rawName, normalizedName: '', email: null, firstName: '', lastName: '' };
  }

  // Strip academic & honorary prefixes
  const clean = trimmed.replace(/^(dr\.|prof\.|dr|prof|shri|ms\.|mr\.)\s+/i, '').trim();

  // Split into tokens by whitespace
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { rawName, normalizedName: '', email: null, firstName: '', lastName: '' };
  }

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  if (tokens.length === 1) {
    const single = tokens[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      rawName,
      normalizedName: capitalize(tokens[0]),
      email: `${single}@${domain}`,
      firstName: capitalize(tokens[0]),
      lastName: '',
    };
  }

  // In Indian university records: Token 0 = First Name, Last Token = Surname/Last Name.
  // Middle tokens (father's name / middle name) are omitted in the email format firstname.lastname.
  const rawFirst = tokens[0];
  const rawLast = tokens[tokens.length - 1];

  const firstSlug = rawFirst.toLowerCase().replace(/[^a-z0-9]/g, '');
  const lastSlug = rawLast.toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizedName = tokens.map(capitalize).join(' ');

  return {
    rawName,
    normalizedName,
    email: `${firstSlug}.${lastSlug}@${domain}`,
    firstName: capitalize(rawFirst),
    lastName: capitalize(rawLast),
  };
}
