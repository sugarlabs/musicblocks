import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Play, Square } from 'lucide-react';
import { DroppedBlock } from './Block';

export default function Workspace({ blocks, onRemove, onUpdate, isPlaying, onPlay, onStop }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'workspace-canvas',
    disabled: isPlaying
  });

  return (
    <div className="workspace">
      <div className="workspace-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Composition</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
           {!isPlaying ? (
             <button 
               className="play-btn" 
               onClick={onPlay} 
               disabled={blocks.length === 0}
               style={{
                 display: 'flex', alignItems: 'center', gap: '8px',
                 backgroundColor: blocks.length === 0 ? '#333' : '#69f0ae',
                 color: blocks.length === 0 ? '#666' : '#000',
                 border: 'none', padding: '10px 20px', borderRadius: '8px',
                 fontSize: '1rem', fontWeight: 'bold', cursor: blocks.length === 0 ? 'not-allowed' : 'pointer',
                 transition: 'all 0.2s'
               }}
             >
               <Play size={20} fill={blocks.length === 0 ? "none" : "currentColor"} /> Play
             </button>
           ) : (
             <button 
               className="stop-btn" 
               onClick={onStop}
               style={{
                 display: 'flex', alignItems: 'center', gap: '8px',
                 backgroundColor: '#ff5252', color: '#fff',
                 border: 'none', padding: '10px 20px', borderRadius: '8px',
                 fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                 transition: 'all 0.2s', boxShadow: '0 0 15px rgba(255, 82, 82, 0.4)'
               }}
             >
               <Square size={20} fill="currentColor" /> Stop
             </button>
           )}
        </div>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`workspace-canvas ${isOver ? 'is-dragging-over' : ''}`}
        style={{ 
          opacity: isPlaying ? 0.7 : 1, 
          pointerEvents: isPlaying ? 'none' : 'auto',
          transition: 'opacity 0.3s'
        }}
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
