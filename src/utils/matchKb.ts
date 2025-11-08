interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  tags: string[];
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);

  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - distance / maxLen;
}

function tokenize(text: string): string[] {
  return normalizeText(text).split(/\s+/).filter(word => word.length > 2);
}

function calculateKeywordScore(query: string, faq: FAQ): number {
  const queryTokens = tokenize(query);
  const faqTokens = tokenize(faq.question);
  const keywords = faq.keywords.map(k => normalizeText(k));

  let sumScores = 0;
  let matchedTokenCount = 0;

  for (const queryToken of queryTokens) {
    let tokenBest = 0;
    let tokenMatched = false;

    // Match against explicit keywords (preferred)
    for (const keyword of keywords) {
      const similarity = calculateSimilarity(queryToken, keyword);
      if (similarity >= 0.7) {
        tokenBest = Math.max(tokenBest, similarity);
        tokenMatched = true;
      }
    }

    // Also consider words from the FAQ question text (lower weight)
    for (const faqToken of faqTokens) {
      const similarity = calculateSimilarity(queryToken, faqToken);
      if (similarity >= 0.8) {
        tokenBest = Math.max(tokenBest, similarity * 0.8);
        tokenMatched = true;
      }
    }

    if (tokenMatched) {
      sumScores += tokenBest;
      matchedTokenCount++;
    }
  }

  return matchedTokenCount > 0 ? sumScores / matchedTokenCount : 0;
}

export function findBestMatch(
  query: string,
  faqs: FAQ[],
  threshold: number = 0.6
): FAQ | null {
  if (!query || faqs.length === 0) return null;

  let bestMatch: { faq: FAQ; score: number } | null = null;

  for (const faq of faqs) {
    const questionSimilarity = calculateSimilarity(query, faq.question);
    const keywordScore = calculateKeywordScore(query, faq);

    // Favor keyword/token matches over whole-question similarity for robustness
    const finalScore = questionSimilarity * 0.4 + keywordScore * 0.6;

    if (finalScore >= threshold) {
      if (!bestMatch || finalScore > bestMatch.score) {
        bestMatch = { faq, score: finalScore };
      }
    }
  }

  return bestMatch ? bestMatch.faq : null;
}

export function truncateAnswer(answer: string, maxLength: number = 500): string {
  if (answer.length <= maxLength) return answer;

  const truncated = answer.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}
