import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableBlockProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  key?: string | number;
}

export function SortableBlock({ id, children, isSelected, onSelect }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group/block relative p-2.5 rounded transition duration-200 cursor-pointer ${
        isSelected 
          ? "ring-2 ring-[#8b4513]/80 bg-[#2b221a]/4 shadow-md" 
          : "hover:bg-[#2b221a]/2"
      }`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 p-1 bg-[#e8dcc4] border border-[#8b4513] text-[#8b4513] rounded-sm cursor-grab active:cursor-grabbing hover:bg-[#8b4513] hover:text-[#f5deb3] transition-colors z-20 no-print shadow-md"
        title="拖拽排序"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {children}
    </div>
  );
}
