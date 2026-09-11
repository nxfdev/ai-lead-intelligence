/**
 * Google Business Scraper
 * 
 * Scrapes Google Search and Google Maps for business leads.
 * Extracts business names, phone numbers, websites, and locations.
 */

import { BaseScraper, ScrapedLead, ScraperResult } from './base-scraper';
import { extractPhones, findBestPhone } from './phone-extractor';

export class GoogleScraper extends BaseScraper {
  protected platform = 'google';
  
  async scrape(query: string): Promise<ScraperResult> {
    const leads: ScrapedLead[] = [];
    const errors: string[] = [];
    
    try {
      // Search Google for businesses
      const searchQuery = this.buildSearchQuery(query);
      const results = await this.searchGoogle(searchQuery);
      
      for (const result of results) {
        try {
          const lead = await this.processResult(result);
          if (lead) {
            const relevance = this.calculateRelevance(lead, query);
            if (relevance >= this.config.minRelevance) {
              leads.push(lead);
            }
          }
        } catch (error) {
          errors.push(`Error processing result: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Google search error: ${error}`);
    }
    
    const withPhone = leads.filter(l => l.phone).length;
    
    return {
      leads: leads.slice(0, this.config.maxResults),
      totalFound: leads.length,
      withPhone,
      platform: this.platform,
      errors,
    };
  }
  
  private buildSearchQuery(query: string): string {
    const parts = [query];
    
    if (this.config.location) {
      parts.push(this.config.location);
    }
    
    if (this.config.category) {
      parts.push(this.config.category);
    }
    
    // Add phone-related terms to find numbers
    parts.push('phone number contact');
    
    return parts.join(' ');
  }
  
  private async searchGoogle(query: string): Promise<any[]> {
    const results: any[] = [];
    
    // Use Google Custom Search API (if available) or scrape results
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (apiKey && searchEngineId) {
      // Use official API
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
    
    // Parse search result blocks
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
  
  private async processResult(result: any): Promise<ScrapedLead | null> {
    const url = result.link || result.formattedUrl || '';
    const title = result.title || result.formattedTitle || '';
    const snippet = result.snippet || result.formattedSnippet || '';
    
    // Skip non-business results
    if (this.isNonBusinessResult(url, title)) {
      return null;
    }
    
    // Try to extract business info from the page
    let phone = this.extractPhoneFromSnippet(snippet);
    let website = url;
    let location = this.extractLocationFromSnippet(snippet);
    
    // If no phone found in snippet, try to fetch the page
    if (!phone && url.startsWith('http')) {
      try {
        const pageContent = await this.fetchPageContent(url);
        if (pageContent) {
          const phones = extractPhones(pageContent);
          const bestPhone = findBestPhone(phones);
          if (bestPhone) {
            phone = bestPhone.normalized;
          }
        }
      } catch (error) {
        // Ignore fetch errors
      }
    }
    
    if (this.config.requirePhone && !phone) {
      return null;
    }
    
    return {
      name: this.extractBusinessName(title),
      phone: phone || undefined,
      website: website || undefined,
      location: location || undefined,
      discoveredFrom: this.platform,
      discoveredUrl: url,
      description: snippet,
    };
  }
  
  private isNonBusinessResult(url: string, title: string): boolean {
    const nonBusinessDomains = [
      'wikipedia.org', 'youtube.com', 'facebook.com', 'twitter.com',
      'instagram.com', 'linkedin.com', 'reddit.com', 'quora.com',
    ];
    
    const nonBusinessKeywords = [
      'how to', 'what is', 'wiki', 'article', 'blog post',
      'news', 'review', 'comparison', 'vs',
    ];
    
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    
    if (nonBusinessDomains.some(d => urlLower.includes(d))) {
      return true;
    }
    
    if (nonBusinessKeywords.some(k => titleLower.includes(k))) {
      return true;
    }
    
    return false;
  }
  
  private extractPhoneFromSnippet(snippet: string): string | null {
    const phones = extractPhones(snippet);
    const bestPhone = findBestPhone(phones);
    return bestPhone?.normalized || null;
  }
  
  private extractLocationFromSnippet(snippet: string): string | null {
    // Look for location patterns
    const locationPatterns = [
      /(?:in|at|near|located in|based in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /([A-Z][a-z]+,\s*[A-Z]{2})/,
    ];
    
    for (const pattern of locationPatterns) {
      const match = snippet.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }
  
  private extractBusinessName(title: string): string {
    // Remove common suffixes
    const suffixes = [
      ' - Home', ' - Official Site', ' | Official Website',
      ' - Yelp', ' - Google Maps', ' - LinkedIn',
    ];
    
    let name = title;
    for (const suffix of suffixes) {
      if (name.includes(suffix)) {
        name = name.split(suffix)[0];
      }
    }
    
    return name.trim();
  }
  
  private async fetchPageContent(url: string): Promise<string | null> {
    try {
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      
      // Extract text content
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return text;
    } catch (error) {
      return null;
    }
  }
}
