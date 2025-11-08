import { findBestMatch, truncateAnswer } from '../matchKb';

describe('matchKb', () => {
  const mockFAQs = [
    {
      id: '1',
      question: 'What is Wasilah?',
      answer: 'Wasilah is a community service organization dedicated to creating positive change.',
      keywords: ['wasilah', 'organization', 'about', 'who', 'what'],
      tags: ['general', 'about'],
    },
    {
      id: '2',
      question: 'How can I volunteer?',
      answer: 'You can volunteer by visiting our Join Us page and filling out the form.',
      keywords: ['volunteer', 'join', 'help', 'participate'],
      tags: ['volunteer'],
    },
    {
      id: '3',
      question: 'Where are you located?',
      answer: 'We have offices in Karachi, Lahore, and Islamabad.',
      keywords: ['location', 'office', 'address', 'where'],
      tags: ['contact'],
    },
  ];

  describe('findBestMatch', () => {
    test('should find exact keyword match', () => {
      const result = findBestMatch('how to volunteer', mockFAQs);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('2');
    });

    test('should find close match using fuzzy matching', () => {
      const result = findBestMatch('volunter opportunities', mockFAQs); // typo in "volunteer"
      expect(result).toBeTruthy();
      expect(result?.id).toBe('2');
    });

    test('should match on question similarity', () => {
      const result = findBestMatch('tell me about wasilah', mockFAQs);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('1');
    });

    test('should match on multiple keywords', () => {
      const result = findBestMatch('where is your office located', mockFAQs);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('3');
    });

    test('should return null when no match found', () => {
      const result = findBestMatch('random unrelated query xyz123', mockFAQs);
      expect(result).toBeNull();
    });

    test('should return null for empty query', () => {
      const result = findBestMatch('', mockFAQs);
      expect(result).toBeNull();
    });

    test('should return null for empty FAQ list', () => {
      const result = findBestMatch('some query', []);
      expect(result).toBeNull();
    });

    test('should handle case insensitivity', () => {
      const result = findBestMatch('HOW CAN I VOLUNTEER', mockFAQs);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('2');
    });

    test('should use custom threshold', () => {
      const result = findBestMatch('somewhat related', mockFAQs, 0.9);
      expect(result).toBeNull(); // high threshold should prevent match
    });

    test('should prefer better matches', () => {
      const result = findBestMatch('volunteer join help participate', mockFAQs);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('2'); // should match volunteer FAQ
    });

    test('should handle special characters in query', () => {
      const result = findBestMatch('where @#$ location???', mockFAQs);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('3');
    });

    test('should handle context from multiple messages', () => {
      const context = 'I want to help. I have some free time. How do I volunteer?';
      const result = findBestMatch(context, mockFAQs);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('2');
    });
  });

  describe('truncateAnswer', () => {
    test('should not truncate short answers', () => {
      const answer = 'Short answer.';
      const result = truncateAnswer(answer, 500);
      expect(result).toBe(answer);
    });

    test('should truncate long answers at word boundary', () => {
      const answer = 'This is a very long answer that needs to be truncated because it exceeds the maximum length limit that we have set for display purposes.';
      const result = truncateAnswer(answer, 50);
      expect(result.length).toBeLessThan(answer.length);
      expect(result.endsWith('...')).toBe(true);
      expect(result).not.toContain('display...');
    });

    test('should truncate at last space before limit', () => {
      const answer = 'Word1 Word2 Word3 Word4 Word5 Word6';
      const result = truncateAnswer(answer, 20);
      expect(result).toBe('Word1 Word2 Word3...');
    });

    test('should handle answer with no spaces', () => {
      const answer = 'VeryLongWordWithoutAnySpacesAtAll';
      const result = truncateAnswer(answer, 20);
      expect(result).toBe('VeryLongWordWithoutA...');
    });

    test('should use default max length of 500', () => {
      const answer = 'A'.repeat(600);
      const result = truncateAnswer(answer);
      expect(result.length).toBeLessThanOrEqual(503); // 500 + '...'
    });

    test('should handle exact length match', () => {
      const answer = 'A'.repeat(500);
      const result = truncateAnswer(answer, 500);
      expect(result).toBe(answer);
    });

    test('should preserve sentence structure when possible', () => {
      const answer = 'First sentence here. Second sentence here. Third sentence that goes on and on.';
      const result = truncateAnswer(answer, 40);
      expect(result.endsWith('...')).toBe(true);
    });
  });
});
