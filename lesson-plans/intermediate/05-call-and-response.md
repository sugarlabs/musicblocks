# Call and Response

**Level:** Intermediate  
**Grade Range:** Grades 5–8 (ages 10–14)  
**Duration:** 50 minutes  
**Music Concept:** Call and response, musical dialogue, phrase structure  
**CS Concept:** Actions (functions) — defining and calling reusable blocks of code  

---

## Overview

Students compose a call-and-response piece where one musical phrase
(the "call") is answered by another (the "response"). They implement
each phrase as a named **Action** block, discovering that actions in
Music Blocks work exactly like functions in programming — write once,
call many times.

---

## Learning Objectives

By the end of this lesson, students will be able to:

- **Music:** Define call and response and identify it in a musical example
- **Music:** Compose a 4-note call phrase and a contrasting 4-note response phrase
- **CS:** Define what a function (action) is and explain why functions are useful
- **CS:** Create and call named Action blocks in Music Blocks

---

## Prerequisite Knowledge

- Familiarity with Note Value and Pitch blocks (Lesson 1)
- Understanding of musical phrases (Lesson 4)

---

## Materials

- A device with a web browser and speakers/headphones
- [Music Blocks](https://musicblocks.sugarlabs.org)
- Blocks used: **Start**, **Note Value**, **Pitch**, **Action** block (Action palette), **Do** (call) block

---

## Activity

### Step 1 — Introduce call and response (10 min)

1. Teacher sings or claps a short phrase (the "call").
2. Students respond with their own phrase (the "response").
3. Discuss: *"Where do we hear call and response in music?"*
   (Blues, gospel, jazz, African drumming, question-and-answer phrases)
4. Ask: *"If you had to play the call phrase 10 times in a program, would you want to type it out 10 times?"*
   — Introduce the concept of a **function**: write it once, use it anywhere.

### Step 2 — Define the Call action (10 min)

1. Open Music Blocks and drag an **Action** block onto the canvas.
2. Name it **"call"** by clicking the name field.
3. Inside the Action block, add 4 Note Value + Pitch blocks:
   - Mi (1/4), Sol (1/4), La (1/4), Sol (1/2)
4. This defines the function — it does not play yet.

### Step 3 — Define the Response action (10 min)

1. Drag a second **Action** block onto the canvas.
2. Name it **"response"**.
3. Inside, add a contrasting 4-note phrase:
   - Re (1/4), Mi (1/4), Re (1/4), Do (1/2)

### Step 4 — Call the actions from Start (10 min)

1. Drag a **Start** block onto the canvas.
2. Inside Start, drag a **Do "call"** block (from the Action palette).
3. Below it, drag a **Do "response"** block.
4. Click **Run** — the program plays call then response.
5. Ask: *"How would we play call–response–call–response?"*
   — Add the Do blocks again, or wrap in a Repeat block.

### Step 5 — Reuse and remix (10 min)

1. Students modify their call and response phrases.
2. Challenge: create a third action called **"echo"** that plays the call phrase at half volume.
3. Build a structure: call → response → call → echo.
4. Discuss: *"What would happen if we changed the call action? Does the change affect every place it's called?"*

---

## Discussion Prompts

- Why is call and response an effective musical technique?
- How is defining an Action block like writing a recipe that you can use over and over?
- What is the advantage of using a function instead of copying and pasting the same blocks?
- Can you think of a real-world example of a "function" outside of programming?

---

## Assessment Criteria

- [ ] Student defines two named Action blocks (call and response) with distinct phrases
- [ ] Student successfully calls both actions from a Start block
- [ ] Student can explain what a function is and why it avoids repetition
- [ ] Student builds a structure that uses each action at least twice

---

## Extension Activities

- Add a drum loop (from Lesson 2) running alongside the call and response melody
- Create an action that plays a phrase in reverse order
- Research: find a recording of a blues song and identify the call and response structure
- Explore the **Music Keyboard** widget to compose phrases by playing them in real time
