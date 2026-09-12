/**
 * Lead Generation Orchestrator
 * 
 * Coordinates scraping from multiple platforms and stores leads in database.
 * Ensures all leads have valid phone numbers for CALL-E.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { GoogleScraper } from './google-scraper';
import { YelpScraper } from './yelp-scraper';
import { SocialMediaScraper } from './social-scraper';
import { ScrapedLead, ScraperResult } from './base-scraper';
import { normalizePhone, validatePhone } from './phone-extractor';

const prisma = new PrismaClient();
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export interface LeadGenerationConfig {
  query: string;
  location?: string;
  category?: string;
  platforms: string[];
  maxResults: number;
  requirePhone: boolean;
}

export interface LeadGenerationResult {
  jobId: string;
  totalFound: number;
  leadsWithPhone: number;
  leadsStored: number;
  leads: ScrapedLead[];
  errors: string[];
}

export class LeadGenerationOrchestrator {
  private scrapers: Map<string, any> = new Map();
  
  constructor() {
    // Initialize scrapers
    this.scrapers.set('google', new GoogleScraper());
    this.scrapers.set('yelp', new YelpScraper());
    this.scrapers.set('social', new SocialMediaScraper());
  }
  
  async generateLeads(config: LeadGenerationConfig): Promise<LeadGenerationResult> {
    console.log('🚀 Starting lead generation...');
    console.log(`   Query: ${config.query}`);
    console.log(`   Location: ${config.location || 'Global'}`);
    console.log(`   Platforms: ${config.platforms.join(', ')}`);
    console.log(`   Require Phone: ${config.requirePhone}`);
    
    // Create scraping job (tracked in-memory; jobId returned to caller)
    const jobId = crypto.randomUUID();
    
    console.log(`   Job ID: ${jobId}`);
    
    const allLeads: ScrapedLead[] = [];
    const errors: string[] = [];
    
    // Run scrapers in parallel
    const scraperPromises = config.platforms.map(platform => 
      this.runScraper(platform, config)
    );
    
    const results = await Promise.allSettled(scraperPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allLeads.push(...result.value.leads);
        errors.push(...result.value.errors);
      } else {
        errors.push(`Scraper failed: ${result.reason}`);
      }
    }
    
    console.log(`\n📊 Scraping Results:`);
    console.log(`   Total Found: ${allLeads.length}`);
    
    // Filter leads with phone numbers
    const leadsWithPhone = allLeads.filter(lead => lead.phone && validatePhone(lead.phone));
    console.log(`   With Valid Phone: ${leadsWithPhone.length}`);
    
    // Deduplicate leads
    const uniqueLeads = this.deduplicateLeads(leadsWithPhone);
    console.log(`   After Deduplication: ${uniqueLeads.length}`);
    
    // Store leads in database
    let storedCount = 0;
    for (const lead of uniqueLeads) {
      try {
        await this.storeLead(lead, config);
        storedCount++;
      } catch (error) {
        errors.push(`Error storing lead ${lead.name}: ${error}`);
      }
    }
    
    console.log(`   Stored in Database: ${storedCount}`);
    console.log(`\n✅ Lead generation complete (job ${jobId})!`);
    
    return {
      jobId,
      totalFound: allLeads.length,
      leadsWithPhone: leadsWithPhone.length,
      leadsStored: storedCount,
      leads: uniqueLeads,
      errors,
    };
  }
  
  private async runScraper(platform: string, config: LeadGenerationConfig): Promise<ScraperResult> {
    const scraper = this.scrapers.get(platform);
    
    if (!scraper) {
      throw new Error(`Unknown platform: ${platform}`);
    }
    
    // Configure scraper
    scraper.config.location = config.location;
    scraper.config.category = config.category;
    scraper.config.maxResults = config.maxResults;
    scraper.config.requirePhone = config.requirePhone;
    
    console.log(`\n🔍 Scraping ${platform}...`);
    
    const result = await scraper.scrape(config.query);
    
    console.log(`   ${platform}: Found ${result.totalFound} leads, ${result.withPhone} with phone`);
    
    return result;
  }
  
  private deduplicateLeads(leads: ScrapedLead[]): ScrapedLead[] {
    const seen = new Map<string, ScrapedLead>();
    
    for (const lead of leads) {
      // Create unique key based on normalized name and phone
      const nameKey = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const phoneKey = lead.phone?.replace(/\D/g, '') || '';
      const key = `${nameKey}_${phoneKey}`;
      
      if (!seen.has(key)) {
        seen.set(key, lead);
      } else {
        // Merge data if we have more information
        const existing = seen.get(key)!;
        if (!existing.phone && lead.phone) existing.phone = lead.phone;
        if (!existing.email && lead.email) existing.email = lead.email;
        if (!existing.website && lead.website) existing.website = lead.website;
        if (!existing.location && lead.location) existing.location = lead.location;
      }
    }
    
    return Array.from(seen.values());
  }
  
  private buildProfileJson(lead: ScrapedLead, existing?: { profileJson?: Prisma.JsonValue } | null): Prisma.InputJsonValue {
    const raw =
      existing?.profileJson && typeof existing.profileJson === 'object' && !Array.isArray(existing.profileJson)
        ? (existing.profileJson as Record<string, unknown>)
        : {};
    return {
      ...raw,
      email: lead.email ?? raw.email,
      businessType: lead.businessType ?? raw.businessType,
      discoveredFrom: lead.discoveredFrom ?? raw.discoveredFrom,
      discoveredUrl: lead.discoveredUrl ?? raw.discoveredUrl,
      socialProfiles: lead.socialProfiles ?? raw.socialProfiles,
    } as unknown as Prisma.InputJsonValue;
  }

  private async storeLead(lead: ScrapedLead, config: LeadGenerationConfig): Promise<void> {
    // Normalize phone
    let normalizedPhone = lead.phone;
    if (normalizedPhone) {
      normalizedPhone = normalizePhone(normalizedPhone);
    }
    
    // Check if lead already exists
    const existingLead = await prisma.lead.findFirst({
      where: {
        organizationId: DEFAULT_ORG_ID,
        name: lead.name,
        phone: normalizedPhone,
      },
    });
    
    if (existingLead) {
      // Update existing lead with new information
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          website: lead.website || existingLead.website,
          location: lead.location || existingLead.location,
          category: lead.category || existingLead.category,
          profileJson: this.buildProfileJson(lead, existingLead),
        },
      });
      return;
    }
    
    // Create new lead
    await prisma.lead.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        name: lead.name,
        phone: normalizedPhone,
        website: lead.website,
        location: lead.location,
        category: lead.category,
        profileJson: this.buildProfileJson(lead),
        status: 'DISCOVERED',
        qualification: 'PENDING',
      },
    });
  }
  
  async getLeadsWithPhone(limit = 50): Promise<any[]> {
    return prisma.lead.findMany({
      where: {
        organizationId: DEFAULT_ORG_ID,
        phone: { not: null },
        status: { in: ['DISCOVERED', 'READY_FOR_REVIEW'] },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
  
  async getLeadStats(): Promise<any> {
    const total = await prisma.lead.count({
      where: { organizationId: DEFAULT_ORG_ID },
    });
    
    const withPhone = await prisma.lead.count({
      where: {
        organizationId: DEFAULT_ORG_ID,
        phone: { not: null },
      },
    });
    
    const byCategory = await prisma.lead.groupBy({
      by: ['category'],
      where: { organizationId: DEFAULT_ORG_ID, category: { not: null } },
      _count: true,
    });
    
    return {
      total,
      withPhone,
      withoutPhone: total - withPhone,
      byPlatform: byCategory.map(p => ({
        platform: p.category || 'unknown',
        count: p._count,
      })),
    };
  }
}
