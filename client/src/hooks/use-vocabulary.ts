import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

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
  const [previousWords, setPreviousWords] = useState<Set<string>>(new Set());

  const generateMutation = useMutation({
    mutationFn: async (request: GenerateVocabularyRequest = {}) => {
      const excludeWords = Array.from(previousWords);
      const response = await apiRequest('POST', '/api/vocabulary/generate', {
        level: request.level || 'B1-C1',
        numWords: request.numWords || 6,
        excludeWords
      });
      return response.json() as Promise<GenerateVocabularyResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        const newWords = data.data.map(word => word.word.toLowerCase());
        setPreviousWords(prev => new Set([...Array.from(prev), ...newWords]));
      }
    }
  });

  const resetWordHistory = () => {
    setPreviousWords(new Set());
    generateMutation.reset();
  };

  return {
    generateVocabulary: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    generationError: generateMutation.error,
    generatedWords: generateMutation.data?.data || [],
    reset: generateMutation.reset,
    resetWordHistory,
    previousWordsCount: previousWords.size
  };
}
