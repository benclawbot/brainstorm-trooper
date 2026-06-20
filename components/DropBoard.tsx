
import React from 'react';
import { Drop } from '../types';
import DropCard from './DropCard';

interface DropBoardProps {
  drops: Drop[];
  onRemove: (id: string) => void;
  onStartMindMap: (drop: Drop) => void;
  isDarkMode: boolean;
}

const DropBoard: React.FC<DropBoardProps> = ({ drops, onRemove, onStartMindMap, isDarkMode }) => {
  if (drops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
        <div className={`p-8 rounded-full animate-pulse ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
          <div className={`w-16 h-16 border-2 border-dashed rounded-full ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`} />
        </div>
        <div className="text-center">
          <h3 className={`text-xl font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Your board is empty</h3>
          <p className="text-sm">Type something above to start your thought stream.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 pb-24 w-full">
      {drops.map((drop) => (
        <div key={drop.id} className="w-full">
          <DropCard drop={drop} onRemove={onRemove} onStartMindMap={onStartMindMap} isDarkMode={isDarkMode} />
        </div>
      ))}
    </div>
  );
};

export default DropBoard;
