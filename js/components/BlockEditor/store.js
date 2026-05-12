import { create } from "zustand";

let uid = 1;
const newId = () => `block-${uid++}`;

export const BLOCK_DEFS = {
    tempo: {
        type: "tempo",
        label: "Tempo",
        icon: "♩",
        defaultProps: { bpm: 120 },
        canContain: false
    },
    note: {
        type: "note",
        label: "Note",
        icon: "♪",
        defaultProps: { pitch: "C4" },
        canContain: false
    },
    duration: {
        type: "duration",
        label: "Duration",
        icon: "◷",
        defaultProps: { beats: 1 },
        canContain: false
    },
    repeat: {
        type: "repeat",
        label: "Repeat Loop",
        icon: "↺",
        defaultProps: { count: 4 },
        canContain: true
    }
};

export const createBlock = type => ({
    id: newId(),
    type,
    props: { ...BLOCK_DEFS[type].defaultProps },
    children: BLOCK_DEFS[type].canContain ? [] : null
});

function removeFromTree(blocks, id) {
    let removed = null;
    const tree = blocks
        .filter(b => {
            if (b.id === id) {
                removed = b;
                return false;
            }
            return true;
        })
        .map(b => {
            if (b.children) {
                const res = removeFromTree(b.children, id);
                if (res.removed) {
                    removed = res.removed;
                    return { ...b, children: res.tree };
                }
            }
            return b;
        });
    return { tree, removed };
}

function insertIntoTree(blocks, parentId, index, block) {
    if (!parentId) {
        const r = [...blocks];
        r.splice(index, 0, block);
        return r;
    }
    return blocks.map(b => {
        if (b.id === parentId) {
            const kids = [...(b.children || [])];
            kids.splice(index, 0, block);
            return { ...b, children: kids };
        }
        if (b.children)
            return { ...b, children: insertIntoTree(b.children, parentId, index, block) };
        return b;
    });
}

function updateInTree(blocks, id, props) {
    return blocks.map(b => {
        if (b.id === id) return { ...b, props: { ...b.props, ...props } };
        if (b.children) return { ...b, children: updateInTree(b.children, id, props) };
        return b;
    });
}

function deleteFromTree(blocks, id) {
    return blocks
        .filter(b => b.id !== id)
        .map(b => {
            if (b.children) return { ...b, children: deleteFromTree(b.children, id) };
            return b;
        });
}

export const useBlockStore = create((set, get) => ({
    blocks: [
        { ...createBlock("tempo"), props: { bpm: 120 } },
        {
            ...createBlock("repeat"),
            props: { count: 4 },
            children: [
                { ...createBlock("note"), props: { pitch: "C4" } },
                { ...createBlock("duration"), props: { beats: 1 } }
            ]
        }
    ],

    addBlock: type => set(s => ({ blocks: [...s.blocks, createBlock(type)] })),

    moveBlock: (dragId, targetParentId, targetIndex) =>
        set(s => {
            const { tree, removed } = removeFromTree(s.blocks, dragId);
            if (!removed) return s;
            return { blocks: insertIntoTree(tree, targetParentId, targetIndex, removed) };
        }),

    insertBlock: (type, parentId, index) =>
        set(s => ({
            blocks: insertIntoTree(s.blocks, parentId, index, createBlock(type))
        })),

    updateProps: (id, props) => set(s => ({ blocks: updateInTree(s.blocks, id, props) })),

    deleteBlock: id => set(s => ({ blocks: deleteFromTree(s.blocks, id) })),

    clearAll: () => set({ blocks: [] }),

    exportJSON: () => {
        const serialize = blocks =>
            blocks.map(b => ({
                type: b.type,
                ...b.props,
                ...(b.children !== null ? { children: serialize(b.children) } : {})
            }));
        return JSON.stringify(serialize(get().blocks), null, 2);
    }
}));
