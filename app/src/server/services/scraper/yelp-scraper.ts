/**
 * Yelp Scraper
 * 
 * Scrapes Yelp for local business leads with phone numbers.
 * Focuses on businesses that match the target category.
 */

import { BaseScraper, ScrapedLead, ScraperResult } from './base-scraper';
import { extractPhones, findBestPhone } from './phone-extractor';

export class YelpScraper extends BaseScraper {
  protected platform = 'yelp';
  
  async scrape(query: string): Promise<ScraperResult> {
    const leads: ScrapedLead[] = [];
    const errors: string[] = [];
    
    try {
      // Search Yelp for businesses
      const searchQuery = this.buildSearchQuery(query);
      const results = await this.searchYelp(searchQuery);
      
      for (const result of results) {
        try {
          const lead = this.processYelpResult(result);
          if (lead) {
            const relevance = this.calculateRelevance(lead, query);
            if (relevance >= this.config.minRelevance) {
              leads.push(lead);
            }
          }
        } catch (error) {
          errors.push(`Error processing Yelp result: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Yelp search error: ${error}`);
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
    
    return parts.join(' ');
  }
  
  private async searchYelp(query: string): Promise<any[]> {
    const results: any[] = [];
    
    // Try Yelp Fusion API if available
    const apiKey = process.env.YELP_API_KEY;
    
    if (apiKey) {
      const location = this.config.location || 'New York';
      const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&limit=20`;
      
      try {
        const response = await this.fetchWithRetry(url, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        const data = await response.json();
        
        if (data.businesses) {
          results.push(...data.businesses);
        }
      } catch (error) {
        console.error('Yelp API error:', error);
      }
    } else {
      // Fallback: scrape Yelp search page
      const url = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(this.config.location || 'New York')}`;
      
      try {
        const response = await this.fetchWithRetry(url);
        const html = await response.text();
        results.push(...this.parseYelpResults(html));
      } catch (error) {
        console.error('Yelp scrape error:', error);
      }
    }
    
    return results;
  }
  
  private parseYelpResults(html: string): any[] {
    const results: any[] = [];
    
    // Parse business listing blocks
    const listingRegex = /<div[^>]*class="[^"]*businessName[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    
    while ((match = listingRegex.exec(html)) !== null) {
      const block = match[1];
      
      const nameMatch = block.match(/<a[^>]*>(.*?)<\/a>/);
      const phoneMatch = block.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
      const locationMatch = block.match(/<address[^>]*>([\s\S]*?)<\/address>/);
      
      if (nameMatch) {
        results.push({
          name: this.cleanHtml(nameMatch[1]),
          phone: phoneMatch ? phoneMatch[1] : undefined,
          location: locationMatch ? this.cleanHtml(locationMatch[1]) : undefined,
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
  
  private processYelpResult(result: any): ScrapedLead | null {
    const name = result.name || '';
    const phone = result.phone || result.display_phone || result.phone_number || '';
    const location = this.formatLocation(result.location || result.location_display_address);
    const website = result.url || '';
    const rating = result.rating || 0;
    const reviewCount = result.review_count || 0;
    
    // Normalize phone
    let normalizedPhone = null;
    if (phone) {
      const phones = extractPhones(phone);
      const bestPhone = findBestPhone(phones);
      normalizedPhone = bestPhone?.normalized || null;
    }
    
    if (this.config.requirePhone && !normalizedPhone) {
      return null;
    }
    
    return {
      name,
      phone: normalizedPhone || undefined,
      website,
      location,
      category: result.categories?.[0]?.title || undefined,
      businessType: result.categories?.[0]?.alias || undefined,
      discoveredFrom: this.platform,
      discoveredUrl: result.url || '',
      description: result.snippet || '',
      rating,
      reviewCount,
    };
  }
  
  private formatLocation(location: any): string {
    if (typeof location === 'string') {
      return location;
    }
    
    if (Array.isArray(location)) {
      return location.join(', ');
    }
    
    if (location?.display_address) {
      return location.display_address.join(', ');
    }
    
    if (location?.address1) {
      const parts = [location.address1];
      if (location.city) parts.push(location.city);
      if (location.state) parts.push(location.state);
      if (location.zip_code) parts.push(location.zip_code);
      return parts.join(', ');
    }
    
    return '';
  }
}
