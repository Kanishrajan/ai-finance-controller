// Rapid String Similarity & Token Matching Algorithm (RapidFuzz equivalent in JS)

export function levenshteinDistance(a = '', b = '') {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const matrix = [];
  for (let i = 0; i <= n; i++) matrix[i] = [i];
  for (let j = 0; j <= m; j++) matrix[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[n][m];
}

export function stringRatio(a = '', b = '') {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1.0;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, Number((1 - dist / maxLen).toFixed(3)));
}

export function tokenSortRatio(a = '', b = '') {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;

  const tokensA = a.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).sort().join(' ');
  const tokensB = b.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).sort().join(' ');

  if (tokensA === tokensB) return 1.0;
  return stringRatio(tokensA, tokensB);
}

export function jaccardTokenOverlap(a = '', b = '') {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return Number((intersection / union).toFixed(3));
}

export function calculateMerchantSimilarity(merchantA = '', merchantB = '') {
  if (!merchantA || !merchantB) return 0.0;
  if (merchantA === merchantB) return 1.0;

  const tokenScore = tokenSortRatio(merchantA, merchantB);
  const jaccardScore = jaccardTokenOverlap(merchantA, merchantB);
  const directScore = stringRatio(merchantA, merchantB);

  // Take the highest signal of similarity
  return Math.max(tokenScore, jaccardScore, directScore);
}
