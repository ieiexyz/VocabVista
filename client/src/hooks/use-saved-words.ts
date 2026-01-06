import { useState, useEffect } from 'react';
import { storage, type SavedWord } from '@/lib/storage';
import { apiRequest } from '@/lib/queryClient';

export function useSavedWords() {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const anonymousId = storage.getAnonymousId();

        const res = await apiRequest(
          'GET',
          `/api/saved-words?anonymousId=${encodeURIComponent(anonymousId)}`
        );
        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          const words: SavedWord[] = json.data.map((row: any) => ({
            word: row.word,
            pronunciation: row.pronunciation,
            definition: row.definition,
            sentence: row.sentence,
            savedAt: row.createdAt ?? new Date().toISOString(),
          }));

          setSavedWords(words);
          // 同步到 localStorage
          localStorage.setItem(
            'vocabmaster_saved_words',
            JSON.stringify(words)
          );
        }
      } catch (e) {
        console.error('Failed to load saved words', e);
        setError(e instanceof Error ? e : new Error('Failed to load saved words'));
        // 若後端失敗，沿用 localStorage 的資料
        setSavedWords(storage.getSavedWords());
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const saveWord = (word: Omit<SavedWord, 'savedAt'>) => {
    // 前端再檢查一次，避免同一個字被重複加入清單
    if (savedWords.some((w) => w.word.toLowerCase() === word.word.toLowerCase())) {
      return;
    }

    // 先更新 localStorage 作為即時回饋
    storage.saveWord(word);
    setSavedWords(storage.getSavedWords());

    // 再同步到後端（不阻塞 UI）
    const anonymousId = storage.getAnonymousId();
    void apiRequest('POST', '/api/saved-words', {
      anonymousId,
      vocabularyWordId: word.id, // 需要來自 VocabularyWord 的 id，呼叫方需提供
    }).catch((e) => {
      console.error('Failed to sync saved word to server', e);
    });
  };

  const removeSavedWord = (word: string) => {
    storage.removeSavedWord(word);
    setSavedWords(storage.getSavedWords());
  };

  const isWordSaved = (word: string) => {
    return storage.isWordSaved(word);
  };

  const clearAllSavedWords = () => {
    const anonymousId = storage.getAnonymousId();
    storage.clearAllSavedWords();
    setSavedWords([]);

    void apiRequest(
      'DELETE',
      `/api/saved-words?anonymousId=${encodeURIComponent(anonymousId)}`
    ).catch((e) => {
      console.error('Failed to clear saved words on server', e);
    });
  };

  const getRandomWords = (count: number) => {
    const shuffled = [...savedWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, savedWords.length));
  };

  return {
    savedWords,
    isLoading,
    error,
    saveWord,
    removeSavedWord,
    isWordSaved,
    clearAllSavedWords,
    getRandomWords,
    savedCount: savedWords.length
  };
}
