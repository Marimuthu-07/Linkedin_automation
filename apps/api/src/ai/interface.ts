import { z } from 'zod';

export interface AIProvider {
  name: string;

  /**
   * Generates freeform text from a prompt and system instruction.
   */
  generateText(prompt: string, systemPrompt?: string): Promise<string>;

  /**
   * Generates structured JSON matching a validated Zod schema.
   */
  generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemPrompt?: string
  ): Promise<T>;

  /**
   * Analyzes an input string or webpage text and provides structured insights.
   */
  analyze(input: string, context?: string): Promise<{ summary: string; insights: string[] }>;

  /**
   * Summarizes lengthy text concisely.
   */
  summarize(text: string, maxWords?: number): Promise<string>;
}
