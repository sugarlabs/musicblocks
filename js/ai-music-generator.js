// Copyright (c) 2026 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @file AI Music Generator for Music Blocks.
 *
 * Provides an abstraction layer for generating MIDI note sequences from
 * natural language prompts using various AI providers (Gemini, OpenAI,
 * or a local/custom endpoint).
 *
 * The generated text output is parsed into a Midi object compatible with
 * the existing transcribeMidi() function.
 *
 * Dependencies:
 *     - lib/midi.js: Midi class (@tonejs/midi)
 *
 * @author Walter Bender
 */

/* global Midi */

/* exported AIMusicGenerator */

/**
 * Supported AI provider identifiers.
 * @enum {string}
 */
const AI_PROVIDERS = {
    GEMINI: "gemini",
    OPENAI: "openai",
    CUSTOM: "custom"
};

/**
 * @class
 * @classdesc Generates MIDI note sequences from natural language prompts
 * using configurable AI backends. Supports Gemini, OpenAI, and custom
 * endpoints (e.g., local Ollama).
 */
class AIMusicGenerator {
    /**
     * @param {object} config
     * @param {string} config.provider - One of AI_PROVIDERS values.
     * @param {string} config.apiKey - API key for the chosen provider.
     * @param {string} [config.model] - Model name override.
     * @param {string} [config.endpoint] - Custom endpoint URL (for CUSTOM provider).
     */
    constructor(config) {
        this.provider = config.provider || AI_PROVIDERS.GEMINI;
        this.apiKey = config.apiKey || "";
        this.model = config.model || this._defaultModel();
        this.endpoint = config.endpoint || "";
    }

    /**
     * Returns the default model name for the current provider.
     * @private
     * @returns {string}
     */
    _defaultModel() {
        switch (this.provider) {
            case AI_PROVIDERS.GEMINI:
                return "gemini-2.0-flash";
            case AI_PROVIDERS.OPENAI:
                return "gpt-4o-mini";
            case AI_PROVIDERS.CUSTOM:
                return "llama3";
            default:
                return "gemini-2.0-flash";
        }
    }

    /**
     * Builds the system prompt that instructs the AI to output MIDI note data.
     * @private
     * @returns {string}
     */
    _buildSystemPrompt() {
        return `You are a music composition assistant. You generate MIDI note sequences.

Output format — each note on its own line:
NOTE <pitch> <start_seconds> <duration_seconds> <velocity>

Where:
- pitch: MIDI pitch number (0-127, middle C = 60)
- start_seconds: when the note begins (float)
- duration_seconds: how long the note lasts (float)
- velocity: how loud (1-127, typical 80-100)

Rules:
- Output ONLY NOTE lines, no other text.
- Create at least 32 notes.
- Use musically sensible intervals and rhythms.
- Place notes on a reasonable rhythmic grid.
- Use a tempo around 120 BPM unless asked otherwise.
- Create a cohesive melody that sounds musical.

Example (first 4 notes of "Twinkle Twinkle"):
NOTE 60 0.0 0.5 90
NOTE 60 0.5 0.5 90
NOTE 67 1.0 0.5 90
NOTE 67 1.5 0.5 90`;
    }

    /**
     * Calls the configured AI provider and returns the raw text response.
     * @private
     * @param {string} userPrompt - The user's natural language request.
     * @returns {Promise<string>} The raw AI response text.
     */
    async _callProvider(userPrompt) {
        switch (this.provider) {
            case AI_PROVIDERS.GEMINI:
                return this._callGemini(userPrompt);
            case AI_PROVIDERS.OPENAI:
                return this._callOpenAI(userPrompt);
            case AI_PROVIDERS.CUSTOM:
                return this._callCustom(userPrompt);
            default:
                throw new Error(`Unknown provider: ${this.provider}`);
        }
    }

    /**
     * Calls the Google Gemini API.
     * @private
     * @param {string} userPrompt
     * @returns {Promise<string>}
     */
    async _callGemini(userPrompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: this._buildSystemPrompt() }]
                },
                contents: [
                    {
                        parts: [{ text: userPrompt }]
                    }
                ]
            })
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`Gemini API error (${resp.status}): ${err}`);
        }

        const data = await resp.json();
        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Calls the OpenAI-compatible API (works with OpenAI and compatible
     * services like OpenRouter).
     * @private
     * @param {string} userPrompt
     * @returns {Promise<string>}
     */
    async _callOpenAI(userPrompt) {
        const url = this.endpoint || "https://api.openai.com/v1/chat/completions";

        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "system", content: this._buildSystemPrompt() },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.8
            })
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`OpenAI API error (${resp.status}): ${err}`);
        }

        const data = await resp.json();
        return data.choices[0].message.content;
    }

    /**
     * Calls a custom/local endpoint (e.g., Ollama at localhost:11434).
     * Uses the OpenAI-compatible chat format that Ollama supports.
     * @private
     * @param {string} userPrompt
     * @returns {Promise<string>}
     */
    async _callCustom(userPrompt) {
        const url = this.endpoint || "http://localhost:11434/api/chat";

        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "system", content: this._buildSystemPrompt() },
                    { role: "user", content: userPrompt }
                ],
                stream: false
            })
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`Custom endpoint error (${resp.status}): ${err}`);
        }

        const data = await resp.json();
        // Ollama format
        if (data.message && data.message.content) {
            return data.message.content;
        }
        // OpenAI-compatible format
        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        }
        throw new Error("Unexpected response format from custom endpoint");
    }

    /**
     * Parses the AI text response into a Midi object that transcribeMidi()
     * can consume.
     * @private
     * @param {string} text - Raw AI response containing NOTE lines.
     * @returns {object} A @tonejs/midi-compatible Midi object.
     */
    _parseToMidi(text) {
        const lines = text.split("\n").filter(l => l.trim().startsWith("NOTE"));
        if (lines.length === 0) {
            throw new Error("AI response contained no valid NOTE lines.");
        }

        const notes = [];
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            // Expected: NOTE <pitch> <start> <duration> <velocity>
            if (parts.length < 5) continue;

            const pitch = parseInt(parts[1], 10);
            const start = parseFloat(parts[2]);
            const duration = parseFloat(parts[3]);
            const velocity = parseInt(parts[4], 10) / 127;

            if (
                isNaN(pitch) ||
                isNaN(start) ||
                isNaN(duration) ||
                isNaN(velocity) ||
                pitch < 0 ||
                pitch > 127 ||
                duration <= 0
            ) {
                continue;
            }

            // Convert MIDI pitch to note name + octave
            const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            const noteName = noteNames[pitch % 12];
            const octave = Math.floor(pitch / 12) - 1;

            notes.push({
                name: `${noteName}${octave}`,
                midi: pitch,
                time: start,
                duration: duration,
                velocity: velocity
            });
        }

        if (notes.length === 0) {
            throw new Error("Could not parse any valid notes from AI response.");
        }

        // Sort by start time
        notes.sort((a, b) => a.time - b.time);

        // Build a Midi-compatible object
        // The Midi constructor from @tonejs/midi expects ArrayBuffer for parsing,
        // but transcribeMidi() directly reads .header and .tracks, so we can
        // construct the object manually.
        const midiObj = {
            header: {
                tempos: [{ bpm: 120, ticks: 0 }],
                timeSignatures: [{ timeSignature: [4, 4], ticks: 0 }]
            },
            tracks: [
                {
                    name: "AI Generated",
                    channel: 0,
                    notes: notes,
                    instrument: {
                        name: "acoustic grand piano",
                        number: 0,
                        family: "piano",
                        percussion: false
                    }
                }
            ]
        };

        return midiObj;
    }

    /**
     * Generates a Midi object from a natural language prompt.
     * @public
     * @param {string} prompt - e.g., "A happy melody in C major"
     * @returns {Promise<object>} A Midi-compatible object for transcribeMidi().
     */
    async generate(prompt) {
        const rawText = await this._callProvider(prompt);
        return this._parseToMidi(rawText);
    }

    /**
     * Tests the connection to the configured AI provider.
     * @public
     * @returns {Promise<boolean>} True if the provider responds successfully.
     */
    async testConnection() {
        try {
            await this._callProvider("Generate 4 notes of a C major scale.");
            return true;
        } catch (e) {
            console.error("AI connection test failed:", e);
            return false;
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { AIMusicGenerator, AI_PROVIDERS };
}
