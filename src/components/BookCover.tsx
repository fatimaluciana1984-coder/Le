import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { COVER_PRESET_INFO, CoverPreset } from '../types/book';

interface BookCoverProps {
  preset: CoverPreset;
  title: string;
  author: string;
  className?: string;
}

export function BookCover({ preset, title, author, className = '' }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const info = COVER_PRESET_INFO[preset] || COVER_PRESET_INFO.stories;

  if (failed) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#ebe8e2] to-[#dcdad4] flex flex-col justify-between p-4 border border-[#dec0b7]/60 ${className}`}
      >
        <BookOpen className="w-6 h-6 text-[#9f3c16]" />
        <div>
          <p className="font-editorial text-sm font-semibold text-[#1c1c18] line-clamp-2">{title}</p>
          <p className="text-xs text-[#57423b] truncate mt-1">{author}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#e5e2dc] ${className}`}>
      <img
        src={info.imageUrl}
        alt={`Capa do livro ${title}, por ${author}`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
