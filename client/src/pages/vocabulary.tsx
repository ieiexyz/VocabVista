import { useState, useEffect } from 'react';
import { Wand2, Trash2, Shuffle, BookOpen, Bookmark, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { VocabularyCard } from '@/components/vocabulary-card';
import { ReviewCard } from '@/components/review-card';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { useVocabulary } from '@/hooks/use-vocabulary';
import { useSavedWords } from '@/hooks/use-saved-words';

export default function VocabularyPage() {
  const [currentMode, setCurrentMode] = useState<'learning' | 'review'>('learning');
  const [showClearModal, setShowClearModal] = useState(false);
  const [reviewWords, setReviewWords] = useState<any[]>([]);
  const { toast } = useToast();

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

  useEffect(() => {
    if (generationError) {
      toast({
        title: "Generation Failed",
        description: generationError.message || "Failed to generate vocabulary. Please try again.",
        variant: "destructive"
      });
    }
  }, [generationError, toast]);

  const handleGenerateVocabulary = () => {
    reset();
    generateVocabulary({ level: 'B1-C1', numWords: 6 });
    toast({
      title: "Generating vocabulary...",
      description: "Please wait while we create new words for you."
    });
  };

  const handleToggleSave = (word: any) => {
    if (isWordSaved(word.word)) {
      removeSavedWord(word.word);
      toast({
        title: "Word removed",
        description: `"${word.word}" has been removed from your saved words.`
      });
    } else {
      saveWord(word);
      toast({
        title: "Word saved!",
        description: `"${word.word}" has been added to your saved words.`,
        variant: "default"
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
        variant: "destructive"
      });
      return;
    }

    const randomWords = getRandomWords(3);
    setReviewWords(randomWords);
    toast({
      title: "Random review",
      description: `Reviewing ${randomWords.length} random words.`
    });
  };

  const handleClearSaved = () => {
    if (savedCount === 0) {
      toast({
        title: "No saved words",
        description: "There are no words to clear.",
        variant: "destructive"
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
      description: "All saved words have been removed."
    });
  };

  const handleRemoveFromReview = (word: string) => {
    // Remove from saved words
    removeSavedWord(word);
    // Remove from current review list immediately
    setReviewWords(prev => prev.filter(w => w.word !== word));
    toast({
      title: "Word removed",
      description: `"${word}" has been removed from your saved words.`
    });
  };

  useEffect(() => {
    if (generatedWords.length > 0) {
      toast({
        title: "Vocabulary generated!",
        description: `${generatedWords.length} new words are ready for learning.`,
        variant: "default"
      });
    }
  }, [generatedWords, toast]);

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
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-6 rounded-xl shadow-sm">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Expand Your Vocabulary</h2>
                <p className="text-gray-600">Generate advanced English words with pronunciations and example sentences</p>
              </div>
              <div className="flex gap-3">
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

            {/* Loading State */}
            {isGenerating && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full loading-spinner"></div>
                  <p className="text-gray-600 font-medium">Generating vocabulary words...</p>
                </div>
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
            {generatedWords.length === 0 && !isGenerating && (
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
