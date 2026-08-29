// Normalization Service for Merchant and Description text

const KNOWN_MERCHANT_ALIASES = {
  'amzn': 'amazon',
  'amazon.in': 'amazon',
  'amzn mktp': 'amazon marketplace',
  'amzn mktp in': 'amazon marketplace',
  'amazon marketplace india': 'amazon marketplace',
  'amazon india seller services': 'amazon marketplace',
  'swiggy bundl tech': 'swiggy',
  'swiggy india': 'swiggy',
  'bundl technologies': 'swiggy',
  'uber india': 'uber',
  'uber b.v.': 'uber',
  'uber rides': 'uber',
  'uber technology': 'uber',
  'msft': 'microsoft',
  'msft cloud': 'microsoft azure',
  'microsoft corporation': 'microsoft',
  'google cloud': 'google',
  'google asia pacific': 'google',
  'google workspace': 'google',
  'gsuite': 'google',
  'flipkart internet': 'flipkart',
  'flipkart payments': 'flipkart',
  'zomato restaurants': 'zomato',
  'zomato limited': 'zomato',
  'slack tech': 'slack',
  'salesforce slack': 'slack',
  'bharti airtel': 'airtel',
  'airtel direct': 'airtel',
  'mmt travel': 'makemytrip',
  'makemytrip india': 'makemytrip',
  'atlassian pty': 'atlassian',
  'atlassian cloud': 'atlassian',
  'reliance jio': 'jio',
  'tata power': 'tata power',
  'freshworks inc': 'freshworks',
  'apollo pharm': 'apollo pharmacy',
  'apollo healthcare': 'apollo pharmacy'
};

const CORPORATE_SUFFIXES = [
  /\b(pvt|pvt\.|private)\s+(ltd|ltd\.|limited)\b/gi,
  /\b(ltd|ltd\.|limited)\b/gi,
  /\b(inc|inc\.|incorporated)\b/gi,
  /\b(corp|corp\.|corporation)\b/gi,
  /\b(co|co\.|company)\b/gi,
  /\b(llc|llp|gmbh|pty|b\.v\.|bv)\b/gi,
  /\b(services|technologies|systems|enterprises|solutions|online|payments|india|retail)\b/gi,
  /\b(mumbai|bangalore|delhi|gurgaon|amsterdam|redmond|hq|branch|br)\b/gi
];

export function normalizeMerchant(rawMerchant = '') {
  if (!rawMerchant || typeof rawMerchant !== 'string') return '';

  let str = rawMerchant.toLowerCase().trim();

  // Remove common punctuation and special symbols
  str = str.replace(/[^\w\s.]/g, ' ');

  // Remove known corporate suffixes
  for (const regex of CORPORATE_SUFFIXES) {
    str = str.replace(regex, ' ');
  }

  // Collapse multiple spaces
  str = str.replace(/\s+/g, ' ').trim();

  // Check alias lookup table
  for (const [alias, canonical] of Object.entries(KNOWN_MERCHANT_ALIASES)) {
    if (str.includes(alias)) {
      return canonical;
    }
  }

  return str;
}

export function normalizeDescription(rawDescription = '') {
  if (!rawDescription || typeof rawDescription !== 'string') return '';
  return rawDescription
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
