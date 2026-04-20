# Loud and Soft

**Level:** Beginner  
**Grade Range:** Grades 3–5 (ages 8–11)  
**Duration:** 45 minutes  
**Music Concept:** Dynamics — volume (forte, piano, crescendo)  
**CS Concept:** Variables — storing and changing values  

---

## Overview

Students explore musical dynamics (loud and soft) by using the
**Set Volume** block to control how loud their notes play. They
discover that a variable in programming is like a volume knob — it
stores a value that can be read and changed at any time.

---

## Learning Objectives

By the end of this lesson, students will be able to:

- **Music:** Define dynamics and use the terms forte (loud) and piano (soft)
- **Music:** Program a simple crescendo (gradually getting louder)
- **CS:** Explain what a variable is and give a real-world example
- **CS:** Use the Set Volume block to change a value during a program

---

## Prerequisite Knowledge

- Lesson 1 (Hello, Pitch!) — familiarity with Note Value and Pitch blocks
- Basic understanding of the Music Blocks canvas

---

## Materials

- A device with a web browser and speakers/headphones
- [Music Blocks](https://musicblocks.sugarlabs.org)
- Blocks used: **Start**, **Note Value**, **Pitch**, **Set Volume** (Volume palette)

---

## Activity

### Step 1 — Introduce dynamics (5 min)

1. Teacher plays a note loudly, then softly.
2. Ask: *"What changed? The pitch (how high/low) or the volume (how loud/soft)?"*
3. Introduce the musical terms: **forte** (loud, f) and **piano** (soft, p).
4. Ask: *"In a program, how might we store 'how loud' something should be?"*
   — Introduce the word **variable**: a named container that holds a value.

### Step 2 — Find the Set Volume block (5 min)

1. Open Music Blocks and click the **Volume** palette.
2. Drag a **Set Volume** block onto the canvas.
3. Show students the number input — it goes from 0 (silent) to 100 (loudest).
4. Ask: *"What number would you use for forte? For piano?"*

### Step 3 — Build a loud-then-soft melody (15 min)

1. Drag a **Start** block onto the canvas.
2. Add a **Set Volume** block set to **80** (forte).
3. Below it, add 3 Note Value + Pitch blocks (e.g. Do, Mi, Sol — quarter notes).
4. Add another **Set Volume** block set to **30** (piano).
5. Add 3 more Note Value + Pitch blocks (e.g. Sol, Mi, Do).
6. Click **Run** — the first three notes are loud, the last three are soft.
7. Ask: *"What is the Set Volume block doing? What value is it storing?"*

### Step 4 — Program a crescendo (10 min)

1. Ask: *"A crescendo means gradually getting louder. How could we do that?"*
2. Guide students to add a Set Volume block before each note, increasing the value:
   - Note 1: Volume 20
   - Note 2: Volume 40
   - Note 3: Volume 60
   - Note 4: Volume 80
3. Click **Run** and listen to the crescendo.
4. Challenge: program a **decrescendo** (gradually getting softer).

### Step 5 — Reflect (10 min)

1. Ask: *"What is a variable? What variable did we use today?"*
2. Ask: *"Can you think of other things in music that could be stored as a variable?"*
   (Tempo, pitch, instrument type)

---

## Discussion Prompts

- What is the difference between pitch and volume?
- Why is it useful to be able to change the volume during a piece of music?
- In everyday life, what are some things that work like variables? (e.g. a thermostat, a light dimmer)
- What would happen if every note in a song was the same volume?

---

## Assessment Criteria

- [ ] Student can define forte and piano using their own words
- [ ] Student successfully builds a program with at least two different volume levels
- [ ] Student can explain what a variable is with a real-world example
- [ ] Student programs a crescendo or decrescendo of at least 3 steps

---

## Extension Activities

- Combine dynamics with the drum loop from Lesson 2 — make the drums get louder over time
- Explore the **Set Tempo** block — is tempo a variable too?
- Try setting volume to 0 — what happens? What does that mean musically?
- Research: what are the Italian terms for all the dynamic levels (pp, p, mp, mf, f, ff)?
