import { useState, useEffect } from 'react';
import { storage, type SavedWord } from '@/lib/storage';

export function useSavedWords() {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);

  useEffect(() => {
    setSavedWords(storage.getSavedWords());
  }, []);

  const saveWord = (word: Omit<SavedWord, 'savedAt'>) => {
    storage.saveWord(word);
    setSavedWords(storage.getSavedWords());
  };

  const removeSavedWord = (word: string) => {
    storage.removeSavedWord(word);
    setSavedWords(storage.getSavedWords());
  };

  const isWordSaved = (word: string) => {
    return storage.isWordSaved(word);
  };

  const clearAllSavedWords = () => {
    storage.clearAllSavedWords();
    setSavedWords([]);
  };

  const getRandomWords = (count: number) => {
    const shuffled = [...savedWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, savedWords.length));
  };

  return {
    savedWords,
    saveWord,
    removeSavedWord,
    isWordSaved,
    clearAllSavedWords,
    getRandomWords,
    savedCount: savedWords.length
  };
}
