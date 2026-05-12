import React from "react";
import { useBlockStore, BLOCK_DEFS } from "./store";

const COLORS = {
    tempo: { bg: "#EEEDFE", border: "#534AB7", text: "#3C3489" },
    note: { bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
    duration: { bg: "#E6F1FB", border: "#185FA5", text: "#0C447C" },
    repeat: { bg: "#FAECE7", border: "#993C1D", text: "#712B13" }
};

const SUBTITLES = {
    tempo: "Sets the BPM",
    note: "Pick a pitch",
    duration: "Beat length",
    repeat: "Loops blocks"
};

export default function BlockPalette() {
    const addBlock = useBlockStore(s => s.addBlock);

    return (
        <aside
            style={{
                width: 164,
                flexShrink: 0,
                background: "#fff",
                borderRight: "0.5px solid #e0ddd6",
                padding: "14px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 8
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "#666",
                    marginBottom: 4
                }}
            >
                Block Palette
            </div>

            {Object.values(BLOCK_DEFS).map(def => {
                const col = COLORS[def.type];
                return (
                    <div
                        key={def.type}
                        draggable
                        onClick={() => addBlock(def.type)}
                        title={`Click or drag to add ${def.label}`}
                        style={{
                            background: col.bg,
                            border: `1.5px solid ${col.border}`,
                            borderRadius: 10,
                            padding: "9px 10px",
                            cursor: "grab",
                            userSelect: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 9
                        }}
                    >
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{def.icon}</span>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: col.text }}>
                                {def.label}
                            </div>
                            <div style={{ fontSize: 10, color: col.text, opacity: 0.65 }}>
                                {SUBTITLES[def.type]}
                            </div>
                        </div>
                    </div>
                );
            })}

            <p
                style={{
                    fontSize: 10,
                    color: "#666",
                    lineHeight: 1.6,
                    marginTop: 8,
                    opacity: 0.7
                }}
            >
                Click a block to add it. Drag to reorder on canvas.
            </p>
        </aside>
    );
}
