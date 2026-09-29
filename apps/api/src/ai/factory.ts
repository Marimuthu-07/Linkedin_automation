import { AIProvider } from './interface.js';
import { MockAIProvider } from './mockProvider.js';

let defaultProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (defaultProvider) return defaultProvider;

  const providerType = process.env.AI_PROVIDER || 'mock';

  switch (providerType.toLowerCase()) {
    case 'mock':
    default:
      defaultProvider = new MockAIProvider();
      break;
  }

  return defaultProvider;
}
