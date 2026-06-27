const fs = require('fs');
const path = require('path');

const previewPath = path.join(__dirname, 'src', 'components', 'NewspaperPreview.tsx');
let content = fs.readFileSync(previewPath, 'utf-8');

// 1. Add imports
content = content.replace(
  'import { Eye, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";',
  `import { Eye, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBlock } from "./SortableBlock";`
);

// 2. Add setNewspaperData to destructuring
content = content.replace(
  'newspaperData,',
  'newspaperData, setNewspaperData,'
);

// 3. Inject handlers
const handlersCode = `
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const findContainer = (id: string) => {
    for (const row of newspaperData.rows) {
      for (const col of row.columns) {
        if (col.id === id) return col.id;
        if (col.blocks.find(b => b.id === id)) return col.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setNewspaperData((prev: any) => {
      const newRows = [...prev.rows];
      let activeItem: any;
      
      newRows.forEach(row => {
        row.columns.forEach(col => {
          if (col.id === activeContainer) {
            const idx = col.blocks.findIndex((b: any) => b.id === active.id);
            if (idx !== -1) {
              activeItem = { ...col.blocks[idx] };
              col.blocks.splice(idx, 1);
            }
          }
        });
      });

      newRows.forEach(row => {
        row.columns.forEach(col => {
          if (col.id === overContainer) {
            const overIndex = col.blocks.findIndex((b: any) => b.id === over.id);
            const insertIndex = overIndex >= 0 ? overIndex : col.blocks.length;
            col.blocks.splice(insertIndex, 0, activeItem);
          }
        });
      });

      return { ...prev, rows: newRows };
    });
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return;
    }

    if (active.id !== over.id) {
      setNewspaperData((prev: any) => {
        const newRows = [...prev.rows];
        newRows.forEach(row => {
          row.columns.forEach(col => {
            if (col.id === activeContainer) {
              const oldIndex = col.blocks.findIndex((b: any) => b.id === active.id);
              const newIndex = col.blocks.findIndex((b: any) => b.id === over.id);
              const [movedItem] = col.blocks.splice(oldIndex, 1);
              col.blocks.splice(newIndex, 0, movedItem);
            }
          });
        });
        return { ...prev, rows: newRows };
      });
    }
  };
`;

content = content.replace(
  '  return (\n    <main',
  handlersCode + '\n  return (\n    <main'
);

// 4. Wrap with DndContext
content = content.replace(
  '<div className="space-y-6">\n                 {newspaperData.rows.map((row) => {',
  '<DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>\n             <div className="space-y-6">\n                 {newspaperData.rows.map((row) => {'
);
content = content.replace(
  '             </div>\n\n             {/* Bottom Scribe footer mark for high fidelity */}',
  '             </div>\n             </DndContext>\n\n             {/* Bottom Scribe footer mark for high fidelity */}'
);

// 5. Wrap with SortableContext
content = content.replace(
  '{col.blocks.map((block) => {',
  '<SortableContext items={col.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>\n                        {col.blocks.map((block) => {'
);

// 6. Replace Block Div with SortableBlock
const oldBlockDivRegex = /<div\s+key=\{block\.id\}\s+onClick=\{[^}]+\}\s+className=\{`group\/block[^`]+`\}\s+>/;
content = content.replace(oldBlockDivRegex, (match) => {
  return `<SortableBlock
                                  key={block.id}
                                  id={block.id}
                                  isSelected={isSelected}
                                  onSelect={(e) => {
                                    e.stopPropagation();
                                    selectBlockAndContext(block.id, col.id, row.id);
                                  }}
                                >`;
});

// 7. Close SortableBlock and SortableContext
content = content.replace(
  '                            </div>\n                          );\n                        })}',
  '                                </SortableBlock>\n                              );\n                            })}\n                          </SortableContext>'
);

fs.writeFileSync(previewPath, content);
console.log('Successfully injected DndKit into NewspaperPreview.tsx');
