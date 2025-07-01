import { Bookmark, BookmarkCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VocabularyWord } from '@/hooks/use-vocabulary';

interface VocabularyCardProps {
  word: VocabularyWord;
  isSaved: boolean;
  onToggleSave: (word: VocabularyWord) => void;
}

export function VocabularyCard({ word, isSaved, onToggleSave }: VocabularyCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{word.word}</h3>
          <div className="pronunciation text-gray-600 mb-3">{word.pronunciation}</div>
        </div>
        <Button
          onClick={() => onToggleSave(word)}
          variant="ghost"
          size="sm"
          className={`w-10 h-10 rounded-full p-0 ${
            isSaved
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Definition</h4>
          <p className="text-gray-600 leading-relaxed">{word.definition}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Example</h4>
          <p className="text-gray-600 leading-relaxed italic">"{word.sentence}"</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Level: B2-C1</span>
          {isSaved ? (
            <span className="text-green-600 font-medium flex items-center">
              <Check size={14} className="mr-1" />
              Saved
            </span>
          ) : (
            <span className="text-gray-400">Click bookmark to save</span>
          )}
        </div>
      </div>
    </div>
  );
}
