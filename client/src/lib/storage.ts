export interface SavedWord {
  id: number;
  word: string;
  pronunciation: string;
  definition: string;
  sentence: string;
  savedAt: string;
}

const ANONYMOUS_ID_KEY = 'vocabmaster_anonymous_id';

const SAVED_WORDS_KEY = 'vocabmaster_saved_words';

export const storage = {
  getAnonymousId(): string {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANONYMOUS_ID_KEY, id);
    }
    return id;
  },
  getSavedWords(): SavedWord[] {
    try {
      const saved = localStorage.getItem(SAVED_WORDS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  saveWord(word: Omit<SavedWord, 'savedAt'>): void {
    const savedWords = this.getSavedWords();
    const existingIndex = savedWords.findIndex(w => w.word === word.word);
    
    if (existingIndex === -1) {
      savedWords.push({
        ...word,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(savedWords));
    }
  },

  removeSavedWord(word: string): void {
    const savedWords = this.getSavedWords();
    const filtered = savedWords.filter(w => w.word !== word);
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(filtered));
  },

  isWordSaved(word: string): boolean {
    return this.getSavedWords().some(w => w.word === word);
  },

  clearAllSavedWords(): void {
    localStorage.removeItem(SAVED_WORDS_KEY);
  }
};
