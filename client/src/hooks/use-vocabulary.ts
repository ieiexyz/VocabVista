import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { storage } from '@/lib/storage';
import { useState } from 'react';

export interface VocabularyWord {
  id: number;
  word: string;
  pronunciation: string;
  definition: string;
  sentence: string;
  level: string;
}

interface GenerateVocabularyRequest {
  level?: string;
  numWords?: number;
  topics?: string[];
}

interface GenerateVocabularyResponse {
  success: boolean;
  data: VocabularyWord[];
  error?: string;
}

const PREVIOUS_WORDS_KEY = 'vocabmaster_previous_words';
const GENERATION_COUNT_KEY = 'vocabmaster_generation_count';

function loadPreviousWords(): Set<string> {
  try {
    const raw = localStorage.getItem(PREVIOUS_WORDS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function savePreviousWords(words: Set<string>): void {
  localStorage.setItem(PREVIOUS_WORDS_KEY, JSON.stringify(Array.from(words)));
}

function loadGenerationCount(): number {
  try {
    return Number(localStorage.getItem(GENERATION_COUNT_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function useVocabulary() {
  const [previousWords, setPreviousWords] = useState<Set<string>>(loadPreviousWords);
  const [generationCount, setGenerationCount] = useState<number>(loadGenerationCount);

  const generateMutation = useMutation({
    mutationFn: async (request: GenerateVocabularyRequest = {}) => {
      // Reset word history after 5 generations to allow repetition for reinforcement
      const shouldResetHistory = generationCount >= 5;
      const excludeWords = shouldResetHistory ? [] : Array.from(previousWords);
      
      const response = await apiRequest('POST', '/api/vocabulary/generate', {
        level: request.level || 'B1-C1',
        numWords: request.numWords || 6,
        excludeWords,
        anonymousId: storage.getAnonymousId(),
        topics: request.topics ?? ["lenny"],
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
            const next = new Set(newWords);
            setPreviousWords(next);
            savePreviousWords(next);
            localStorage.setItem(GENERATION_COUNT_KEY, '0');
            return 0;
          } else {
            setPreviousWords(prevWords => {
              const next = new Set([...Array.from(prevWords), ...newWords]);
              savePreviousWords(next);
              return next;
            });
            localStorage.setItem(GENERATION_COUNT_KEY, String(newCount));
            return newCount;
          }
        });
      }
    }
  });

  const resetWordHistory = () => {
    setPreviousWords(new Set());
    setGenerationCount(0);
    localStorage.removeItem(PREVIOUS_WORDS_KEY);
    localStorage.removeItem(GENERATION_COUNT_KEY);
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
