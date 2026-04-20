# Transposition and Intervals

**Level:** Advanced  
**Grade Range:** Grades 8–12 (ages 13–18)  
**Duration:** 60 minutes  
**Music Concept:** Intervals, transposition, harmonic structure  
**CS Concept:** Abstraction and modularity — parameterized functions  

---

## Overview

Students compose a melody and then transpose it to multiple keys using
the **Transposition** block. They explore how intervals define the
relationship between notes and how transposition preserves those
relationships while shifting the entire phrase. The programming
parallel is a parameterized function — the same logic applied with
different input values.

---

## Learning Objectives

By the end of this lesson, students will be able to:

- **Music:** Define interval and identify at least four interval types (unison, 3rd, 5th, octave)
- **Music:** Transpose a melody up and down by a given interval
- **CS:** Explain what abstraction means in programming
- **CS:** Use the Transposition block as a parameterized wrapper around a melody action

---

## Prerequisite Knowledge

- Familiarity with Pitch blocks and scales (Lessons 1, 6)
- Understanding of Action blocks (Lesson 5)
- Basic knowledge of major scale structure

---

## Materials

- A device with a web browser and speakers/headphones
- [Music Blocks](https://musicblocks.sugarlabs.org)
- Blocks used: **Start**, **Note Value**, **Pitch**, **Action**, **Transposition** (Pitch palette), **Repeat**

---

## Activity

### Step 1 — Introduce intervals (10 min)

1. Play two notes simultaneously or in sequence — ask: *"How far apart are these notes?"*
2. Introduce interval names: unison (0), major 2nd (2 semitones), major 3rd (4), perfect 5th (7), octave (12).
3. Ask: *"If I move every note in a melody up by the same interval, what changes? What stays the same?"*
   — The pitches change, but the relationships between them (the melody shape) stay the same.
4. Introduce **transposition**: shifting all notes by a fixed interval.

### Step 2 — Compose a base melody (10 min)

1. Create an **Action** block named **"theme"**:
   - Do (1/4), Re (1/4), Mi (1/4), Sol (1/4), Mi (1/2), Re (1/2)
2. Place a **Do "theme"** block inside a **Start** block and click **Run**.
3. Ask students to compose their own 6-note theme.

### Step 3 — Apply transposition (15 min)

1. Open the **Pitch** palette and find the **Transposition** block.
2. Wrap the **Do "theme"** block inside a **Transposition** block set to **+7** (up a perfect 5th).
3. Click **Run** — the theme plays a 5th higher.
4. Change the transposition value to **-5** (down a perfect 4th) and run again.
5. Ask: *"What stayed the same? What changed?"*

### Step 4 — Build a modulating structure (15 min)

1. Inside the Start block, build the following sequence:
   - Do "theme" (no transposition — original key)
   - Transposition +7: Do "theme" (up a 5th)
   - Transposition +12: Do "theme" (up an octave)
   - Transposition -5: Do "theme" (down a 4th — back near the original)
2. Click **Run** and listen to the modulating structure.
3. Ask: *"How is the Transposition block like a function parameter?"*
   — The action (theme) is the function; the transposition value is the parameter.

### Step 5 — Harmonic intervals (10 min)

1. Use two **Start** blocks running simultaneously (Music Blocks supports this).
2. In Start 1: play the theme in the original key.
3. In Start 2: play the theme with Transposition +4 (a major 3rd above).
4. Click **Run** — both play at the same time, creating harmony.
5. Discuss: *"What interval creates a pleasing harmony? What interval creates tension?"*

---

## Discussion Prompts

- What is the difference between a melody and a harmony?
- Why is transposition useful for a singer who finds a song too high or too low?
- How is the Transposition block an example of abstraction in programming?
- What would happen if you transposed by 12 semitones (one octave)? Does it sound the same?

---

## Assessment Criteria

- [ ] Student can name and describe at least four interval types
- [ ] Student composes a 6-note theme and transposes it to at least three different levels
- [ ] Student can explain the concept of abstraction using the Transposition block as an example
- [ ] Student builds a modulating structure that uses the same theme in multiple keys

---

## Extension Activities

- Explore the **Scalar Transposition** block — how does it differ from semitone transposition?
- Compose a piece in the style of a Bach invention: play the theme, then the theme transposed up a 5th, then inverted
- Research: what is a "circle of fifths" and how does it relate to transposition?
- Use the **Interval** block to add a harmony note to every note in the melody automatically
