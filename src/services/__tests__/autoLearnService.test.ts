/**
 * Tests for Auto-Learn Service
 */

import { getKBStatistics, needsAutoLearning } from '../autoLearnService';
import { getSmartKBCompat } from '../localKbService';

describe('Auto-Learn Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getKBStatistics', () => {
    it('should return valid statistics', () => {
      const stats = getKBStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.manualEntries).toBeGreaterThan(0);
      expect(stats.totalEntries).toBeGreaterThanOrEqual(stats.manualEntries);
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.averageTokensPerPage).toBeGreaterThan(0);
    });

    it('should show manual entries even without auto-learned content', () => {
      const stats = getKBStatistics();
      
      expect(stats.manualEntries).toBeGreaterThan(0);
      expect(stats.autoLearnedEntries).toBe(0); // No scraped data yet
    });
  });

  describe('needsAutoLearning', () => {
    it('should return true when no scraped data exists', () => {
      expect(needsAutoLearning()).toBe(true);
    });

    it('should return false when recent scraped data exists', () => {
      // Simulate recent scraped data
      const mockData = {
        pages: [{ id: 'test', url: '/', title: 'Test' }],
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem('wasilah_scraped_kb', JSON.stringify(mockData));
      
      expect(needsAutoLearning()).toBe(false);
    });

    it('should return true when scraped data is old', () => {
      // Simulate old scraped data (8 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      
      const mockData = {
        pages: [{ id: 'test', url: '/', title: 'Test' }],
        lastUpdated: oldDate.toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem('wasilah_scraped_kb', JSON.stringify(mockData));
      
      expect(needsAutoLearning()).toBe(true);
    });
  });

  describe('Smart KB Integration', () => {
    it('should load manual KB entries', () => {
      const kb = getSmartKBCompat();
      
      expect(kb).toBeDefined();
      expect(Array.isArray(kb)).toBe(true);
      expect(kb.length).toBeGreaterThan(0);
    });

    it('should have required KB fields', () => {
      const kb = getSmartKBCompat();
      const firstEntry = kb[0];
      
      expect(firstEntry).toHaveProperty('id');
      expect(firstEntry).toHaveProperty('url');
      expect(firstEntry).toHaveProperty('title');
      expect(firstEntry).toHaveProperty('content');
      expect(firstEntry).toHaveProperty('tokens');
    });

    it('should combine manual and auto-learned entries', () => {
      // Add mock scraped data
      const mockScraped = {
        pages: [
          {
            id: 'scraped-page',
            url: '/scraped',
            title: 'Scraped Page',
            content: 'This is auto-learned content',
            tokens: ['scraped', 'content'],
            keywords: ['test'],
            headings: ['Test'],
            lastUpdated: new Date().toISOString(),
            source: 'auto-learned'
          }
        ],
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem('wasilah_scraped_kb', JSON.stringify(mockScraped));
      
      const kb = getSmartKBCompat();
      
      // Should include both manual and scraped
      const hasManual = kb.some(entry => entry.id === 'faq-0');
      const hasScraped = kb.some(entry => entry.id === 'scraped-page');
      
      expect(hasManual).toBe(true);
      expect(hasScraped).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('wasilah_scraped_kb', 'invalid json');
      
      // Should not throw
      expect(() => getKBStatistics()).not.toThrow();
      expect(() => needsAutoLearning()).not.toThrow();
    });

    it('should fallback to manual KB if auto-learning fails', () => {
      localStorage.setItem('wasilah_scraped_kb', 'invalid json');
      
      const kb = getSmartKBCompat();
      
      // Should still return manual KB
      expect(kb).toBeDefined();
      expect(kb.length).toBeGreaterThan(0);
    });
  });
});
