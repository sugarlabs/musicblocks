# Program Blocks

Music Blocks is a visual programming environment for learning music through code.
Program blocks are the structural components of Music Blocks that control the
**execution flow** and **organization** of a project. While sound blocks (such as
Pitch or Note) define what is played, program blocks define *how* and *when*
those sounds are played.

## Introduction

In Music Blocks, users create music by snapping blocks together. Some blocks
represent musical sounds, while others represent the logic of the program.
These logical blocks are known as **Program Blocks**. They are essential for
turning a simple sequence of notes into a structured and expressive musical
composition.

## Role in Music Blocks

Program blocks act as the control system of a project. They tell Music Blocks:

- **Where to start** execution (using the Start block)
- **How to repeat** a sequence of musical instructions (using loop blocks)
- **How to group** related instructions together (using Action blocks)
- **When to perform** certain tasks based on conditions (using flow and
  conditional blocks)

Program blocks **do not directly produce sound**. Instead, they organize and
manage other blocks that generate music.

## Program Blocks vs. Sound Blocks

A Music Blocks project can be compared to a musical performance:

- **Sound Blocks** are like the musicians and their instruments, producing
  notes, rhythms, and sounds.
- **Program Blocks** are like the conductor and the musical score, deciding
  when parts repeat, where the music starts, and how sections are organized.

| Block Type | Purpose | Examples |
|-----------|---------|----------|
| **Program Blocks** | Control structure and execution flow | Start, Action, Repeat, If/Then |
| **Sound Blocks** | Produce musical sounds | Pitch, Note, Set Instrument |

## Common Program Blocks

Program blocks are primarily found in the **Action** and **Flow** palettes.

### Start Block

The **Start** block defines the entry point of a program. Any blocks placed
inside its clamp are executed when the **Play** button is pressed.

A project may contain multiple Start blocks, allowing different musical
sequences to run at the same time. This makes it possible to create layered
music or counterpoint.

### Action Block

An **Action** block allows users to group a set of blocks and give that group a
name. Once an Action is defined, it can be reused anywhere in the project by
calling the Action block with the same name.

Action blocks help:
- Reduce repetition
- Improve readability
- Organize music into meaningful sections such as verses or choruses

### Loop Blocks

Loop blocks repeat the blocks placed inside them, making it easy to create
patterns and rhythms.

Common loop blocks include:
- **Repeat** – runs the contained blocks a fixed number of times
- **Forever** – repeats the contained blocks until the program is stopped
- **While / Until** – repeats blocks based on a condition

## How to Use Program Blocks

Most program blocks are **clamp blocks**, meaning they contain space where other
blocks can be placed.

- **Stacking**: Program blocks can be stacked vertically to define the order of
  execution.
- **Nesting**: Program blocks can be placed inside other program blocks, such as
  putting a Repeat block inside an Action block.
- **Organization**: Using Action blocks to separate musical ideas makes projects
  easier to understand and modify.

## Best Practices

- **Use descriptive names** for Action blocks so their purpose is clear.
- **Organize large projects** by breaking music into smaller, reusable Actions.
- **Avoid excessive nesting**, which can make projects harder to read.
- **Debug logically**: since program blocks do not produce sound, using tools
  like the Print block (from the Extras palette) can help track execution.

## Summary

Program blocks provide the structure that allows musical ideas to be organized,
reused, and controlled. By combining program blocks with sound blocks, users can
build complex musical compositions that are clear, expressive, and easy to
maintain.
