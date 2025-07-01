import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface VocabularyWord {
  word: string;
  pronunciation: string;
  definition: string;
  sentence: string;
}

interface GenerateVocabularyRequest {
  level?: string;
  numWords?: number;
}

interface GenerateVocabularyResponse {
  success: boolean;
  data: VocabularyWord[];
  error?: string;
}

export function useVocabulary() {
  const generateMutation = useMutation({
    mutationFn: async (request: GenerateVocabularyRequest = {}) => {
      const response = await apiRequest('POST', '/api/vocabulary/generate', {
        level: request.level || 'B1-C1',
        numWords: request.numWords || 6
      });
      return response.json() as Promise<GenerateVocabularyResponse>;
    }
  });

  return {
    generateVocabulary: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    generationError: generateMutation.error,
    generatedWords: generateMutation.data?.data || [],
    reset: generateMutation.reset
  };
}
