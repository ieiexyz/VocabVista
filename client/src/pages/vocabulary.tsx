import { useState } from 'react';
import { Wand2, Trash2, Shuffle, BookOpen, Bookmark, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { VocabularyCard } from '@/components/vocabulary-card';
import { ReviewCard } from '@/components/review-card';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { useVocabulary } from '@/hooks/use-vocabulary';
import { useSavedWords } from '@/hooks/use-saved-words';

const TOPICS = [
  { id: "lenny", label: "Tech Management" },
  { id: "workplace", label: "Workplace" },
  { id: "taiwan", label: "Taiwan Culture" },
  { id: "travel", label: "Travel & Food" },
  { id: "daily", label: "Daily Chat" },
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function VocabularyPage() {
  const [currentMode, setCurrentMode] = useState<'learning' | 'review'>('learning');
  const [showClearModal, setShowClearModal] = useState(false);
  const [reviewWords, setReviewWords] = useState<any[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["lenny"]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["B1", "B2"]);
  const { toast } = useToast();

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(t => t !== id) : prev
        : [...prev, id]
    );
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev =>
      prev.includes(level)
        ? prev.length > 1 ? prev.filter(l => l !== level) : prev
        : [...prev, level]
    );
  };

  const {
    generateVocabulary,
    isGenerating,
    generationError,
    generatedWords,
    reset
  } = useVocabulary();

  const {
    savedWords,
    saveWord,
    removeSavedWord,
    isWordSaved,
    clearAllSavedWords,
    getRandomWords,
    savedCount
  } = useSavedWords();

  // 不再用 toast 顯示錯誤，改用 inline error state，避免 skeleton 殘留

  const handleGenerateVocabulary = () => {
    reset();
    generateVocabulary({ levels: selectedLevels, numWords: 6, topics: selectedTopics });
  };

  const handleToggleSave = (word: any) => {
    if (isWordSaved(word.word)) {
      removeSavedWord(word.word);
      toast({
        title: "Word removed",
        description: `"${word.word}" has been removed from your saved words.`,
        duration: 2000,
      });
    } else {
      saveWord(word);
      toast({
        title: "Word saved!",
        description: `"${word.word}" has been added to your saved words.`,
        variant: "default",
        duration: 2000,
      });
    }
  };

  const handleToggleMode = () => {
    setCurrentMode(currentMode === 'learning' ? 'review' : 'learning');
    if (currentMode === 'learning') {
      setReviewWords(savedWords);
    }
  };

  const handleReviewRandom = () => {
    if (savedWords.length === 0) {
      toast({
        title: "No saved words",
        description: "Save some words first to start reviewing.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    const randomWords = getRandomWords(3);
    setReviewWords(randomWords);
    toast({
      title: "Random review",
      description: `Reviewing ${randomWords.length} random words.`,
      duration: 2000,
    });
  };

  const handleClearSaved = () => {
    if (savedCount === 0) {
      toast({
        title: "No saved words",
        description: "There are no words to clear.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    setShowClearModal(true);
  };

  const confirmClearSaved = () => {
    clearAllSavedWords();
    setShowClearModal(false);
    setReviewWords([]);
    toast({
      title: "All words cleared",
      description: "All saved words have been removed.",
      duration: 3000,
    });
  };

  const handleRemoveFromReview = (word: string) => {
    // Remove from saved words
    removeSavedWord(word);
    // Remove from current review list immediately
    setReviewWords(prev => prev.filter(w => w.word !== word));
    toast({
      title: "Word removed",
      description: `"${word}" has been removed from your saved words.`,
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        savedCount={savedCount}
        currentMode={currentMode}
        onToggleMode={handleToggleMode}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentMode === 'learning' ? (
          <div className="space-y-8">
            {/* Action Bar */}
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Expand Your Vocabulary</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Pick topics and difficulty, then generate.</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button onClick={handleGenerateVocabulary} disabled={isGenerating} className="bg-primary hover:bg-blue-700">
                    <Wand2 size={16} className="mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Words'}
                  </Button>
                  <Button onClick={handleClearSaved} variant="outline" className="text-gray-700">
                    <Trash2 size={16} className="mr-2" />
                    <span className="hidden sm:inline">Clear Saved</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 sm:gap-0 sm:divide-x sm:divide-gray-100">
                {/* Topic Selector */}
                <div className="sm:pr-6 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Topic</p>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map(topic => {
                      const isSelected = selectedTopics.includes(topic.id);
                      const isLastSelected = isSelected && selectedTopics.length === 1;
                      return (
                        <button
                          key={topic.id}
                          onClick={() => toggleTopic(topic.id)}
                          disabled={isLastSelected}
                          title={isLastSelected ? "At least one topic is required" : undefined}
                          aria-pressed={isSelected}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                            isSelected
                              ? isLastSelected
                                ? "bg-primary text-white border-primary opacity-60 cursor-not-allowed"
                                : "bg-primary text-white border-primary"
                              : "bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary active:bg-gray-100"
                          )}
                        >
                          {topic.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Level Selector */}
                <div className="sm:pl-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Level</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {([["A1","A2"], ["B1","B2"], ["C1","C2"]] as string[][]).map((group, gi) => (
                      <span key={gi} className="flex items-center gap-1">
                        {gi > 0 && <span className="text-gray-200 select-none px-0.5">|</span>}
                        {group.map(level => {
                          const isSelected = selectedLevels.includes(level);
                          const isLastSelected = isSelected && selectedLevels.length === 1;
                          return (
                            <button
                              key={level}
                              onClick={() => toggleLevel(level)}
                              disabled={isLastSelected}
                              title={isLastSelected ? "At least one level is required" : undefined}
                              aria-pressed={isSelected}
                              className={cn(
                                "w-10 py-1.5 rounded-full text-sm font-medium border transition-colors text-center",
                                isSelected
                                  ? isLastSelected
                                    ? "bg-primary text-white border-primary opacity-60 cursor-not-allowed"
                                    : "bg-primary text-white border-primary"
                                  : "bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary active:bg-gray-100"
                              )}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Error State */}
            {generationError && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-red-400" size={28} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Generation Failed</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs">
                  {generationError.message?.includes("GEMINI") || generationError.message?.includes("API")
                    ? "AI service is temporarily unavailable, please try again later."
                    : "Something went wrong, please try again."}
                </p>
                <Button onClick={handleGenerateVocabulary} className="bg-primary hover:bg-blue-700">
                  <RefreshCw size={15} className="mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Loading State - Skeleton Cards */}
            {isGenerating && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Vocabulary Grid */}
            {generatedWords.length > 0 && !isGenerating && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedWords.map((word, index) => (
                  <VocabularyCard
                    key={`${word.word}-${index}`}
                    word={word}
                    isSaved={isWordSaved(word.word)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {generatedWords.length === 0 && !isGenerating && !generationError && (
              <div className="text-center py-12">
                {/* Illustration */}
                <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6">
                  {/* Book shadow */}
                  <ellipse cx="110" cy="152" rx="52" ry="5" fill="#E2E8F0" />
                  {/* Left page */}
                  <path d="M110 145 L50 133 L50 67 L110 79 Z" fill="#DBEAFE" />
                  <path d="M110 145 L50 133 L50 67 L110 79 Z" stroke="#BFDBFE" strokeWidth="1.5" />
                  {/* Right page */}
                  <path d="M110 145 L170 133 L170 67 L110 79 Z" fill="#EDE9FE" />
                  <path d="M110 145 L170 133 L170 67 L110 79 Z" stroke="#DDD6FE" strokeWidth="1.5" />
                  {/* Spine */}
                  <path d="M107 77 Q110 75 113 77 L113 147 Q110 149 107 147 Z" fill="#4F46E5" />
                  {/* Lines left page */}
                  <line x1="64" y1="96" x2="100" y2="99"  stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="64" y1="110" x2="98" y2="113" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="64" y1="124" x2="95" y2="127" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Lines right page */}
                  <line x1="120" y1="99"  x2="156" y2="96"  stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="122" y1="113" x2="156" y2="110" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="125" y1="127" x2="156" y2="124" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Tech badge – indigo, top-left */}
                  <g style={{ animation: 'floatBadge 3s ease-in-out infinite' }}>
                    <circle cx="46" cy="38" r="22" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="1.5" />
                    {/* Code icon: < / > */}
                    <path d="M40 34 L36 38 L40 42" stroke="#3730A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M52 34 L56 38 L52 42" stroke="#3730A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <line x1="50" y1="31" x2="44" y2="45" stroke="#3730A3" strokeWidth="1.8" strokeLinecap="round" />
                  </g>
                  {/* Travel badge – emerald, top-right */}
                  <g style={{ animation: 'floatBadge 3.5s ease-in-out infinite 0.4s' }}>
                    <circle cx="178" cy="32" r="22" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1.5" />
                    {/* Paper plane icon */}
                    <path d="M170 40 L188 24 L184 32 Z" fill="#059669" opacity="0.9" />
                    <path d="M170 40 L179 38 L184 32 Z" fill="#34D399" opacity="0.8" />
                    <line x1="178" y1="36" x2="176" y2="41" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                  {/* Chat badge – amber, right side */}
                  <g style={{ animation: 'floatBadge 4s ease-in-out infinite 0.8s' }}>
                    <circle cx="196" cy="108" r="20" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="1.5" />
                    {/* Speech bubble icon */}
                    <rect x="185" y="99" width="22" height="14" rx="4" fill="none" stroke="#D97706" strokeWidth="1.8" />
                    <path d="M190 113 L187 118 L193 113 Z" fill="#D97706" />
                  </g>
                  {/* Gold sparkle */}
                  <path d="M89 24 L90.5 29.5 L96 31 L90.5 32.5 L89 38 L87.5 32.5 L82 31 L87.5 29.5 Z" fill="#FCD34D" />
                  {/* Blue sparkle */}
                  <path d="M148 158 L149 161 L152 162 L149 163 L148 166 L147 163 L144 162 L147 161 Z" fill="#93C5FD" />
                  {/* Dot decorations */}
                  <circle cx="28" cy="98"  r="4.5" fill="#DBEAFE" />
                  <circle cx="22" cy="130" r="3"   fill="#EDE9FE" />
                  <circle cx="36" cy="150" r="2.5" fill="#DBEAFE" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Learn?</h3>
                <p className="text-gray-500">Pick your topics and level above, then hit <span className="font-semibold text-gray-700">Generate Words</span>.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Review Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Saved Words</h2>
                  <p className="text-gray-600">Practice vocabulary you've saved for later</p>
                </div>
                <Button onClick={handleReviewRandom} className="bg-green-500 hover:bg-green-600">
                  <Shuffle size={16} className="mr-2" />
                  Random Review
                </Button>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Bookmark className="text-green-600" size={16} />
                  <span>Total Saved: {savedCount}</span>
                </span>
              </div>
            </div>

            {/* Review Grid */}
            {reviewWords.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviewWords.map((word) => (
                  <ReviewCard
                    key={word.word}
                    word={word}
                    onRemove={handleRemoveFromReview}
                  />
                ))}
              </div>
            )}

            {/* Review Empty State */}
            {reviewWords.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {savedCount === 0 ? 'No Saved Words Yet' : 'Start a Random Review'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {savedCount === 0
                    ? 'Save words from the learning mode to review them here'
                    : 'Click "Random Review" to practice your saved vocabulary'
                  }
                </p>
                <Button
                  onClick={savedCount === 0 ? handleToggleMode : handleReviewRandom}
                  className="bg-primary hover:bg-blue-700"
                >
                  {savedCount === 0 ? (
                    <>
                      <BookOpen size={16} className="mr-2" />
                      Back to Learning
                    </>
                  ) : (
                    <>
                      <Shuffle size={16} className="mr-2" />
                      Start Review
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearSaved}
        title="Clear All Saved Words?"
        message="This action cannot be undone."
      />
    </div>
  );
}
