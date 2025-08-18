/**
 * MusicBlocks v3.6.2
 *
 * @author Elwin Li
 *
 * @copyright 2025 Elwin Li
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Configuration class for the RAG system
 */
class RAGConfig {
    constructor() {
        this.apiKey = null;
        this.ragSystem = null;
        this.isInitialized = false;
        this.vectorStorePath = "faiss_index_gemini";
        this.documentsPath = "midi_documents_gemini.json";
    }

    /**
     * Initialize the RAG system with API key
     * @param {string} apiKey - The Gemini API key
     * @returns {Promise<boolean>} - Success status
     */
    async initialize(apiKey) {
        try {
            if (!apiKey) {
                throw new Error("API key is required");
            }

            this.apiKey = apiKey;
            
            // Check if the RAG system is available globally
            if (typeof window.GeminiMusicRAG === 'undefined') {
                throw new Error("GeminiMusicRAG not loaded. Please ensure musicRAG.js is loaded before ragConfig.js");
            }
            
            // Initialize the RAG system
            this.ragSystem = new window.GeminiMusicRAG(apiKey);
            
            // Load or create vector store
            await this._loadVectorStore();
            
            this.isInitialized = true;
            console.log("RAG system initialized successfully");
            return true;
        } catch (error) {
            console.error("Failed to initialize RAG system:", error);
            return false;
        }
    }



    /**
     * Load or create the vector store
     * @private
     * @returns {Promise<void>}
     */
    async _loadVectorStore() {
        try {
            // Check if vector store exists
            const vectorStoreExists = await this._checkFileExists(this.vectorStorePath);
            
            if (vectorStoreExists) {
                console.log("Loading existing vector store...");
                await this.ragSystem.loadVectorstore(this.vectorStorePath);
            } else {
                console.log("Creating new vector store...");
                await this._createVectorStore();
            }
        } catch (error) {
            console.error("Error loading vector store:", error);
            throw error;
        }
    }

    /**
     * Create a new vector store
     * @private
     * @returns {Promise<void>}
     */
    async _createVectorStore() {
        try {
            // Check if documents exist
            const documentsExist = await this._checkFileExists(this.documentsPath);
            
            if (documentsExist) {
                console.log("Loading existing documents...");
                await this.ragSystem.loadDocuments(this.documentsPath);
            } else {
                console.log("Processing MIDI dataset...");
                await this.ragSystem.processMidiDataset();
                await this.ragSystem.saveDocuments(this.documentsPath);
            }
            
            // Generate embeddings and save vector store
            await this.ragSystem.generateEmbeddings();
            await this.ragSystem.saveVectorstore(this.vectorStorePath);
        } catch (error) {
            console.error("Error creating vector store:", error);
            throw error;
        }
    }



    /**
     * Check if a file exists
     * @private
     * @param {string} path - File path
     * @returns {Promise<boolean>}
     */
    async _checkFileExists(path) {
        try {
            // In browser environment, check localStorage
            if (typeof window !== 'undefined') {
                // For vector store, check for the index.json file
                if (path === this.vectorStorePath) {
                    return localStorage.getItem(`${path}/index.json`) !== null;
                }
                // For documents, check the direct path
                return localStorage.getItem(path) !== null;
            }
            
            // Fallback to fetch for other environments
            const response = await fetch(path);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Generate MIDI from a query
     * @param {string} query - The text query
     * @returns {Promise<ArrayBuffer|null>} - The generated MIDI data
     */
    async generateMIDI(query) {
        if (!this.isInitialized || !this.ragSystem) {
            throw new Error("RAG system not initialized");
        }

        try {
            // Search for similar music
            const docs = await this.ragSystem.searchSimilarMusic(query, 3);
            
            if (docs.length === 0) {
                throw new Error("No similar music found");
            }

            // Generate new music
            const generatedSequence = await this.ragSystem.generateMusicWithGemini(docs, query);
            
            if (!generatedSequence || generatedSequence === "No response generated") {
                throw new Error("Failed to generate music sequence");
            }

            // Extract notes from the generated text
            const extractedNotes = this.ragSystem.extractNotesFromText(generatedSequence);
            
            if (!extractedNotes) {
                throw new Error("Failed to extract notes from generated sequence");
            }

            // Convert to MIDI
            const midiData = await this.convertToMIDI(extractedNotes);
            
            return midiData;
        } catch (error) {
            console.error("Error generating MIDI:", error);
            throw error;
        }
    }

    /**
     * Convert note sequence to MIDI data
     * @param {string} noteSequence - The note sequence
     * @returns {Promise<ArrayBuffer>} - MIDI data
     */
    async convertToMIDI(noteSequence) {
        try {
            // Create a simple MIDI structure
            const midi = {
                header: {
                    name: "Generated Music",
                    PPQ: 480
                },
                track: [{
                    name: "Generated Track",
                    event: []
                }]
            };

            let currentTime = 0;
            const notes = noteSequence.trim().split(' ');

            // Add tempo event first (80 BPM - slower tempo for 200+ notes)
            midi.track[0].event.push({
                type: 0xFF, // Meta event
                deltaTime: 0,
                data: [0x51, 0x03, 0x0B, 0x71, 0xB0] // Tempo: 80 BPM
            });

            // Parse and sort notes by start time for proper MIDI sequencing
            const parsedNotes = [];
            for (const noteRepr of notes) {
                if (noteRepr.includes(':') && noteRepr.includes('-')) {
                    const [pitch, times] = noteRepr.split(':');
                    const [start, end] = times.split('-').map(Number);
                    
                    const pitchNum = parseInt(pitch);
                    if (pitchNum >= 0 && pitchNum <= 127 && start < end) {
                        parsedNotes.push({
                            pitch: pitchNum,
                            start: start,
                            end: end,
                            duration: end - start
                        });
                    }
                }
            }
            
            // Sort notes by start time
            parsedNotes.sort((a, b) => a.start - b.start);
            
            // Add notes to MIDI track
            for (const note of parsedNotes) {
                const deltaTime = Math.round((note.start - currentTime) * 480);
                
                // Note on (0x90 = 144 for channel 0)
                midi.track[0].event.push({
                    type: 0x90,
                    deltaTime: deltaTime,
                    data: [note.pitch, 80] // Reduced velocity for better sound
                });
                
                // Note off (0x80 = 128 for channel 0)
                midi.track[0].event.push({
                    type: 0x80,
                    deltaTime: Math.round(note.duration * 480),
                    data: [note.pitch, 0]
                });
                
                currentTime = note.start + note.duration;
            }

            // Add end of track
            midi.track[0].event.push({
                type: 0xFF, // Meta event
                deltaTime: 0,
                data: [0x2F, 0x00] // End of track
            });

            // Convert to MIDI bytes
            const midiBytes = this._encodeMIDI(midi);
            return midiBytes.buffer;
        } catch (error) {
            console.error("Error converting to MIDI:", error);
            throw error;
        }
    }

    /**
     * Encode MIDI object to bytes
     * @private
     * @param {Object} midi - MIDI object
     * @returns {Uint8Array} - MIDI bytes
     */
    _encodeMIDI(midi) {
        const bytes = [];
        
        // MIDI header chunk
        bytes.push(0x4D, 0x54, 0x68, 0x64); // "MThd"
        bytes.push(0x00, 0x00, 0x00, 0x06); // Header length (6 bytes)
        bytes.push(0x00, 0x01); // Format 1
        bytes.push(0x00, 0x01); // 1 track
        bytes.push(0x01, 0xE0); // PPQ (480)
        
        // Track chunk
        bytes.push(0x4D, 0x54, 0x72, 0x6B); // "MTrk"
        
        // Track data
        const trackData = [];
        
        // Add all events
        for (const event of midi.track[0].event) {
            // Delta time
            if (event.deltaTime > 0) {
                const deltaBytes = this._encodeVariableLength(event.deltaTime);
                trackData.push(...deltaBytes);
            } else {
                trackData.push(0x00);
            }
            
            // Event data
            trackData.push(event.type);
            trackData.push(...event.data);
        }
        
        // Track length (4 bytes, big-endian)
        const trackLength = trackData.length;
        bytes.push(
            (trackLength >> 24) & 0xFF,
            (trackLength >> 16) & 0xFF,
            (trackLength >> 8) & 0xFF,
            trackLength & 0xFF
        );
        
        // Add track data
        bytes.push(...trackData);
        
        return new Uint8Array(bytes);
    }

    /**
     * Encode variable length quantity
     * @private
     * @param {number} value - The value to encode
     * @returns {Array} - Encoded bytes
     */
    _encodeVariableLength(value) {
        const bytes = [];
        let remaining = value;
        
        while (remaining > 0) {
            let byte = remaining & 0x7F;
            remaining >>= 7;
            
            if (remaining > 0) {
                byte |= 0x80;
            }
            
            bytes.push(byte);
        }
        
        return bytes;
    }

    /**
     * Get initialization status
     * @returns {boolean} - Whether the system is initialized
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Get the RAG system instance
     * @returns {Object|null} - The RAG system instance
     */
    getRAGSystem() {
        return this.ragSystem;
    }
}

// Create a global instance
window.ragConfig = new RAGConfig();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = RAGConfig;
} 