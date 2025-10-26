import { Bookmark, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SavedWord } from '@/lib/storage';

interface ReviewCardProps {
  word: SavedWord;
  onRemove: (word: string) => void;
}

export function ReviewCard({ word, onRemove }: ReviewCardProps) {
  const handlePlayPronunciation = () => {
    if ('speechSynthesis' in window) {
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(word.word);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        const voices = speechSynthesis.getVoices();
        
        const preferredVoice = voices.find(voice => 
          (voice.lang.includes('en-US') || voice.lang.includes('en-GB')) &&
          (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Samantha') || voice.name.includes('Daniel'))
        );
        
        const fallbackVoice = voices.find(voice => 
          voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        
        utterance.voice = preferredVoice || fallbackVoice || null;
        
        speechSynthesis.speak(utterance);
      };
      
      if (speechSynthesis.getVoices().length > 0) {
        speak();
      } else {
        speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6 card-hover">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{word.word}</h3>
          <div className="flex items-center space-x-2 mb-3">
            <div className="pronunciation text-gray-600">{word.pronunciation}</div>
            <Button
              onClick={handlePlayPronunciation}
              variant="ghost"
              size="sm"
              className="w-8 h-8 rounded-full p-0 bg-blue-50 text-blue-600 hover:bg-blue-100"
              title="Play pronunciation"
            >
              <Volume2 size={14} />
            </Button>
          </div>
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
