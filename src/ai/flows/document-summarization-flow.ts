'use server';
/**
 * @fileOverview A Genkit flow for summarizing documents.
 *
 * - summarizeDocument - A function that handles the document summarization process.
 * - DocumentSummarizationInput - The input type for the summarizeDocument function.
 * - DocumentSummarizationOutput - The return type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentSummarizationInputSchema = z.object({
  documentText: z.string().describe('The full text content of the document to be summarized.'),
});
export type DocumentSummarizationInput = z.infer<typeof DocumentSummarizationInputSchema>;

const DocumentSummarizationOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the key points from the provided document.'),
});
export type DocumentSummarizationOutput = z.infer<typeof DocumentSummarizationOutputSchema>;

export async function summarizeDocument(
  input: DocumentSummarizationInput
): Promise<DocumentSummarizationOutput> {
  return documentSummarizationFlow(input);
}

const summarizeDocumentPrompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: {schema: DocumentSummarizationInputSchema},
  output: {schema: DocumentSummarizationOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing documents.
Your task is to read the provided document text and extract its most important key points, then provide a concise summary.

Document Text:
---
{{{documentText}}}
---

Provide a summary that captures the essence of the document, focusing on the main ideas and conclusions. The summary should be clear, brief, and easy to understand.
`,
});

const documentSummarizationFlow = ai.defineFlow(
  {
    name: 'documentSummarizationFlow',
    inputSchema: DocumentSummarizationInputSchema,
    outputSchema: DocumentSummarizationOutputSchema,
  },
  async input => {
    const {output} = await summarizeDocumentPrompt(input);
    return output!;
  }
);
