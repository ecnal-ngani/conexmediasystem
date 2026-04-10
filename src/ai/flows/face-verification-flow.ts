
'use server';
/**
 * @fileOverview A Genkit flow for verifying user identity via photo for WFH compliance.
 *
 * - verifyFace - A function that analyzes a photo to ensure a valid face is present for security clearance.
 * - FaceVerificationInput - The input type (photo data URI).
 * - FaceVerificationOutput - The verification result.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {gemini15Flash} from '@genkit-ai/google-genai';

const FaceVerificationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FaceVerificationInput = z.infer<typeof FaceVerificationInputSchema>;

const FaceVerificationOutputSchema = z.object({
  isVerified: z.boolean().describe('Whether a clear human face is detected and matches security parameters.'),
  confidence: z.number().describe('Confidence score of the verification (0-1).'),
  message: z.string().describe('A brief message about the verification status.'),
});
export type FaceVerificationOutput = z.infer<typeof FaceVerificationOutputSchema>;

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't resolve within `ms`.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const MAX_RETRIES = 2;
const TIMEOUT_MS = 15_000; // 15 seconds per attempt

export async function verifyFace(input: FaceVerificationInput): Promise<FaceVerificationOutput> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await withTimeout(
        faceVerificationFlow(input),
        TIMEOUT_MS,
        `Biometric analysis (attempt ${attempt})`
      );
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[FaceVerification] Attempt ${attempt}/${MAX_RETRIES} failed:`, err?.message);

      // Don't retry on non-transient errors (e.g. bad input)
      if (err?.message?.includes('INVALID_ARGUMENT') || err?.message?.includes('schema')) {
        break;
      }

      // On rate-limit (429), wait longer to let the quota reset
      if (attempt < MAX_RETRIES) {
        const is429 = err?.message?.includes('429') || err?.message?.includes('Too Many Requests');
        const delay = is429 ? 3000 : 500 * attempt;
        console.log(`[FaceVerification] Waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // No graceful bypass — face verification is mandatory for security
  // If the AI service is down or all retries fail, reject the attempt
  console.error('[FaceVerification] All attempts exhausted. Denying access.', lastError?.message);
  return {
    isVerified: false,
    confidence: 0,
    message: `Verification service is temporarily unavailable: ${lastError?.message || 'Unknown Error'}`,
  };
}

const faceVerificationPrompt = ai.definePrompt({
  name: 'faceVerificationPrompt',
  model: gemini15Flash,
  input: {schema: FaceVerificationInputSchema},
  output: {schema: FaceVerificationOutputSchema},
  prompt: `You are a biometric analysis system for CONEX MEDIA employee verification.
Analyze this photo from a WFH login attempt. Be fast and decisive.

CHECKS:
1. Is there a clear, visible human face? (not a screen photo, mask, or object)
2. Is the face reasonably well-lit and unobscured?

If a real human face is clearly visible: isVerified=true, confidence >= 0.8.
If not: isVerified=false, confidence < 0.5.

Photo: {{media url=photoDataUri}}

Respond with the verification result immediately.`,
});

const faceVerificationFlow = ai.defineFlow(
  {
    name: 'faceVerificationFlow',
    inputSchema: FaceVerificationInputSchema,
    outputSchema: FaceVerificationOutputSchema,
  },
  async input => {
    const {output} = await faceVerificationPrompt(input);
    if (!output) throw new Error("Biometric analysis failed to generate output.");
    return output;
  }
);
