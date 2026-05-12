import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BLOCK_DEFS } from "./store";
import BlockPropertyEditor from "./BlockPropertyEditor";
import BlockCanvas from "./BlockCanvas";

const COLORS = {
    tempo: { bg: "#EEEDFE", border: "#534AB7", text: "#3C3489" },
    note: { bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
    duration: { bg: "#E6F1FB", border: "#185FA5", text: "#0C447C" },
    repeat: { bg: "#FAECE7", border: "#993C1D", text: "#712B13" }
};

export default function BlockItem({ block, parentId, onDelete }) {
    const def = BLOCK_DEFS[block.type];
    const col = COLORS[block.type];

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { parentId }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div
                style={{
                    background: col.bg,
                    border: `2px solid ${col.border}`,
                    borderRadius: def.canContain ? 12 : 10,
                    padding: def.canContain ? "10px 12px 8px" : "8px 12px",
                    marginBottom: 4,
                    userSelect: "none"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        {...listeners}
                        style={{ cursor: "grab", fontSize: 20, lineHeight: 1 }}
                        title="Drag to reorder"
                    >
                        {def.icon}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: col.text }}>
                        {def.label}
                    </span>
                    <BlockPropertyEditor block={block} color={col} />
                    <div style={{ flex: 1 }} />
                    <button
                        onClick={() => onDelete(block.id)}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: 18,
                            color: col.text,
                            opacity: 0.5,
                            cursor: "pointer",
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>

                {def.canContain && (
                    <div style={{ marginTop: 8 }}>
                        <BlockCanvas
                            blocks={block.children || []}
                            parentId={block.id}
                            nested
                            borderColor={col.border}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
