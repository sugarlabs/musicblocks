import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';

import { BLOCK_TEMPLATES, BLOCK_TYPES } from './constants';
import BlockPalette from './components/BlockPalette';
import Workspace from './components/Workspace';
import { DroppedBlock } from './components/Block';
import { playSequence, stopPlayback } from './lib/AudioEngine';

export default function App() {
  const [blocks, setBlocks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    if (isPlaying) return;
    const { active } = event;
    setActiveId(active.id);
    
    // Check if dragging from palette
    if (active.data.current?.fromPalette) {
      setActiveItem(active.data.current.template);
    } else {
      // Dragging existing block
      const existingBlock = blocks.find(b => b.id === active.id);
      setActiveItem(existingBlock);
    }
  };

  const handleDragOver = (event) => {
    // Handling nested drop zones could go here if we do complex tree traversal
  };

  const handleDragEnd = (event) => {
    if (isPlaying) return;
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const isFromPalette = active.data.current?.fromPalette;
    
    if (isFromPalette) {
      // Create new block
      const template = active.data.current.template;
      const newBlock = {
        id: uuidv4(),
        type: template.type,
        data: { ...template.defaultData }
      };

      if (over.id === 'workspace-canvas') {
        setBlocks((blocks) => [...blocks, newBlock]);
      } else {
        // Find if we are dropping over an existing block to insert before/after or inside
        const overIndex = blocks.findIndex(b => b.id === over.id);
        if (overIndex !== -1) {
          const newBlocks = [...blocks];
          newBlocks.splice(overIndex + 1, 0, newBlock);
          setBlocks(newBlocks);
        } else if (String(over.id).startsWith('nested-')) {
          // Prevent invalid connections: e.g. Tempo inside Note is handled by only having DropZones on REPEAT
          const parentId = String(over.id).replace('nested-', '');
          setBlocks(blocks => blocks.map(b => {
             if (b.id === parentId && b.type === BLOCK_TYPES.REPEAT) {
                 return { ...b, data: { ...b.data, children: [...(b.data.children || []), newBlock] } };
             }
             return b;
          }));
        }
      }
    } else {
      // Reordering existing blocks
      if (active.id !== over.id) {
        setBlocks((items) => {
          const oldIndex = items.findIndex(item => item.id === active.id);
          const newIndex = items.findIndex(item => item.id === over.id);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex);
          }
          return items;
        });
      }
    }
  };

  const removeBlock = (id) => {
    if (isPlaying) return;
    setBlocks(blocks => {
       const removeRecursive = (list) => {
          return list.filter(b => b.id !== id).map(b => {
             if (b.data?.children) {
                 return { ...b, data: { ...b.data, children: removeRecursive(b.data.children) }};
             }
             return b;
          });
       };
       return removeRecursive(blocks);
    });
  };

  const updateBlockData = (id, newData) => {
     setBlocks(blocks => {
       const updateRecursive = (list) => {
          return list.map(b => {
             if (b.id === id) {
                 return { ...b, data: { ...b.data, ...newData } };
             }
             if (b.data?.children) {
                 return { ...b, data: { ...b.data, children: updateRecursive(b.data.children) }};
             }
             return b;
          });
       };
       return updateRecursive(blocks);
    });
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.4' } }
    })
  };

  const handlePlay = () => {
    setIsPlaying(true);
    playSequence(blocks, () => {
      setIsPlaying(false);
    }).catch(e => {
      console.error(e);
      setIsPlaying(false);
    });
  };

  const handleStop = () => {
    stopPlayback();
    setIsPlaying(false);
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="app-container">
        <div style={{ opacity: isPlaying ? 0.5 : 1, pointerEvents: isPlaying ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
          <BlockPalette />
        </div>
        <Workspace 
          blocks={blocks} 
          onRemove={removeBlock} 
          onUpdate={updateBlockData} 
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onStop={handleStop}
        />
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeItem ? (
          <div className={`dropped-block block-${activeItem.type} drag-overlay`}>
             <span style={{ fontWeight: 'bold' }}>{activeItem.type.toUpperCase()}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
