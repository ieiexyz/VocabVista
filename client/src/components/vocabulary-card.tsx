import { Bookmark, BookmarkCheck, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VocabularyWord } from '@/hooks/use-vocabulary';

interface VocabularyCardProps {
  word: VocabularyWord;
  isSaved: boolean;
  onToggleSave: (word: VocabularyWord) => void;
}

const LEVEL_COLORS: Record<string, { bar: string; badge: string }> = {
  A1: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  A2: { bar: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' },
  B1: { bar: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  B2: { bar: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  C1: { bar: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  C2: { bar: 'bg-pink-500',    badge: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200' },
};

function getLevelStyle(level: string) {
  const match = level?.match(/[ABC][12]/);
  return LEVEL_COLORS[match?.[0] ?? ''] ?? LEVEL_COLORS['B1'];
}

function getLevelLabel(level: string) {
  const match = level?.match(/[ABC][12]/);
  return match?.[0] ?? level ?? 'B1';
}

export function VocabularyCard({ word, isSaved, onToggleSave }: VocabularyCardProps) {
  const levelStyle = getLevelStyle(word.level);
  const levelLabel = getLevelLabel(word.level);

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover overflow-hidden flex">
      {/* Left color accent bar */}
      <div className={`w-1 shrink-0 ${levelStyle.bar}`} />

      <div className="flex-1 p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-xl font-bold text-gray-900">{word.word}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${levelStyle.badge}`}>
                {levelLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="pronunciation text-gray-500">{word.pronunciation}</span>
              <Button
                onClick={handlePlayPronunciation}
                variant="ghost"
                size="sm"
                className="w-7 h-7 rounded-full p-0 bg-blue-50 text-blue-500 hover:bg-blue-100"
                title="Play pronunciation"
              >
                <Volume2 size={13} />
              </Button>
            </div>
          </div>
          <Button
            onClick={() => onToggleSave(word)}
            variant="ghost"
            size="sm"
            className={`w-9 h-9 rounded-full p-0 shrink-0 transition-colors ${
              isSaved
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </Button>
        </div>

        <div className="space-y-2.5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Definition</span>
            <p className="text-gray-700 leading-relaxed mt-0.5">{word.definition}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Example</span>
            <p className="text-gray-500 leading-relaxed italic mt-0.5">"{word.sentence}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
