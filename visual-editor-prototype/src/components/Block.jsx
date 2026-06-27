import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { X, Music, Clock, Repeat, Activity } from 'lucide-react';
import { BLOCK_TYPES } from '../constants';

const ICONS = {
  [BLOCK_TYPES.NOTE]: <Music size={18} />,
  [BLOCK_TYPES.RHYTHM]: <Clock size={18} />,
  [BLOCK_TYPES.REPEAT]: <Repeat size={18} />,
  [BLOCK_TYPES.TEMPO]: <Activity size={18} />
};

export function DroppedBlock({ block, onRemove, onUpdate, errors }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleChange = (field, value) => {
    onUpdate(block.id, { [field]: value });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`dropped-block block-${block.type} sortable-item ${errors?.[block.id] ? 'block-error' : ''}`}
      {...attributes}
      {...listeners}
    >
      {errors?.[block.id] && (
        <div className="error-tooltip">
          {errors[block.id]}
        </div>
      )}
      <div className="flex-center">
        {ICONS[block.type]}
        <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.9rem' }}>
          {block.type}
        </span>
      </div>

      <div className="block-controls" onPointerDown={(e) => e.stopPropagation()}>
        {block.type === BLOCK_TYPES.NOTE && (
          <select 
            className="block-input" 
            value={block.data.pitch} 
            onChange={(e) => handleChange('pitch', e.target.value)}
          >
            <option value="C4">C4</option>
            <option value="D4">D4</option>
            <option value="E4">E4</option>
            <option value="F4">F4</option>
            <option value="G4">G4</option>
            <option value="A4">A4</option>
            <option value="B4">B4</option>
          </select>
        )}
        
        {block.type === BLOCK_TYPES.RHYTHM && (
          <select 
            className="block-input" 
            value={block.data.duration} 
            onChange={(e) => handleChange('duration', e.target.value)}
          >
            <option value="1">Whole</option>
            <option value="1/2">Half</option>
            <option value="1/4">Quarter</option>
            <option value="1/8">Eighth</option>
          </select>
        )}

        {block.type === BLOCK_TYPES.TEMPO && (
          <div className="flex-center">
            <input 
              type="number" 
              className="block-input" 
              value={block.data.bpm} 
              onChange={(e) => handleChange('bpm', parseInt(e.target.value) || 120)}
              style={{ width: '60px' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>BPM</span>
          </div>
        )}

        {block.type === BLOCK_TYPES.REPEAT && (
          <div className="flex-center">
            <input 
              type="number" 
              className="block-input" 
              value={block.data.times} 
              onChange={(e) => handleChange('times', parseInt(e.target.value) || 1)}
              style={{ width: '50px' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>times</span>
          </div>
        )}
      </div>

      {block.type === BLOCK_TYPES.REPEAT && (
        <NestedDropZone parentId={block.id} childrenBlocks={block.data.children} onRemove={onRemove} onUpdate={onUpdate} errors={errors} />
      )}

      <button 
        className="remove-btn" 
        onClick={() => onRemove(block.id)}
        onPointerDown={(e) => e.stopPropagation()}
        title="Remove block"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function NestedDropZone({ parentId, childrenBlocks, onRemove, onUpdate, errors }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `nested-${parentId}`
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`nested-canvas ${isOver ? 'is-dragging-over' : ''}`}
      onPointerDown={(e) => e.stopPropagation()} // Prevent dragging parent when clicking nested area
    >
      {(!childrenBlocks || childrenBlocks.length === 0) ? (
        <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
          Drop blocks here to repeat
        </div>
      ) : (
        childrenBlocks.map(child => (
          <DroppedBlock key={child.id} block={child} onRemove={onRemove} onUpdate={onUpdate} errors={errors} />
        ))
      )}
    </div>
  );
}
