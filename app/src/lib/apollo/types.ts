import { z } from "zod/v4";

export const ApolloOrganizationSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  website_url: z.string().optional().nullable(),
  employee_count: z.number().optional().nullable(),
  employee_count_range: z
    .object({
      start: z.number().optional(),
      end: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export const ApolloPersonSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  seniority: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  email_status: z.string().optional().nullable(),
  phone_status: z.string().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  linkedin_url_alternate: z.string().optional().nullable(),
  linkedin_user_url: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  organization: ApolloOrganizationSchema.optional().nullable(),
}).passthrough();

export type ApolloPerson = z.infer<typeof ApolloPersonSchema>;

export const ApolloSearchRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).optional(),
  q_keywords: z.array(z.string()).optional(),
  person_titles: z.array(z.string()).optional(),
  person_seniorities: z.array(z.string()).optional(),
  person_locations: z.array(z.string()).optional(),
  organization_locations: z.array(z.string()).optional(),
  organization_num_employees_ranges: z.array(z.string()).optional(),
  organization_industry_tags: z.array(z.string()).optional(),
  reveal_contacts: z.boolean().optional(),
});

export type ApolloSearchRequest = z.infer<typeof ApolloSearchRequestSchema>;

export const ApolloPaginationSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  total_entries: z.number().optional(),
  total_pages: z.number().optional(),
});

export const ApolloSearchResponseSchema = z.object({
  pagination: ApolloPaginationSchema.optional(),
  people: z.array(ApolloPersonSchema).default([]),
});

export type ApolloSearchResponse = z.infer<typeof ApolloSearchResponseSchema>;

export const ApolloMatchResponseSchema = z.object({
  person: ApolloPersonSchema.optional().nullable(),
});

export type ApolloMatchResponse = z.infer<typeof ApolloMatchResponseSchema>;

export interface ApolloClientOptions {
  baseUrl?: string;
  perPage?: number;
  maxPages?: number;
  timeoutMs?: number;
  reveal?: boolean;
}