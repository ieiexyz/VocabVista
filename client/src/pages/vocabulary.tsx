import { useState } from 'react';
import { Wand2, Trash2, Shuffle, BookOpen, Bookmark, Play, AlertCircle, RefreshCw } from 'lucide-react';
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

export default function VocabularyPage() {
  const [currentMode, setCurrentMode] = useState<'learning' | 'review'>('learning');
  const [showClearModal, setShowClearModal] = useState(false);
  const [reviewWords, setReviewWords] = useState<any[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["lenny"]);
  const { toast } = useToast();

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(t => t !== id) : prev
        : [...prev, id]
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
    generateVocabulary({ level: 'B1-C1', numWords: 6, topics: selectedTopics });
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
    <div className="min-h-screen bg-gray-50">
      <Header
        savedCount={savedCount}
        currentMode={currentMode}
        onToggleMode={handleToggleMode}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentMode === 'learning' ? (
          <div className="space-y-8">
            {/* Action Bar */}
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Expand Your Vocabulary</h2>
                  <p className="text-gray-600">Generate advanced English words with pronunciations and example sentences</p>
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
              {/* Topic Selector */}
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Select vocabulary topics (choose at least one)
                </p>
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
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Learn?</h3>
                <p className="text-gray-600 mb-6">Click "Generate Words" to get started with advanced vocabulary</p>
                <Button onClick={handleGenerateVocabulary} className="bg-primary hover:bg-blue-700">
                  <Play size={16} className="mr-2" />
                  Get Started
                </Button>
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
