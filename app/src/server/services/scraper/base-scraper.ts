/**
 * Base Scraper Interface & Utilities
 * 
 * Common types and utilities for all platform scrapers.
 */

export interface ScrapedLead {
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  category?: string;
  businessType?: string;
  discoveredFrom: string;
  discoveredUrl: string;
  socialProfiles?: Record<string, string>;
  description?: string;
  rating?: number;
  reviewCount?: number;
}

export interface ScraperConfig {
  maxResults: number;
  minRelevance: number;
  requirePhone: boolean;
  location?: string;
  category?: string;
}

export interface ScraperResult {
  leads: ScrapedLead[];
  totalFound: number;
  withPhone: number;
  platform: string;
  errors: string[];
}

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected platform: string;
  
  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      maxResults: config.maxResults || 50,
      minRelevance: config.minRelevance || 0.5,
      requirePhone: config.requirePhone !== false,
      location: config.location,
      category: config.category,
    };
    this.platform = 'unknown';
  }
  
  abstract scrape(query: string): Promise<ScraperResult>;
  
  protected async fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            ...options?.headers,
          },
        });
        
        if (response.ok) return response;
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          await new Promise(r => setTimeout(r, 2000 * (i + 1)));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  protected extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return [...new Set(text.match(emailRegex) || [])];
  }
  
  protected extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    return [...new Set(text.match(urlRegex) || [])];
  }
  
  protected calculateRelevance(lead: ScrapedLead, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const nameLower = lead.name.toLowerCase();
    const descLower = (lead.description || '').toLowerCase();
    
    // Name relevance
    if (nameLower.includes(queryLower)) score += 0.4;
    else if (queryLower.split(' ').some(w => nameLower.includes(w))) score += 0.2;
    
    // Description relevance
    if (descLower.includes(queryLower)) score += 0.3;
    else if (queryLower.split(' ').some(w => descLower.includes(w))) score += 0.15;
    
    // Has phone number
    if (lead.phone) score += 0.2;
    
    // Has website
    if (lead.website) score += 0.05;
    
    // Has location
    if (lead.location) score += 0.05;
    
    return Math.min(score, 1);
  }
}
