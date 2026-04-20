# Modes and Scales

**Level:** Advanced  
**Grade Range:** Grades 9–12 / Conservatory (ages 14+)  
**Duration:** 60 minutes  
**Music Concept:** Modes (Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian), scale structure  
**CS Concept:** Data structures and parameters — using structured data to drive program behavior  

---

## Overview

Students explore the seven modes of the major scale and compose a short
piece in each of two contrasting modes. They use the **Set Key** and
**Mode** blocks to switch between modes programmatically, discovering
how a single data parameter (the mode name) can completely change the
character of a piece — a direct parallel to how data structures drive
program behavior.

---

## Learning Objectives

By the end of this lesson, students will be able to:

- **Music:** Name the seven modes and describe the characteristic sound of at least three
- **Music:** Compose a short melody that exploits the character of a chosen mode
- **CS:** Explain how a data parameter changes program output without changing program structure
- **CS:** Use the Set Key and Mode blocks to switch between scales programmatically

---

## Prerequisite Knowledge

- Strong familiarity with major and minor scales (Lesson 6)
- Understanding of intervals and transposition (Lesson 7)
- Comfort with Action blocks and the Music Blocks interface

---

## Materials

- A device with a web browser and speakers/headphones
- [Music Blocks](https://musicblocks.sugarlabs.org)
- Blocks used: **Start**, **Note Value**, **Pitch**, **Action**, **Set Key** (Pitch palette), **Mode Name** block
- Optional: printed mode reference chart

---

## Activity

### Step 1 — Introduce modes (15 min)

1. Explain: the seven modes are all built from the same 7 notes of the major scale, but each
   starts on a different degree, creating a different pattern of whole and half steps.
2. Play (or program) a simple 5-note melody in C Ionian (major): Do Re Mi Fa Sol.
3. Play the same starting note (D) but use D Dorian: D E F G A — ask: *"What changed?"*
4. Play E Phrygian: E F G A B — ask: *"How does this feel different?"*
5. Introduce the mode character guide:
   - **Ionian** (major) — bright, happy
   - **Dorian** — minor with a raised 6th, jazzy, soulful
   - **Phrygian** — dark, Spanish/flamenco feel
   - **Lydian** — dreamy, raised 4th
   - **Mixolydian** — major with a flat 7th, bluesy, rock
   - **Aeolian** (natural minor) — sad, classical
   - **Locrian** — tense, unstable (rarely used melodically)

### Step 2 — Use Set Key and Mode blocks (10 min)

1. Open Music Blocks and find the **Set Key** block (Pitch palette).
2. The Set Key block takes two inputs: a **pitch name** (e.g. D) and a **mode name** (e.g. Dorian).
3. Drag a **Start** block onto the canvas.
4. Inside Start, add a **Set Key** block: pitch = C, mode = Ionian.
5. Add 5 Note Value + Pitch blocks (Do Re Mi Fa Sol) and click **Run**.
6. Change the mode to **Dorian** and run again — the same scale degrees now produce a different set of pitches.
7. Ask: *"What is the Set Key block doing? What data is it storing?"*

### Step 3 — Compose a modal melody (15 min)

1. Students choose one mode that interests them.
2. They compose a 8-note melody that exploits the characteristic interval of that mode:
   - Dorian: emphasize the raised 6th
   - Phrygian: start on the flat 2nd for tension
   - Lydian: use the raised 4th for a dreamy effect
   - Mixolydian: end on the flat 7th for an unresolved feel
3. Wrap the melody in an **Action** block named after the mode (e.g. "dorian theme").

### Step 4 — Mode switching structure (10 min)

1. Students build a Start block that:
   - Sets key to C Ionian, calls their theme action
   - Sets key to C Dorian (or another mode), calls the same theme action
   - Sets key back to C Ionian, calls the theme action once more
2. Click **Run** — the same melodic shape sounds completely different in each mode.
3. Ask: *"How is the mode name like a parameter passed to a function?"*
   — The action (theme) is the function; the mode is the parameter that changes its output.

### Step 5 — Reflect and discuss (10 min)

1. Students share their modal compositions.
2. Discuss: *"How does changing one parameter (the mode) change the entire character of the piece?"*
3. Ask: *"Can you think of other examples in programming where a single data value changes the entire behavior of a system?"*
   (e.g. a theme/skin in an app, a language setting, a difficulty level in a game)

---

## Discussion Prompts

- What makes Dorian sound different from Aeolian (natural minor), even though both are minor-sounding?
- How is a mode like a "template" that shapes all the notes in a piece?
- In programming, what is the difference between a function and its parameters?
- Can you think of a well-known song in Dorian mode? In Mixolydian? (e.g. "Scarborough Fair" — Dorian; "Norwegian Wood" — Mixolydian)

---

## Assessment Criteria

- [ ] Student can name all seven modes and describe the character of at least three
- [ ] Student composes an 8-note melody that exploits the characteristic interval of their chosen mode
- [ ] Student uses Set Key and Mode blocks to switch between at least two modes programmatically
- [ ] Student can explain the concept of a data parameter using the mode as an example

---

## Extension Activities

- Explore non-Western scales available in Music Blocks: Arabic, Byzantine, Hirajoshi, Maqam
- Use the **Temperament** widget to explore how tuning systems affect the sound of modes
- Compose a piece that modulates through three modes, each representing a different emotional state
- Research: what modes are used in jazz (e.g. Dorian in modal jazz, Lydian in film scores)?
- Challenge: compose a piece using Locrian mode — can you make it sound musical despite its instability?
