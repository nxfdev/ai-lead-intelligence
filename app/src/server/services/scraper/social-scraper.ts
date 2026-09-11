/**
 * Social Media Scraper
 * 
 * Scrapes LinkedIn, Facebook, Instagram, and X for business leads.
 * Focuses on business pages and profiles with contact information.
 */

import { BaseScraper, ScrapedLead, ScraperResult } from './base-scraper';
import { extractPhones, findBestPhone } from './phone-extractor';

export class SocialMediaScraper extends BaseScraper {
  protected platform = 'social_media';
  private platforms: string[];
  
  constructor(config: Partial<ScraperConfig> = {}, platforms: string[] = ['linkedin', 'facebook', 'instagram', 'x']) {
    super(config);
    this.platforms = platforms;
  }
  
  async scrape(query: string): Promise<ScraperResult> {
    const allLeads: ScrapedLead[] = [];
    const errors: string[] = [];
    
    // Scrape each platform
    for (const platform of this.platforms) {
      try {
        const leads = await this.scrapePlatform(platform, query);
        allLeads.push(...leads);
      } catch (error) {
        errors.push(`Error scraping ${platform}: ${error}`);
      }
    }
    
    // Deduplicate by name and phone
    const uniqueLeads = this.deduplicateLeads(allLeads);
    
    // Filter by relevance
    const relevantLeads = uniqueLeads.filter(lead => {
      const relevance = this.calculateRelevance(lead, query);
      return relevance >= this.config.minRelevance;
    });
    
    const withPhone = relevantLeads.filter(l => l.phone).length;
    
    return {
      leads: relevantLeads.slice(0, this.config.maxResults),
      totalFound: relevantLeads.length,
      withPhone,
      platform: 'social_media',
      errors,
    };
  }
  
  private async scrapePlatform(platform: string, query: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    switch (platform) {
      case 'linkedin':
        leads.push(...await this.scrapeLinkedIn(query));
        break;
      case 'facebook':
        leads.push(...await this.scrapeFacebook(query));
        break;
      case 'instagram':
        leads.push(...await this.scrapeInstagram(query));
        break;
      case 'x':
        leads.push(...await this.scrapeX(query));
        break;
    }
    
    return leads;
  }
  
  private async scrapeLinkedIn(query: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    // Search for company pages on Google
    const searchQuery = `site:linkedin.com/company "${query}" phone contact`;
    
    try {
      const results = await this.searchGoogle(searchQuery);
      
      for (const result of results) {
        const lead = await this.processLinkedInResult(result);
        if (lead) {
          leads.push(lead);
        }
      }
    } catch (error) {
      console.error('LinkedIn scrape error:', error);
    }
    
    return leads;
  }
  
  private async processLinkedInResult(result: any): Promise<ScrapedLead | null> {
    const url = result.link || '';
    const title = result.title || '';
    const snippet = result.snippet || '';
    
    // Extract business info
    const name = this.extractLinkedInName(title);
    const phone = this.extractPhoneFromText(snippet);
    const website = this.extractWebsiteFromText(snippet);
    
    if (this.config.requirePhone && !phone) {
      return null;
    }
    
    return {
      name,
      phone,
      website,
      discoveredFrom: 'linkedin',
      discoveredUrl: url,
      socialProfiles: { linkedin: url },
      description: snippet,
    };
  }
  
  private async scrapeFacebook(query: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    // Search for business pages on Google
    const searchQuery = `site:facebook.com "${query}" phone contact`;
    
    try {
      const results = await this.searchGoogle(searchQuery);
      
      for (const result of results) {
        const lead = this.processFacebookResult(result);
        if (lead) {
          leads.push(lead);
        }
      }
    } catch (error) {
      console.error('Facebook scrape error:', error);
    }
    
    return leads;
  }
  
  private processFacebookResult(result: any): ScrapedLead | null {
    const url = result.link || '';
    const title = result.title || '';
    const snippet = result.snippet || '';
    
    // Extract business info
    const name = this.extractFacebookName(title);
    const phone = this.extractPhoneFromText(snippet);
    const website = this.extractWebsiteFromText(snippet);
    
    if (this.config.requirePhone && !phone) {
      return null;
    }
    
    return {
      name,
      phone,
      website,
      discoveredFrom: 'facebook',
      discoveredUrl: url,
      socialProfiles: { facebook: url },
      description: snippet,
    };
  }
  
  private async scrapeInstagram(query: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    // Search for business profiles on Google
    const searchQuery = `site:instagram.com "${query}" phone contact`;
    
    try {
      const results = await this.searchGoogle(searchQuery);
      
      for (const result of results) {
        const lead = this.processInstagramResult(result);
        if (lead) {
          leads.push(lead);
        }
      }
    } catch (error) {
      console.error('Instagram scrape error:', error);
    }
    
    return leads;
  }
  
  private processInstagramResult(result: any): ScrapedLead | null {
    const url = result.link || '';
    const title = result.title || '';
    const snippet = result.snippet || '';
    
    // Extract business info
    const name = this.extractInstagramName(title);
    const phone = this.extractPhoneFromText(snippet);
    const website = this.extractWebsiteFromText(snippet);
    
    if (this.config.requirePhone && !phone) {
      return null;
    }
    
    return {
      name,
      phone,
      website,
      discoveredFrom: 'instagram',
      discoveredUrl: url,
      socialProfiles: { instagram: url },
      description: snippet,
    };
  }
  
  private async scrapeX(query: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    // Search for business profiles on Google
    const searchQuery = `site:x.com OR site:twitter.com "${query}" phone contact`;
    
    try {
      const results = await this.searchGoogle(searchQuery);
      
      for (const result of results) {
        const lead = this.processXResult(result);
        if (lead) {
          leads.push(lead);
        }
      }
    } catch (error) {
      console.error('X scrape error:', error);
    }
    
    return leads;
  }
  
  private processXResult(result: any): ScrapedLead | null {
    const url = result.link || '';
    const title = result.title || '';
    const snippet = result.snippet || '';
    
    // Extract business info
    const name = this.extractXName(title);
    const phone = this.extractPhoneFromText(snippet);
    const website = this.extractWebsiteFromText(snippet);
    
    if (this.config.requirePhone && !phone) {
      return null;
    }
    
    return {
      name,
      phone,
      website,
      discoveredFrom: 'x',
      discoveredUrl: url,
      socialProfiles: { x: url },
      description: snippet,
    };
  }
  
  private async searchGoogle(query: string): Promise<any[]> {
    const results: any[] = [];
    
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (apiKey && searchEngineId) {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10`;
      
      try {
        const response = await this.fetchWithRetry(url);
        const data = await response.json();
        
        if (data.items) {
          results.push(...data.items);
        }
      } catch (error) {
        console.error('Google API error:', error);
      }
    } else {
      // Fallback: scrape Google search results
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;
      
      try {
        const response = await this.fetchWithRetry(url);
        const html = await response.text();
        results.push(...this.parseGoogleResults(html));
      } catch (error) {
        console.error('Google scrape error:', error);
      }
    }
    
    return results;
  }
  
  private parseGoogleResults(html: string): any[] {
    const results: any[] = [];
    
    const resultBlocks = html.split(/<div class="g">/);
    
    for (const block of resultBlocks.slice(1)) {
      const titleMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/);
      const linkMatch = block.match(/<a href="\/url\?q=([^&"]+)/);
      const snippetMatch = block.match(/<span[^>]*>(.*?)<\/span>/);
      
      if (titleMatch && linkMatch) {
        results.push({
          title: this.cleanHtml(titleMatch[1]),
          link: linkMatch[1],
          snippet: snippetMatch ? this.cleanHtml(snippetMatch[1]) : '',
        });
      }
    }
    
    return results;
  }
  
  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
  
  private extractLinkedInName(title: string): string {
    // Remove LinkedIn suffixes
    const cleaned = title
      .replace(/\s*\|?\s*LinkedIn/gi, '')
      .replace(/\s*-\s*LinkedIn/gi, '')
      .trim();
    
    return cleaned || 'Unknown Business';
  }
  
  private extractFacebookName(title: string): string {
    // Remove Facebook suffixes
    const cleaned = title
      .replace(/\s*\|?\s*Facebook/gi, '')
      .replace(/\s*-\s*Facebook/gi, '')
      .trim();
    
    return cleaned || 'Unknown Business';
  }
  
  private extractInstagramName(title: string): string {
    // Remove Instagram suffixes
    const cleaned = title
      .replace(/\s*\|?\s*Instagram/gi, '')
      .replace(/\s*-\s*Instagram/gi, '')
      .trim();
    
    return cleaned || 'Unknown Business';
  }
  
  private extractXName(title: string): string {
    // Remove X/Twitter suffixes
    const cleaned = title
      .replace(/\s*\|?\s*X/gi, '')
      .replace(/\s*\|?\s*Twitter/gi, '')
      .replace(/\s*-\s*X/gi, '')
      .replace(/\s*-\s*Twitter/gi, '')
      .trim();
    
    return cleaned || 'Unknown Business';
  }
  
  private extractPhoneFromText(text: string): string | null {
    const phones = extractPhones(text);
    const bestPhone = findBestPhone(phones);
    return bestPhone?.normalized || null;
  }
  
  private extractWebsiteFromText(text: string): string | null {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls = text.match(urlRegex) || [];
    
    // Find non-social media URLs
    const socialDomains = ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com'];
    const websiteUrl = urls.find(url => !socialDomains.some(d => url.includes(d)));
    
    return websiteUrl || null;
  }
  
  private deduplicateLeads(leads: ScrapedLead[]): ScrapedLead[] {
    const seen = new Set<string>();
    const unique: ScrapedLead[] = [];
    
    for (const lead of leads) {
      const key = `${lead.name.toLowerCase()}_${lead.phone || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(lead);
      }
    }
    
    return unique;
  }
}
