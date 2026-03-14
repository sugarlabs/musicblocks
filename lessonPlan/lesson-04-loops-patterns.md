# Lesson 4: Loops and Musical Patterns

**Grade Level**: 5-9  
**Duration**: 45-60 minutes  
**Prerequisites**: Lessons 1-3

## Objectives

Students will:
- Use repeat blocks to create efficient code
- Understand nested loops
- Create complex musical patterns with simple code
- Connect programming concepts to music

## Materials

- Computers with Music Blocks
- Headphones
- Optional: Examples of repetitive music (pop songs, classical pieces)

## Lesson Plan

### Hook: Repetition in Music (5 minutes)

Play a short clip of a popular song. Ask: "What repeats in this song?"

Students might notice:
- The chorus repeats
- The beat repeats
- Certain melodies come back

"Today we'll learn how programmers handle repetition - with loops."

### Direct Instruction: Loop Basics (10 minutes)

**What's a loop?**
A loop tells the computer: "Do this thing multiple times."

**Why use loops?**
Instead of this (show blocks repeated 8 times), we can do this (show same blocks in a repeat block set to 8).

**Demo:**
1. Create a 4-note melody
2. Copy-paste it 4 times (messy!)
3. Delete those copies
4. Put the original in a repeat block (set to 4)
5. Same result, cleaner code

**The power of loops:**
- Change one thing, it changes everywhere
- Easy to make it repeat more or less
- Cleaner, easier to understand

### Guided Practice: Nested Loops (15 minutes)

"What if we want a pattern that repeats, and then that whole thing repeats?"

**Example: A-B-A-B pattern**

Build together:
1. Create pattern A (4 notes)
2. Create pattern B (4 different notes)
3. Put both in a repeat block (set to 2)
4. Put THAT in another repeat block (set to 2)

Result: A-B-A-B-A-B-A-B

This is called a nested loop - a loop inside a loop.

**Try it:**
- Inner loop: Your melody (repeats 2 times)
- Outer loop: The whole thing (repeats 3 times)

### Independent Activity: Create a Song Structure (20 minutes)

Challenge: Create a song with this structure:
- Verse (8 notes)
- Chorus (8 notes)
- Verse again
- Chorus again

Use loops to make this efficient!

**Hints:**
- Make the verse once, use a loop
- Make the chorus once, use a loop
- Think about how to structure your blocks

**Extension:**
Add a bridge (a different section) that plays once in the middle.

### Wrap-Up: Code Review (10 minutes)

Have students pair up and show each other their code.

Questions to discuss:
- How many repeat blocks did you use?
- Could you make your code even more efficient?
- What would happen if you changed the repeat number?

Ask for volunteers to share interesting solutions.

## Assessment

Students demonstrate mastery by:
- Using at least one repeat block effectively
- Creating a song with repeating sections
- Explaining why loops are useful

## Extensions

**Challenge 1: Variations**
Make your melody change slightly each time it repeats. (Hint: You might need to not use a loop for this!)

**Challenge 2: Complex Nesting**
Create a pattern with 3 levels of loops.

**Challenge 3: Real Song**
Try to recreate the structure of a real song you know.

## Common Issues

**"My nested loops aren't working"**
- Make sure blocks are properly nested (one inside the other)
- Check that each repeat block has the right number
- Test the inner loop first, then add the outer loop

**"This seems complicated"**
- Start with one simple loop
- Get that working
- Then add complexity

**"Why not just copy-paste?"**
- Try changing one note in your copied version - you have to change it everywhere
- Try changing one note in your looped version - change it once, it changes everywhere

## Notes for Teachers

- This lesson bridges music and computer science - emphasize both
- Some students will grasp loops immediately, others need more time
- Use physical analogies: "If I say 'clap 4 times', that's a loop"
- The nested loop concept can be tricky - don't rush it

## Computer Science Connections

This lesson teaches:
- **Loops** (fundamental programming concept)
- **Efficiency** (doing more with less code)
- **Abstraction** (patterns within patterns)
- **Debugging** (when loops don't work as expected)

## Vocabulary

- **Loop**: Code that repeats
- **Iteration**: One time through a loop
- **Nested loop**: A loop inside another loop
- **Efficient**: Doing something with less effort or code

## Next Lesson

Lesson 5: Multiple Voices - We'll create harmony by running multiple musical lines at the same time.
