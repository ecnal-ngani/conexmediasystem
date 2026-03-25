
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

export async function verifyFace(input: FaceVerificationInput): Promise<FaceVerificationOutput> {
  return faceVerificationFlow(input);
}

const faceVerificationPrompt = ai.definePrompt({
  name: 'faceVerificationPrompt',
  input: {schema: FaceVerificationInputSchema},
  output: {schema: FaceVerificationOutputSchema},
  prompt: `You are a high-security biometric analysis agent for CONEX MEDIA. 
Analyze the provided photo taken during a WFH (Work From Home) login attempt.

STRICT PROTOCOLS:
1. Verify if the photo contains a clear, visible human face.
2. Ensure the face is NOT a photograph of a screen, a mask, or an inanimate object.
3. Reject if the face is obscured by heavy shadows, masks (non-medical), or filters.
4. The output must indicate if the individual is authorized based on visual clarity and presence of a real person.

Photo: {{media url=photoDataUri}}

Output the verification status, a confidence score (be conservative), and a short status message indicating access to the media system.`,
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
