import { BookOpen, Eye, Book, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  savedCount: number;
  currentMode: 'learning' | 'review';
  onToggleMode: () => void;
}

export function Header({ savedCount, currentMode, onToggleMode }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">VocabVista</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 ring-1 ring-green-200 px-2.5 py-1.5 rounded-full text-sm font-semibold">
              <Bookmark size={13} className="text-green-600 shrink-0" />
              {savedCount}
            </div>

            <Button onClick={onToggleMode} className="bg-primary hover:bg-blue-700 text-sm px-3">
              {currentMode === 'learning' ? (
                <>
                  <Eye size={15} className="mr-1.5" />
                  Review
                </>
              ) : (
                <>
                  <Book size={15} className="mr-1.5" />
                  Learn
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
