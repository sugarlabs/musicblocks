import React from "react";
import { useBlockStore } from "./store";

const PITCHES = [
    "C3",
    "D3",
    "E3",
    "F3",
    "G3",
    "A3",
    "B3",
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "D5",
    "E5"
];

export default function BlockPropertyEditor({ block, color }) {
    const updateProps = useBlockStore(s => s.updateProps);
    const { bg, border, text } = color;

    const inputStyle = {
        border: `1px solid ${border}`,
        background: bg,
        color: text,
        fontWeight: 600,
        borderRadius: 6,
        padding: "2px 6px",
        fontSize: 12,
        marginLeft: 6
    };

    if (block.type === "tempo")
        return (
            <div style={{ display: "flex", alignItems: "center" }}>
                <input
                    type="number"
                    min={40}
                    max={240}
                    value={block.props.bpm}
                    style={{ ...inputStyle, width: 58 }}
                    onChange={e => updateProps(block.id, { bpm: Number(e.target.value) })}
                />
                <span style={{ fontSize: 11, color: text, opacity: 0.75, marginLeft: 4 }}>BPM</span>
            </div>
        );

    if (block.type === "note")
        return (
            <select
                value={block.props.pitch}
                style={{ ...inputStyle, padding: "2px 4px" }}
                onChange={e => updateProps(block.id, { pitch: e.target.value })}
            >
                {PITCHES.map(p => (
                    <option key={p}>{p}</option>
                ))}
            </select>
        );

    if (block.type === "duration")
        return (
            <div style={{ display: "flex", alignItems: "center" }}>
                <input
                    type="number"
                    min={0.25}
                    max={8}
                    step={0.25}
                    value={block.props.beats}
                    style={{ ...inputStyle, width: 55 }}
                    onChange={e => updateProps(block.id, { beats: Number(e.target.value) })}
                />
                <span style={{ fontSize: 11, color: text, opacity: 0.75, marginLeft: 4 }}>
                    beats
                </span>
            </div>
        );

    if (block.type === "repeat")
        return (
            <div style={{ display: "flex", alignItems: "center" }}>
                <input
                    type="number"
                    min={1}
                    max={32}
                    value={block.props.count}
                    style={{ ...inputStyle, width: 48 }}
                    onChange={e => updateProps(block.id, { count: Number(e.target.value) })}
                />
                <span style={{ fontSize: 11, color: text, opacity: 0.75, marginLeft: 4 }}>×</span>
            </div>
        );

    return null;
}
