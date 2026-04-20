# Repeating Phrases

**Level:** Intermediate  
**Grade Range:** Grades 5–7 (ages 10–13)  
**Duration:** 50 minutes  
**Music Concept:** Phrase repetition, musical form (AB, ABA)  
**CS Concept:** Loops and iteration — Repeat block, nested loops  

---

## Overview

Students compose a short piece with two distinct musical phrases (A and B)
and use **Repeat** blocks to build common musical forms (AB, ABA, AABA).
They explore how nested loops work by creating a phrase that contains
its own internal repetition, connecting the structure of music to the
structure of code.

---

## Learning Objectives

By the end of this lesson, students will be able to:

- **Music:** Define musical phrase and identify AB and ABA form in a piece
- **Music:** Compose two contrasting 4-note phrases
- **CS:** Use nested Repeat blocks to create multi-level repetition
- **CS:** Explain the difference between an outer loop and an inner loop

---

## Prerequisite Knowledge

- Familiarity with Note Value and Pitch blocks (Lesson 1)
- Understanding of basic loops (Lesson 2)

---

## Materials

- A device with a web browser and speakers/headphones
- [Music Blocks](https://musicblocks.sugarlabs.org)
- Blocks used: **Start**, **Note Value**, **Pitch**, **Repeat** (Flow palette), **Action** (Action palette)

---

## Activity

### Step 1 — Introduce musical form (10 min)

1. Play a simple example: hum or clap a 4-note phrase (A), then a different 4-note phrase (B).
2. Ask: *"Were those the same or different?"* — introduce the term **phrase**.
3. Explain AB form (verse–chorus), ABA form (verse–chorus–verse).
4. Ask: *"How would you tell a computer to play A, then B, then A again?"*

### Step 2 — Compose phrase A (10 min)

1. In Music Blocks, drag a **Start** block onto the canvas.
2. Inside Start, add 4 Note Value blocks with Pitch blocks:
   - Do (1/4), Mi (1/4), Sol (1/4), Mi (1/2)
3. Click **Run** — this is phrase A.
4. Ask students to modify the pitches to make their own phrase A.

### Step 3 — Compose phrase B (10 min)

1. Below phrase A, add 4 more Note Value + Pitch blocks with a contrasting feel:
   - Sol (1/4), La (1/4), Sol (1/4), Mi (1/2)
2. Click **Run** — now the program plays A then B (AB form).
3. Ask: *"How would we play A again at the end to make ABA form?"*
   — Copy the A blocks and paste them below B.

### Step 4 — Use Repeat for AABA form (10 min)

1. Wrap phrase A in a **Repeat** block set to **2** (plays AA).
2. Add phrase B once below.
3. Add phrase A once more below B (AABA — a common jazz form).
4. Click **Run** and listen.
5. Ask: *"What would happen if we put a Repeat block around the whole AABA structure?"*
   — Try it with Repeat set to 2.

### Step 5 — Nested loops (10 min)

1. Show students a Repeat block inside another Repeat block.
2. Inner Repeat = 2, Outer Repeat = 3.
3. Ask: *"How many times does the inner phrase play in total?"* (2 × 3 = 6)
4. Students experiment with their own nested loop compositions.

---

## Discussion Prompts

- What is the difference between phrase A and phrase B in your composition?
- Why do songs repeat sections? What effect does repetition have on the listener?
- How is a nested loop like a musical phrase that contains its own repetition?
- Can you think of a song that uses ABA form?

---

## Assessment Criteria

- [ ] Student composes two distinct 4-note phrases (A and B)
- [ ] Student builds an ABA or AABA structure using Repeat blocks
- [ ] Student can explain what a nested loop is and calculate its total iterations
- [ ] Student's composition sounds intentional and musical

---

## Extension Activities

- Explore the **Pitch-Time Matrix** widget to compose phrases visually
- Add dynamics (Set Volume) to make phrase B louder or softer than phrase A
- Research: what musical form does a 12-bar blues use?
- Try ABAC form — compose a third phrase C
