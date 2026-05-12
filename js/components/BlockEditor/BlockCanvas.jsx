import React from "react";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBlockStore } from "./store";
import BlockItem from "./BlockItem";

export default function BlockCanvas({ blocks, parentId = null, nested = false, borderColor }) {
    const { moveBlock, deleteBlock } = useBlockStore();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = blocks.findIndex(b => b.id === active.id);
        const newIndex = blocks.findIndex(b => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        moveBlock(active.id, parentId, newIndex);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div
                    style={{
                        minHeight: nested ? 52 : 400,
                        background: nested ? "rgba(255,255,255,0.5)" : "transparent",
                        border: nested ? `1.5px dashed ${borderColor}` : "none",
                        borderRadius: nested ? 8 : 0,
                        padding: nested ? "6px 8px" : "0"
                    }}
                >
                    {blocks.length === 0 && !nested && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                gap: 8,
                                opacity: 0.4,
                                minHeight: 300,
                                pointerEvents: "none"
                            }}
                        >
                            <span style={{ fontSize: 40 }}>🎼</span>
                            <span style={{ fontSize: 13 }}>
                                Drag blocks here to start composing
                            </span>
                        </div>
                    )}
                    {blocks.length === 0 && nested && (
                        <div
                            style={{
                                fontSize: 11,
                                opacity: 0.5,
                                textAlign: "center",
                                padding: "10px 0"
                            }}
                        >
                            drop blocks inside loop
                        </div>
                    )}
                    {blocks.map(block => (
                        <BlockItem
                            key={block.id}
                            block={block}
                            parentId={parentId}
                            onDelete={deleteBlock}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
