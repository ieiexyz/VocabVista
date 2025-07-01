import { Bookmark, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SavedWord } from '@/lib/storage';

interface ReviewCardProps {
  word: SavedWord;
  onRemove: (word: string) => void;
}

export function ReviewCard({ word, onRemove }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6 card-hover">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{word.word}</h3>
          <div className="pronunciation text-gray-600 mb-3">{word.pronunciation}</div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Bookmark size={12} className="mr-1" />
            Saved
          </span>
          <Button
            onClick={() => onRemove(word.word)}
            variant="ghost"
            size="sm"
            className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 p-0"
          >
            <X size={14} />
          </Button>
        </div>
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
    </div>
  );
}
