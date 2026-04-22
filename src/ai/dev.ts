import { config } from 'dotenv';
config();

/**
 * Genkit Active Flows Registry
 * 
 * Registering active production flows:
 * - document-summarization-flow: Summarizes project documents.
 * - face-verification-flow: Handles biometric verification for remote login.
 */
import '@/ai/flows/face-verification-flow.ts';
