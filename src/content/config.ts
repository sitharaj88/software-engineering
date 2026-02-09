import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

// Extend the default Starlight docs schema
const docs = defineCollection({
  schema: docsSchema({
    extend: z.object({
      // Additional fields for our educational content
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      prerequisites: z.array(z.string()).optional(),
      timeToRead: z.string().optional(),
      topics: z.array(z.string()).optional(),
      order: z.number().optional(),
    }),
  }),
});

// Problem collection schema
const problems = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    topics: z.array(z.string()),
    patterns: z.array(z.string()).optional(),
    companies: z.array(z.string()).optional(),
    leetcodeId: z.number().optional(),
    timeComplexity: z.string(),
    spaceComplexity: z.string(),
    relatedProblems: z.array(z.string()).optional(),
    publishedAt: z.date(),
  }),
});

export const collections = {
  docs,
  problems,
};
