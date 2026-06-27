import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DroppedBlock } from './Block';

export default function Workspace({ blocks, onRemove, onUpdate }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'workspace-canvas',
  });

  return (
    <div className="workspace">
      <div className="workspace-header">
        <h1>Composition</h1>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`workspace-canvas ${isOver ? 'is-dragging-over' : ''}`}
      >
        <SortableContext 
          items={blocks.map(b => b.id)} 
          strategy={verticalListSortingStrategy}
        >
          {blocks.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
              Drag blocks here to start building...
            </div>
          ) : (
            blocks.map(block => (
              <DroppedBlock 
                key={block.id} 
                block={block} 
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
