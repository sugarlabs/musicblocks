import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Music, Clock, Repeat, Activity } from 'lucide-react';
import { BLOCK_TEMPLATES, BLOCK_TYPES } from '../constants';

const ICONS = {
  [BLOCK_TYPES.NOTE]: <Music size={18} />,
  [BLOCK_TYPES.RHYTHM]: <Clock size={18} />,
  [BLOCK_TYPES.REPEAT]: <Repeat size={18} />,
  [BLOCK_TYPES.TEMPO]: <Activity size={18} />
};

function PaletteItem({ template }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${template.type}`,
    data: {
      fromPalette: true,
      template
    }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`palette-item block-${template.type}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {ICONS[template.type]}
      <span>{template.label}</span>
    </div>
  );
}

export default function BlockPalette() {
  return (
    <div className="palette">
      <h2>Blocks</h2>
      {BLOCK_TEMPLATES.map((template) => (
        <PaletteItem key={template.type} template={template} />
      ))}
    </div>
  );
}
