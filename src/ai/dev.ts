import { config } from 'dotenv';
config();

/**
 * Genkit Dev Synchronization
 * 
 * Active operational flows:
 * - document-summarization-flow
 * - face-verification-flow
 */
import '@/ai/flows/document-summarization-flow.ts';
import '@/ai/flows/face-verification-flow.ts';
