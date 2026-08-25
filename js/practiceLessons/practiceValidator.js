/* exported PracticeValidator */

function getActivity() {
    if (window.ActivityContext && typeof window.ActivityContext.getActivity === "function") {
        try {
            const activity = window.ActivityContext.getActivity();
            if (activity?.blocks) {
                return activity;
            }
        } catch (e) {
            // Activity may not be initialized yet.
        }
    }

    return null;
}

// Loop clamps hold their body in a different connection slot depending on the block.
const LOOP_BODY_CONNECTION = new Map([
    ["repeat", 2],
    ["forever", 1]
]);
// A signal ring counts as built once the conductor and at least three drum mice exist.
const RING_MOUSE_MINIMUM = 4;
// The three phrases Phrase Maker exports for Twinkle Twinkle, in solfege at octave 4.
const TWINKLE_SECTIONS = new Map([
    ["A1", ["do4", "do4", "sol4", "sol4", "la4", "la4", "sol4"]],
    ["A2", ["fa4", "fa4", "mi4", "mi4", "re4", "re4", "do4"]],
    ["B", ["sol4", "sol4", "fa4", "fa4", "mi4", "mi4", "re4"]]
]);
// The song's form, the bread of the sandwich on the outside and the filling in the middle.
const TWINKLE_SONG_FORM = ["A1", "A2", "B", "B", "A1", "A2"];

const PracticeValidator = {
    validate(problem) {
        if (problem?.expected?.circularRhythmRing) {
            return this.validateCircularRhythmRing();
        }

        if (problem?.expected?.twinklePhraseMaker) {
            return this.validateTwinklePhraseMaker();
        }

        if (problem?.expected?.animatedPolyrhythm) {
            return this.validateAnimatedPolyrhythm();
        }

        if (problem?.expected?.basicShapeSet) {
            return this.validateBasicShapeSet();
        }

        if (problem?.expected?.phraseMakerWorkflow) {
            return this.validatePhraseMakerLesson(problem);
        }

        if (problem?.expected?.rhythmMakerWorkflow) {
            return this.validateRhythmMakerWorkflow();
        }

        if (problem?.expected?.metronomeWorkflow) {
            return this.validateMetronome();
        }

        if (problem?.expected?.pianoKeysWorkflow) {
            return this.validatePianoKeys();
        }

        if (!problem?.expected?.pattern) return false;

        return this.validatePattern(problem.expected.pattern);
    },

    validatePattern(expectedPattern) {
        const sequence = this.getCurrentSequence();
        return this.matchesPattern(sequence, expectedPattern);
    },

    matchesPattern(sequence, expectedPattern) {
        if (JSON.stringify(sequence) === JSON.stringify(expectedPattern)) {
            return true;
        }

        if (sequence.length !== expectedPattern.length) return false;

        const expectedToActual = {};
        const actualToExpected = {};

        for (let i = 0; i < expectedPattern.length; i++) {
            const expected = expectedPattern[i];
            const actual = sequence[i];

            if (!actual) return false;

            if (expectedToActual[expected] && expectedToActual[expected] !== actual) {
                return false;
            }

            if (actualToExpected[actual] && actualToExpected[actual] !== expected) {
                return false;
            }

            expectedToActual[expected] = actual;
            actualToExpected[actual] = expected;
        }

        return true;
    },

    getCurrentSequence() {
        const blockList = this.getBlockList();
        const startBlock = Object.values(blockList).find(
            block => block?.name === "start" && !block.trash
        );
        if (!startBlock) return [];

        return this.extractPatternSequence(startBlock.connections?.[1], blockList);
    },

    assessBadges(problem) {
        if (!Array.isArray(problem?.badges)) return [];

        return problem.badges.filter(badge => this.hasBadgeEvidence(problem, badge.criterion));
    },

    hasBadgeEvidence(problem, criterion) {
        switch (criterion) {
            case "completePattern":
                return this.validate(problem);
            case "completeRhythmWorkflow":
                return this.validateRhythmMakerWorkflow();
            case "completePhraseWorkflow":
                return this.validatePhraseMakerLesson(problem);
            case "completeBasicShapeSet":
                return this.validateBasicShapeSet();
            case "completeAnimatedPolyrhythm":
                return this.validateAnimatedPolyrhythm();
            case "completedTwoPartForm":
                return this.validateTwoPartForm();
            case "usedRepeatLoop":
                return this.hasConnectedBlockNamed(["repeat"]);
            case "changedPhraseDrums":
                return this.hasChangedPhraseDrums();
            case "createdPhraseVariation":
                return this.hasCreatedPhraseVariation();
            case "renamedChunks":
                return this.hasRenamedChunks(problem.expected?.chunkNames);
            case "changedOctave":
                return this.hasChangedPitchOctave(problem.expected?.octaves);
            case "usedTranspose":
                return this.hasConnectedBlockNamed([
                    "settransposition",
                    "setscalartransposition",
                    "setratio",
                    "octave"
                ]);
            case "createdVariation":
                return this.hasCreatedVariation(problem.expected?.pattern);
            case "changedRhythmLength":
                return this.hasChangedRhythmLength();
            case "changedDrumSound":
                return this.hasChangedDrumSound();
            case "savedDrumMachine":
                return this.hasSavedDrumMachineAction();
            case "usedGeometryDivision":
                return this.hasConnectedBlockNamed(["divide"]);
            case "usedBoxVariable":
                return this.hasConnectedBlockNamed([
                    "namedbox",
                    "storein",
                    "storein2",
                    "box",
                    "box1",
                    "box2"
                ]);
            case "changedShapeColor":
                return this.hasConnectedBlockNamed(["setcolor", "sethue", "setshade", "setgrey"]);
            case "createdExtraPolygon":
                return this.hasPolygonOutsideSides(new Set([3, 4, 5]));
            case "usedDupletTripletRhythms":
                return this.hasRhythmDivisors(new Set([2, 3]));
            case "createdExtraPolyrhythmDivisor":
                return this.hasExtraRhythmDivisor(new Set([2, 3]));
            case "usedAvatarAnimation":
                return this.hasConnectedBlockNamed(["turtleshell"]);
            case "usedEveryNoteAction":
                return this.hasConnectedBlockNamed(["everybeatdo"]);
            case "usedNoteValueMotion":
                return this.hasConnectedBlockNamed([
                    "turtlenote",
                    "turtlenote2",
                    "turtleelapsednotes",
                    "elapsednotes"
                ]);
            case "createdPitchPolyrhythm":
                return this.hasConnectedBlockNamed(["pitch", "settimbre"]);
            case "changedAnimationTurn":
                return this.hasConnectedBlockNamed(["right", "left", "setheading"]);
            case "completeCircularRhythmRing":
                return this.validateCircularRhythmRing();
            case "usedOneMinusToggle":
                return this.hasToggleStore();
            case "playedRingDrum":
                return this.hasConnectedBlockNamed(["playdrum", "setdrum"]);
            case "builtMouseRing":
                return this.countStartBlocks() >= RING_MOUSE_MINIMUM;
            case "readBoxValue":
                return this.hasConnectedBlockNamed(["namedbox", "box", "box1", "box2"]);
            case "completeTwinkleForm":
                return this.validateTwinklePhraseMaker();
            case "completePianoKeys":
                return this.validatePianoKeys();
            case "spacedTheKeys":
                return this.hasConnectedBlockNamed(["setxy", "setxyturtle"]);
            case "namedTheKeys":
                return this.hasConnectedBlockNamed([
                    "setturtlename",
                    "setturtlename2",
                    "turtlename"
                ]);
            case "completeMetronome":
                return this.validateMetronome();
            case "swungThePendulum":
                return this.hasConnectedBlockNamed(["setheading"]);
            case "changedTempo":
                return this.hasConnectedBlockNamed([
                    "setmasterbpm",
                    "setmasterbpm2",
                    "setbpm",
                    "setbpm2",
                    "setbpm3"
                ]);
            case "setTheMeter":
                return this.hasConnectedBlockNamed(["meter"]);
            case "paintedTheBeat":
                return this.hasConnectedBlockNamed(["beatvalue"]);
            case "addedHarmonyVoice":
                return this.countStartBlocks() >= 2;
            default:
                return false;
        }
    },

    extractPatternSequence(startId, blockList) {
        const sequence = [];
        let currentId = this.unwrapHiddenFlow(startId, blockList);
        let guard = 0;

        while (currentId && guard < 100) {
            const block = blockList[currentId];
            if (!block || block.trash) break;

            if (block.name === "nameddo") {
                const actionName = block.overrideName || block.privateData || block.value;
                if (actionName) {
                    sequence.push(actionName);
                }
            } else if (block.name === "repeat") {
                const timesId = block.connections?.[1];
                const times = Number(blockList[timesId]?.value) || 1;
                const body = this.extractPatternSequence(block.connections?.[2], blockList);

                for (let i = 0; i < times; i++) {
                    sequence.push(...body);
                }
            }

            currentId = this.getNextFlowId(block, blockList);
            guard++;
        }

        return sequence;
    },

    hasRenamedChunks(chunkNames) {
        if (!Array.isArray(chunkNames)) return false;

        const originalNames = new Set(chunkNames);
        const blockList = this.getBlockList();

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "action") return false;

            const label = this.getActionName(block, blockList);
            return label && !originalNames.has(label);
        });
    },

    getActionName(actionBlock, blockList) {
        const labelId = actionBlock.connections?.[1];
        const labelBlock = blockList[labelId];

        return labelBlock?.value || labelBlock?.privateData || labelBlock?.overrideName || "";
    },

    hasChangedPitchOctave(expectedOctaves) {
        if (Array.isArray(expectedOctaves)) {
            const currentOctaves = this.getPitchOctaves();
            const baselineOctaves = [...expectedOctaves].sort((a, b) => a - b);
            return JSON.stringify(currentOctaves) !== JSON.stringify(baselineOctaves);
        }

        return this.getPitchOctaves().some(octave => octave !== 4);
    },

    getPitchOctaves() {
        const blockList = this.getBlockList();
        const octaves = [];

        Object.values(blockList).forEach(block => {
            if (!block || block.trash || block.name !== "pitch") return;

            const octaveId = block.connections?.[2];
            const octaveBlock = blockList[octaveId];

            if (octaveBlock?.name === "number") {
                octaves.push(Number(octaveBlock.value));
            }
        });

        return octaves.sort((a, b) => a - b);
    },

    hasBlockNamed(names) {
        const blockNames = new Set(names);
        const blockList = this.getBlockList();

        return Object.values(blockList).some(
            block => block && !block.trash && blockNames.has(block.name)
        );
    },

    hasConnectedBlockNamed(names) {
        const blockNames = new Set(names);
        const blockList = this.getBlockList();

        return Object.values(blockList).some(
            block =>
                block &&
                !block.trash &&
                blockNames.has(block.name) &&
                block.connections?.[0] !== null &&
                block.connections?.[0] !== undefined
        );
    },

    hasCreatedVariation(expectedPattern) {
        if (!Array.isArray(expectedPattern)) return false;

        const sequence = this.getCurrentSequence();
        if (sequence.length <= expectedPattern.length) return false;

        return this.matchesPattern(sequence.slice(0, expectedPattern.length), expectedPattern);
    },

    validateRhythmMakerWorkflow() {
        const blockList = this.getBlockList();
        const exportedActions = this.getRhythmMakerActionNames(blockList);
        if (exportedActions.size === 0) return false;

        const referencedActions = this.getStartActionReferences(blockList);
        return referencedActions.some(actionName => exportedActions.has(actionName));
    },

    getRhythmMakerActionNames(blockList) {
        const names = new Set();

        Object.values(blockList).forEach(block => {
            if (!block || block.trash || block.name !== "action") return;

            const actionName = this.getActionName(block, blockList);
            if (!actionName) return;

            if (this.actionContainsBlockNamed(block, blockList, ["rhythm2", "stuplet"])) {
                names.add(actionName);
            }
        });

        return names;
    },

    getStartActionReferences(blockList) {
        const startBlock = Object.values(blockList).find(
            block => block?.name === "start" && !block.trash
        );
        if (!startBlock) return [];

        return this.extractPatternSequence(startBlock.connections?.[1], blockList);
    },

    hasChangedRhythmLength() {
        const blockList = this.getBlockList();

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "rhythm2") return false;

            const count = Number(blockList[block.connections?.[1]]?.value) || 0;
            const divideBlock = blockList[block.connections?.[2]];
            const numerator = Number(blockList[divideBlock?.connections?.[1]]?.value) || 0;
            const denominator = Number(blockList[divideBlock?.connections?.[2]]?.value) || 0;

            return count !== 1 || numerator !== 1 || denominator !== 1;
        });
    },

    hasChangedDrumSound() {
        const drumNames = this.getSetDrumNames();

        return drumNames.some(drumName => drumName && drumName !== "snare drum");
    },

    getSetDrumNames() {
        const blockList = this.getBlockList();

        return Object.values(blockList)
            .filter(block => block && !block.trash && block.name === "setdrum")
            .map(block => {
                const drumBlock = blockList[block.connections?.[1]];
                return drumBlock?.value || drumBlock?.privateData || "";
            });
    },

    hasSavedDrumMachineAction() {
        const blockList = this.getBlockList();

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "action") return false;

            return this.actionContainsBlockNamed(block, blockList, ["playdrum"]);
        });
    },

    // A piano needs more than one key, and a key is a mouse that answers a click by playing a note.
    validatePianoKeys() {
        return (
            this.hasClickListener() && this.countStartBlocks() >= 2 && this.hasActionPlayingANote()
        );
    },

    hasClickListener() {
        const blockList = this.getBlockList();
        const clickBlock = new Set(["myclick"]);

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "listen") return false;

            return this.argTreeContainsNamed(block.connections?.[1], blockList, clickBlock);
        });
    },

    hasActionPlayingANote() {
        const blockList = this.getBlockList();

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "action") return false;

            return this.actionContainsBlockNamed(block, blockList, ["pitch", "playdrum", "note"]);
        });
    },

    // A metronome is a loop that keeps repeating, holding at least two different drum sounds.
    validateMetronome() {
        return (
            this.hasLoopWithBlockInside(["playdrum", "setdrum"]) &&
            new Set(this.getPlayedDrumNames()).size >= 2
        );
    },

    // Unlike hasLoopContainingBlockNamed this descends into clamps, so a drum inside a note counts.
    hasLoopWithBlockInside(names) {
        const blockList = this.getBlockList();
        const blockNames = new Set(names);

        return Object.values(blockList).some(block => {
            if (!block || block.trash) return false;

            const bodyConnection = LOOP_BODY_CONNECTION.get(block.name);
            if (bodyConnection === undefined) return false;

            return this.argTreeContainsNamed(
                block.connections?.[bodyConnection],
                blockList,
                blockNames
            );
        });
    },

    getPlayedDrumNames() {
        const blockList = this.getBlockList();

        return Object.values(blockList)
            .filter(
                block =>
                    block && !block.trash && (block.name === "playdrum" || block.name === "setdrum")
            )
            .map(block => {
                const drumBlock = blockList[block.connections?.[1]];
                return drumBlock?.value || drumBlock?.privateData || "";
            })
            .filter(Boolean);
    },

    validateAnimatedPolyrhythm() {
        return (
            this.hasRhythmDivisors(new Set([2, 3])) &&
            this.hasConnectedBlockNamed(["everybeatdo"]) &&
            this.hasConnectedBlockNamed(["turtleshell"])
        );
    },

    validateCircularRhythmRing() {
        return (
            this.hasBroadcastWithBuiltName() &&
            this.hasLoopContainingBlockNamed(["arc"]) &&
            this.hasConnectedBlockNamed(["mod"]) &&
            this.hasListeningRingAction()
        );
    },

    hasBroadcastWithBuiltName() {
        const blockList = this.getBlockList();
        const nameBlocks = new Set(["plus"]);

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "dispatch") return false;

            return this.argTreeContainsNamed(block.connections?.[1], blockList, nameBlocks);
        });
    },

    hasListeningRingAction() {
        const blockList = this.getBlockList();

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "action") return false;

            return (
                this.actionContainsBlockNamed(block, blockList, ["listen"]) &&
                this.actionContainsBlockNamed(block, blockList, ["setxy"])
            );
        });
    },

    hasToggleStore() {
        const blockList = this.getBlockList();
        const minusBlock = new Set(["minus"]);

        return Object.values(blockList).some(block => {
            if (!block || block.trash) return false;

            const valueId = this.getStoreValueId(block);
            if (valueId === null || valueId === undefined) return false;

            return this.argTreeContainsNamed(valueId, blockList, minusBlock);
        });
    },

    getStoreValueId(block) {
        if (block.name === "storein") return block.connections?.[2];
        if (block.name === "storein2") return block.connections?.[1];

        return null;
    },

    hasLoopContainingBlockNamed(names) {
        const blockList = this.getBlockList();

        return Object.values(blockList).some(block => {
            if (!block || block.trash) return false;

            const bodyConnection = LOOP_BODY_CONNECTION.get(block.name);
            if (bodyConnection === undefined) return false;

            return this.flowContainsBlockNamed(
                block.connections?.[bodyConnection],
                blockList,
                names
            );
        });
    },

    // Connection 0 points back at the parent, so an argument subtree walks the rest.
    argTreeContainsNamed(blockId, blockList, blockNames, seen = new Set()) {
        if (blockId === null || blockId === undefined || seen.has(blockId)) return false;

        const block = blockList[blockId];
        if (!block || block.trash) return false;

        seen.add(blockId);
        if (blockNames.has(block.name)) return true;

        return (block.connections || [])
            .slice(1)
            .some(connectionId =>
                this.argTreeContainsNamed(connectionId, blockList, blockNames, seen)
            );
    },

    countStartBlocks() {
        return Object.values(this.getBlockList()).filter(
            block => block?.name === "start" && !block.trash
        ).length;
    },

    validateTwinklePhraseMaker() {
        const blockList = this.getBlockList();
        if (!this.hasBlockNamed(["matrix"])) return false;

        const sectionByActionName = this.getTwinkleSectionsByActionName(blockList);
        const transcribed = new Set(sectionByActionName.values());
        if ([...TWINKLE_SECTIONS.keys()].some(section => !transcribed.has(section))) return false;

        const performed = this.getStartActionReferences(blockList).map(actionName =>
            sectionByActionName.get(actionName)
        );

        return JSON.stringify(performed) === JSON.stringify(TWINKLE_SONG_FORM);
    },

    getTwinkleSectionsByActionName(blockList) {
        const sectionByActionName = new Map();

        Object.values(blockList).forEach(block => {
            if (!block || block.trash || block.name !== "action") return;

            const actionName = this.getActionName(block, blockList);
            if (!actionName) return;

            const pitches = [];
            this.collectPitchSequence(block.connections?.[2], blockList, pitches);
            if (!pitches.length) return;

            TWINKLE_SECTIONS.forEach((phrase, section) => {
                if (JSON.stringify(pitches) === JSON.stringify(phrase)) {
                    sectionByActionName.set(actionName, section);
                }
            });
        });

        return sectionByActionName;
    },

    // Phrase Maker nests its pitches inside note clamps, so the walk descends into every note.
    collectPitchSequence(blockId, blockList, sequence, seen = new Set()) {
        let currentId = this.unwrapHiddenFlow(blockId, blockList);
        let guard = 0;

        while (currentId && guard < 200) {
            if (seen.has(currentId)) return;
            seen.add(currentId);

            const block = blockList[currentId];
            if (!block || block.trash) return;

            if (block.name === "pitch") {
                const pitchName = this.getPitchName(block, blockList);
                if (pitchName) sequence.push(pitchName);
            } else if (block.name === "newnote") {
                this.collectPitchSequence(block.connections?.[2], blockList, sequence, seen);
            }

            currentId = this.getNextFlowId(block, blockList);
            guard++;
        }
    },

    getPitchName(pitchBlock, blockList) {
        const name = blockList[pitchBlock.connections?.[1]]?.value;
        const octave = Number(blockList[pitchBlock.connections?.[2]]?.value);

        if (!name || !Number.isFinite(octave)) return "";

        return `${String(name).toLowerCase()}${octave}`;
    },

    hasRhythmDivisors(requiredDivisors) {
        const foundDivisors = this.getRhythmDivisors();

        for (const divisor of requiredDivisors) {
            if (!foundDivisors.has(divisor)) {
                return false;
            }
        }

        return true;
    },

    hasExtraRhythmDivisor(starterDivisors) {
        for (const divisor of this.getRhythmDivisors()) {
            if (!starterDivisors.has(divisor)) {
                return true;
            }
        }

        return false;
    },

    getRhythmDivisors() {
        const blockList = this.getBlockList();
        const divisors = new Set();

        Object.values(blockList).forEach(block => {
            if (!block || block.trash) return;

            if (block.name === "rhythm2") {
                const divideBlock = blockList[block.connections?.[2]];
                const denominator = this.getNumericValue(divideBlock?.connections?.[2], blockList);

                if (denominator) {
                    divisors.add(denominator);
                }
            }

            if (block.name === "stuplet") {
                const tupletCount = this.getNumericValue(block.connections?.[1], blockList);

                if (tupletCount) {
                    divisors.add(tupletCount);
                }
            }
        });

        return divisors;
    },

    validateBasicShapeSet() {
        const blockList = this.getBlockList();
        const startBlocks = Object.values(blockList).filter(
            block => block?.name === "start" && !block.trash
        );
        const remainingSides = new Set([3, 4, 5]);

        startBlocks.forEach(startBlock => {
            this.getStartBlockPolygonSides(startBlock, blockList).forEach(sides => {
                remainingSides.delete(sides);
            });
        });

        return remainingSides.size === 0;
    },

    hasPolygonOutsideSides(requiredSides) {
        const blockList = this.getBlockList();
        const startBlocks = Object.values(blockList).filter(
            block => block?.name === "start" && !block.trash
        );

        return startBlocks.some(startBlock => {
            for (const sides of this.getStartBlockPolygonSides(startBlock, blockList)) {
                if (!requiredSides.has(sides)) {
                    return true;
                }
            }

            return false;
        });
    },

    getStartBlockPolygonSides(startBlock, blockList) {
        const sides = new Set();
        this.collectPolygonSides(startBlock.connections?.[1], blockList, sides);
        return sides;
    },

    collectPolygonSides(blockId, blockList, sides, seen = new Set()) {
        let currentId = this.unwrapHiddenFlow(blockId, blockList);
        let guard = 0;

        while (currentId && guard < 100) {
            if (seen.has(currentId)) return;
            seen.add(currentId);

            const block = blockList[currentId];
            if (!block || block.trash) return;

            if (block.name === "repeat") {
                const repeatCount = this.getNumericValue(block.connections?.[1], blockList);
                const bodyId = block.connections?.[2];
                const turnAngle = this.getFirstBlockArgumentValue(bodyId, blockList, "right");
                const hasForward = this.flowContainsBlockNamed(bodyId, blockList, ["forward"]);

                if (hasForward && repeatCount && this.isPolygonTurn(repeatCount, turnAngle)) {
                    sides.add(repeatCount);
                }

                this.collectPolygonSides(bodyId, blockList, sides, seen);
            }

            currentId = this.getNextFlowId(block, blockList);
            guard++;
        }
    },

    isPolygonTurn(sides, angle) {
        if (!sides || !angle) return false;

        return Math.abs(360 / sides - angle) < 0.001;
    },

    getFirstBlockArgumentValue(blockId, blockList, name) {
        let currentId = this.unwrapHiddenFlow(blockId, blockList);
        let guard = 0;

        while (currentId && guard < 100) {
            const block = blockList[currentId];
            if (!block || block.trash) return null;

            if (block.name === name) {
                return this.getNumericValue(block.connections?.[1], blockList);
            }

            currentId = this.getNextFlowId(block, blockList);
            guard++;
        }

        return null;
    },

    getNumericValue(blockId, blockList) {
        const block = blockList[blockId];
        if (!block || block.trash) return null;

        if (block.name === "number") {
            return Number(block.value);
        }

        if (block.name === "divide") {
            const numerator = this.getNumericValue(block.connections?.[1], blockList);
            const denominator = this.getNumericValue(block.connections?.[2], blockList);
            if (!denominator) return null;

            return numerator / denominator;
        }

        return Number.isFinite(Number(block.value)) ? Number(block.value) : null;
    },

    validatePhraseMakerLesson(problem) {
        const expected = problem?.expected || {};

        if (expected.phraseMakerWorkflow && !this.validatePhraseMakerWorkflow()) {
            return false;
        }

        if (expected.twoPartForm && !this.validateTwoPartForm()) {
            return false;
        }

        if (
            Array.isArray(expected.blocks) &&
            !expected.blocks.every(name => this.hasBlockNamed([name]))
        ) {
            return false;
        }

        if (expected.minNotes && this.countPhraseMakerDrumNotes() < expected.minNotes) {
            return false;
        }

        return true;
    },

    validatePhraseMakerWorkflow() {
        const blockList = this.getBlockList();
        const exportedActions = this.getPhraseMakerActionNames(blockList);
        if (exportedActions.size === 0) return false;

        const referencedActions = this.getStartActionReferences(blockList);
        return referencedActions.some(actionName => exportedActions.has(actionName));
    },

    validateTwoPartForm() {
        const blockList = this.getBlockList();
        const exportedActions = this.getPhraseMakerActionNames(blockList);
        if (exportedActions.size < 2) return false;

        const referencedActions = new Set(this.getStartActionReferences(blockList));
        let referencedParts = 0;
        exportedActions.forEach(actionName => {
            if (referencedActions.has(actionName)) {
                referencedParts++;
            }
        });

        return referencedParts >= 2;
    },

    getPhraseMakerActionNames(blockList) {
        const names = new Set();

        Object.values(blockList).forEach(block => {
            if (!block || block.trash || block.name !== "action") return;

            const actionName = this.getActionName(block, blockList);
            if (!actionName) return;

            if (this.actionContainsBlockNamed(block, blockList, ["playdrum"])) {
                names.add(actionName);
            }
        });

        return names;
    },

    countPhraseMakerDrumNotes() {
        const blockList = this.getBlockList();
        let count = 0;

        Object.values(blockList).forEach(block => {
            if (!block || block.trash || block.name !== "action") return;
            count += this.countBlocksInAction(block, blockList, ["playdrum"]);
        });

        return count;
    },

    countBlocksInAction(actionBlock, blockList, names) {
        const blockNames = new Set(names);
        const seen = new Set();
        let count = 0;

        const visit = blockId => {
            if (blockId === null || blockId === undefined || seen.has(blockId)) return;

            const block = blockList[blockId];
            if (!block || block.trash) return;

            seen.add(blockId);
            if (blockNames.has(block.name)) {
                count++;
            }

            (block.connections || []).forEach(visit);
        };

        visit(actionBlock.connections?.[2]);
        return count;
    },

    flowContainsBlockNamed(blockId, blockList, names) {
        const blockNames = new Set(names);
        let currentId = this.unwrapHiddenFlow(blockId, blockList);
        let guard = 0;

        while (currentId && guard < 100) {
            const block = blockList[currentId];
            if (!block || block.trash) return false;

            if (blockNames.has(block.name)) return true;

            currentId = this.getNextFlowId(block, blockList);
            guard++;
        }

        return false;
    },

    hasChangedPhraseDrums() {
        const starterDrums = new Set(["ride bell", "snare drum", "tom tom", "kick drum"]);
        const blockList = this.getBlockList();

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "drumname") return false;
            return block.value && !starterDrums.has(block.value);
        });
    },

    hasCreatedPhraseVariation() {
        const blockList = this.getBlockList();
        const phraseActions = this.getPhraseMakerActionNames(blockList);
        const referencedActions = this.getStartActionReferences(blockList).filter(actionName =>
            phraseActions.has(actionName)
        );

        return phraseActions.size > 2 || referencedActions.length > 2;
    },

    actionContainsBlockNamed(actionBlock, blockList, names) {
        const blockNames = new Set(names);
        let currentId = this.unwrapHiddenFlow(actionBlock.connections?.[2], blockList);
        let guard = 0;

        while (currentId && guard < 100) {
            const block = blockList[currentId];
            if (!block || block.trash) return false;

            if (this.blockTreeContainsNamed(currentId, blockList, blockNames)) return true;

            currentId = this.getNextFlowId(block, blockList);
            guard++;
        }

        return false;
    },

    blockTreeContainsNamed(blockId, blockList, blockNames, seen = new Set()) {
        if (blockId === null || blockId === undefined || seen.has(blockId)) return false;

        const block = blockList[blockId];
        if (!block || block.trash) return false;

        seen.add(blockId);
        if (blockNames.has(block.name)) return true;

        return (block.connections || []).some(connectionId =>
            this.blockTreeContainsNamed(connectionId, blockList, blockNames, seen)
        );
    },

    getBlockList() {
        const activity = getActivity();
        return activity?.blocks?.blockList || {};
    },

    getNextFlowId(block, blockList) {
        if (!block?.connections?.length) return null;

        return this.unwrapHiddenFlow(block.connections[block.connections.length - 1], blockList);
    },

    unwrapHiddenFlow(blockId, blockList) {
        let currentId = blockId;
        let guard = 0;

        while (currentId && guard < 20) {
            const block = blockList[currentId];
            if (!block || block.trash || block.name !== "hidden") {
                return currentId;
            }

            currentId = block.connections?.[1];
            guard++;
        }

        return currentId || null;
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { PracticeValidator };
}
