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
  const [generationCount, setGenerationCount] = useState(0);

  const generateMutation = useMutation({
    mutationFn: async (request: GenerateVocabularyRequest = {}) => {
      // Reset word history after 5 generations to allow repetition for reinforcement
      const shouldResetHistory = generationCount >= 5;
      const excludeWords = shouldResetHistory ? [] : Array.from(previousWords);
      
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
        setGenerationCount(prev => {
          const newCount = prev + 1;
          // Reset after 5 generations
          if (newCount >= 5) {
            setPreviousWords(new Set(newWords));
            return 0;
          } else {
            setPreviousWords(prevWords => new Set([...Array.from(prevWords), ...newWords]));
            return newCount;
          }
        });
      }
    }
  });

  const resetWordHistory = () => {
    setPreviousWords(new Set());
    setGenerationCount(0);
    generateMutation.reset();
  };

  return {
    generateVocabulary: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    generationError: generateMutation.error,
    generatedWords: generateMutation.data?.data || [],
    reset: generateMutation.reset,
    resetWordHistory,
    previousWordsCount: previousWords.size,
    generationCount
  };
}
