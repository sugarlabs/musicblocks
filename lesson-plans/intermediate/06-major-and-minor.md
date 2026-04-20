# Major and Minor

**Level:** Intermediate  
**Grade Range:** Grades 6–8 (ages 11–14)  
**Duration:** 50 minutes  
**Music Concept:** Major and minor scales, mood in music  
**CS Concept:** Conditionals — if/then decisions that change program behavior  

---

## Overview

Students explore how changing a scale from major to minor changes the
emotional feel of a melody. They use the **If** block to make their
program choose between a major and minor version of a phrase based on
a condition, connecting musical decision-making to conditional logic
in programming.

---

## Learning Objectives

By the end of this lesson, students will be able to:

- **Music:** Describe the difference in sound and mood between major and minor scales
- **Music:** Play a simple melody in both C major and C minor
- **CS:** Explain what a conditional (if/then) does in a program
- **CS:** Use the If block in Music Blocks to branch between two musical outcomes

---

## Prerequisite Knowledge

- Familiarity with Pitch blocks and scales (Lesson 1)
- Understanding of Action blocks (Lesson 5)

---

## Materials

- A device with a web browser and speakers/headphones
- [Music Blocks](https://musicblocks.sugarlabs.org)
- Blocks used: **Start**, **Note Value**, **Pitch**, **Action**, **If** (Flow palette), **Mouse Button** or **Box** block (for the condition)

---

## Activity

### Step 1 — Hear the difference (10 min)

1. Teacher plays (or programs) a simple 5-note C major melody: Do Mi Sol Mi Do.
2. Then plays the same melody in C minor: Do Eb Sol Eb Do (Mi becomes Eb).
3. Ask: *"What changed? How did it make you feel?"*
4. Discuss: major scales often sound happy/bright; minor scales often sound sad/mysterious.
5. Ask: *"How could a program decide which version to play?"* — Introduce **conditionals**.

### Step 2 — Define major and minor actions (10 min)

1. Create an **Action** block named **"major phrase"**:
   - Do (1/4), Mi (1/4), Sol (1/4), Mi (1/4), Do (1/2)
2. Create an **Action** block named **"minor phrase"**:
   - Do (1/4), Eb (1/4), Sol (1/4), Eb (1/4), Do (1/2)
   - (Set the Pitch block to E and use the flat accidental, or select Eb from the dropdown)

### Step 3 — Introduce the If block (10 min)

1. Open the **Flow** palette and drag an **If** block onto the canvas.
2. Show students the structure: *if [condition] then [do this] else [do that]*.
3. Drag a **Box** block (Boxes palette) onto the canvas — name it **"mood"** and set its value to **1**.
4. In the If block's condition slot, use: **Box "mood" = 1**.
5. In the "then" branch: **Do "major phrase"**.
6. In the "else" branch: **Do "minor phrase"**.

### Step 4 — Run and change the condition (10 min)

1. Place the If block inside a **Start** block and click **Run** — the major phrase plays.
2. Change the Box "mood" value to **2** and run again — the minor phrase plays.
3. Ask: *"What is the condition checking? What does it decide?"*
4. Ask: *"What would happen if we put the If block inside a Repeat block and changed the mood value halfway through?"*

### Step 5 — Compose a mood-switching piece (10 min)

1. Students build a Start block that:
   - Sets mood to 1, plays the major phrase (Repeat 2)
   - Sets mood to 2, plays the minor phrase (Repeat 2)
   - Sets mood back to 1, plays the major phrase once more
2. Click **Run** and listen to the emotional journey.

---

## Discussion Prompts

- How does changing one note (Mi to Eb) change the entire mood of the melody?
- Can you think of a song that switches between major and minor?
- In everyday life, when do you make an "if/then" decision? (e.g. if it rains, take an umbrella)
- What other musical properties could be used as a condition? (tempo, volume, instrument)

---

## Assessment Criteria

- [ ] Student can describe the difference in mood between major and minor
- [ ] Student defines two Action blocks — one major, one minor
- [ ] Student uses an If block to branch between the two phrases based on a condition
- [ ] Student builds a piece that switches between major and minor at least once

---

## Extension Activities

- Explore other minor scales: harmonic minor, melodic minor (available in the **Mode** block)
- Use the **Set Key** block to transpose the entire piece to a different key
- Research: find a song that uses both major and minor sections (e.g. "Scarborough Fair")
- Challenge: use a random number block as the condition so the program randomly chooses major or minor each time
