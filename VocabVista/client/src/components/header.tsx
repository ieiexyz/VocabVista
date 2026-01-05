import { BookOpen, Eye, Book, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  savedCount: number;
  currentMode: 'learning' | 'review';
  onToggleMode: () => void;
}

export function Header({ savedCount, currentMode, onToggleMode }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">VocabMaster</h1>
              <p className="text-sm text-gray-500">Advanced English Learning</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <Bookmark className="text-green-600" size={16} />
              <span className="text-sm font-medium text-gray-700">
                Saved: {savedCount}
              </span>
            </div>
            
            <Button onClick={onToggleMode} className="bg-primary hover:bg-blue-700">
              {currentMode === 'learning' ? (
                <>
                  <Eye size={16} className="mr-2" />
                  <span className="hidden sm:inline">Review Mode</span>
                </>
              ) : (
                <>
                  <Book size={16} className="mr-2" />
                  <span className="hidden sm:inline">Learning Mode</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
