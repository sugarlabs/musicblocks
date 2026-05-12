import React, { useState } from "react";
import { useBlockStore } from "./store";
import BlockPalette from "./BlockPalette";
import BlockCanvas from "./BlockCanvas";

const btnStyle = {
    background: "none",
    border: "0.5px solid #ccc",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
    color: "#666"
};

export default function BlockEditor() {
    const { blocks, clearAll, exportJSON } = useBlockStore();
    const [showJSON, setShowJSON] = useState(false);
    const json = exportJSON();

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                fontFamily: "system-ui, sans-serif",
                background: "#f5f4f0"
            }}
        >
            {/* Top toolbar */}
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 18px",
                    background: "#fff",
                    borderBottom: "0.5px solid #e0ddd6",
                    flexShrink: 0
                }}
            >
                <span style={{ fontSize: 15, fontWeight: 500 }}>🎵 Music Block Editor</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => setShowJSON(v => !v)} style={btnStyle}>
                    {showJSON ? "Hide JSON" : "View JSON"}
                </button>
                <button
                    onClick={() => {
                        navigator.clipboard?.writeText(json);
                    }}
                    style={btnStyle}
                >
                    Copy JSON
                </button>
                <button onClick={clearAll} style={{ ...btnStyle, color: "#D85A30" }}>
                    Clear Canvas
                </button>
            </header>

            {/* Body */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Left: Palette */}
                <BlockPalette />

                {/* Center: Canvas */}
                <main style={{ flex: 1, padding: 16, overflowY: "auto" }}>
                    <BlockCanvas blocks={blocks} parentId={null} />
                </main>

                {/* Right: JSON panel */}
                {showJSON && (
                    <aside
                        style={{
                            width: 260,
                            flexShrink: 0,
                            background: "#fff",
                            borderLeft: "0.5px solid #e0ddd6",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <div
                            style={{
                                padding: "10px 14px",
                                borderBottom: "0.5px solid #e0ddd6",
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#666"
                            }}
                        >
                            Block Structure (JSON)
                        </div>
                        <pre
                            style={{
                                flex: 1,
                                overflow: "auto",
                                padding: "12px 14px",
                                fontSize: 10,
                                lineHeight: 1.7,
                                fontFamily: "monospace",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                color: "#333"
                            }}
                        >
                            {json}
                        </pre>
                    </aside>
                )}
            </div>

            {/* Status bar */}
            <footer
                style={{
                    padding: "5px 16px",
                    background: "#fff",
                    borderTop: "0.5px solid #e0ddd6",
                    fontSize: 11,
                    color: "#666",
                    display: "flex",
                    gap: 16
                }}
            >
                <span>
                    {blocks.length} top-level block{blocks.length !== 1 ? "s" : ""}
                </span>
                <span style={{ marginLeft: "auto" }}>
                    Click palette to add · Drag to reorder · Edit values inline
                </span>
            </footer>
        </div>
    );
}
