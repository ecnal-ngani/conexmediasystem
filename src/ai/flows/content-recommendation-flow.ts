'use server';
/**
 * @fileOverview An AI agent for curating content recommendations.
 *
 * - recommendContent - A function that suggests relevant documents, articles, or media.
 * - ContentRecommendationInput - The input type for the recommendContent function.
 * - ContentRecommendationOutput - The return type for the recommendContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const ContentRecommendationInputSchema = z.object({
  userPreferences: z.string().describe('A description of the user\'s interests, role, or other relevant preferences, e.g., "I am interested in financial reports and market analysis."'),
  availableContent: z.array(z.object({
    id: z.string().describe('Unique identifier for the content.'),
    title: z.string().describe('The title of the content.'),
    description: z.string().describe('A brief summary or description of the content.'),
    category: z.string().describe('The category of the content (e.g., "document", "article", "video", "report").'),
    tags: z.array(z.string()).describe('Keywords or tags associated with the content.'),
  })).describe('A list of all available authorized content within the private network.'),
});
export type ContentRecommendationInput = z.infer<typeof ContentRecommendationInputSchema>;

// Output Schema
const ContentRecommendationOutputSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string().describe('The unique identifier of the recommended content, which MUST match an "id" from the provided "Available Content".'),
    title: z.string().describe('The title of the recommended content.'),
    description: z.string().describe('A brief summary of the recommended content.'),
    reason: z.string().describe('A concise explanation of why this content is relevant and recommended for the user.'),
  })).describe('A list of recommended content items based on user preferences.'),
});
export type ContentRecommendationOutput = z.infer<typeof ContentRecommendationOutputSchema>;

// Prompt Definition
const recommendContentPrompt = ai.definePrompt({
  name: 'recommendContentPrompt',
  input: {schema: ContentRecommendationInputSchema},
  output: {schema: ContentRecommendationOutputSchema},
  prompt: `You are an AI-Powered Content Curator for the CONEX Gateway, a private network. Your goal is to provide personalized and highly relevant content recommendations to authorized users.\n\nAnalyze the user's preferences and the list of available content. Identify the 3 to 5 most relevant documents, articles, or media items that match the user's interests. For each selected item, provide its ID, title, description, and a concise reason for the recommendation. Ensure the 'id' for each recommendation exactly matches an 'id' from the 'Available Content' list provided.\n\nUser Preferences:\n{{{userPreferences}}}\n\nAvailable Content:\n{{#each availableContent}}\n---\nID: {{this.id}}\nTitle: {{this.title}}\nDescription: {{this.description}}\nCategory: {{this.category}}\nTags: {{#each this.tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}\n---\n{{/each}}\n\nStrictly adhere to the JSON output format provided in the output schema.\n`,
});

// Flow Definition
const contentRecommendationFlow = ai.defineFlow(
  {
    name: 'contentRecommendationFlow',
    inputSchema: ContentRecommendationInputSchema,
    outputSchema: ContentRecommendationOutputSchema,
  },
  async (input) => {
    const {output} = await recommendContentPrompt(input);
    if (!output) {
      throw new Error('No output received from content recommendation prompt.');
    }
    return output;
  }
);

// Wrapper Function
export async function recommendContent(input: ContentRecommendationInput): Promise<ContentRecommendationOutput> {
  return contentRecommendationFlow(input);
}
