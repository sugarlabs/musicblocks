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

const browserPath = {
    basename(path, ext = '') {
        const filename = path.split('/').pop().split('\\').pop();
        if (ext && filename.endsWith(ext)) {
            return filename.slice(0, -ext.length);
        }
        return filename;
    },
    
    dirname(path) {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/') || '.';
    },
    
    join(...parts) {
        return parts.join('/').replace(/\/+/g, '/');
    }
};

class GoogleGenerativeAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    getGenerativeModel(config) {
        return new GenerativeModel(this.apiKey, config.model, this.baseUrl);
    }
}

class GenerativeModel {
    constructor(apiKey, modelName, baseUrl) {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.baseUrl = baseUrl;
    }

    async embedContent(content) {
        const response = await fetch(`${this.baseUrl}/${this.modelName}:embedContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: {
                    parts: [{ text: content }]
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Embedding failed: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            embedding: data.embedding.values
        };
    }

    async generateContent(prompt) {
        const response = await fetch(`${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            response: {
                text: () => data.candidates[0].content.parts[0].text
            }
        };
    }
}

// Simplified file system operations for browser
const browserFS = {
    async readFileSync(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load ${path}`);
        }
        return await response.arrayBuffer();
    },

    async writeFileSync(path, data) {
        // In browser, we can't write files directly
        // This would typically save to localStorage or download
        console.log(`Would save to ${path}:`, data);
        return true;
    },

    async ensureDir(path) {
        // No-op in browser
        return true;
    },

    async writeJson(path, data) {
        // Save to localStorage in browser
        localStorage.setItem(path, JSON.stringify(data));
        return true;
    },

    async readJson(path) {
        // Read from localStorage in browser
        const data = localStorage.getItem(path);
        if (!data) {
            throw new Error(`File not found: ${path}`);
        }
        return JSON.parse(data);
    },

    async pathExists(path) {
        // Check localStorage in browser
        return localStorage.getItem(path) !== null;
    }
};

// Simplified glob for browser
const browserGlob = {
    sync(pattern) {
        // For now, return a hardcoded list of MIDI files
        // In a real implementation, you'd have a list of available MIDI files
        return [
            'examples/twinkle-twinkle.html',
            'examples/hot-cross-buns.html',
            'examples/mary-had-a-little-lamb.html'
        ];
    }
};

// Simplified MidiParser for browser
const MidiParser = {
    parse(data) {
        // Simplified MIDI parsing for browser
        // This is a placeholder - you'd need a proper MIDI parser
        return {
            header: { PPQ: 480 },
            track: [{
                event: []
            }]
        };
    },

    write(midi) {
        // Simplified MIDI writing for browser
        // This is a placeholder - you'd need a proper MIDI writer
        return new Uint8Array([0x4D, 0x54, 0x68, 0x64]); // MThd
    }
};

class GeminiMusicRAG {
    constructor(apiKey) {
        /** Initialize the Gemini Music RAG system */
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' });
        this.generationModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        
        this.documents = [];
        this.embeddings = [];
        this.filenames = [];
    }

    async extractComprehensiveMetadata(midiPath) {
        /** Extract comprehensive musical metadata from a MIDI file */
        try {
            const midiData = await browserFS.readFileSync(midiPath);
            const midi = MidiParser.parse(midiData);
            
            // Basic file info
            const filename = midiPath.split('/').pop().replace('.mid', '').toLowerCase();
            
            // Extract musical features
            const allNotes = [];
            const instruments = new Set();
            let totalTicks = 0;
            let tempo = 120; // Default tempo
            
            // Process tracks
            midi.track.forEach((track, trackIndex) => {
                let currentTime = 0;
                
                track.event.forEach(event => {
                    if (event.type === 8) { // Note off
                        const note = {
                            pitch: event.data[0],
                            velocity: event.data[1],
                            start: currentTime,
                            end: currentTime + event.deltaTime
                        };
                        allNotes.push(note);
                    } else if (event.type === 9) { // Note on
                        if (event.data[1] > 0) { // Velocity > 0
                            const note = {
                                pitch: event.data[0],
                                velocity: event.data[1],
                                start: currentTime,
                                end: null
                            };
                            allNotes.push(note);
                        }
                    } else if (event.type === 15) { // Meta event
                        if (event.data[0] === 81) { // Tempo
                            tempo = 60000000 / event.data[1];
                        }
                    }
                    
                    currentTime += event.deltaTime;
                    totalTicks = Math.max(totalTicks, currentTime);
                });
            });
            
            // Calculate duration in seconds
            const duration = (totalTicks / midi.header.PPQ) * (60 / tempo);
            
            if (allNotes.length > 0) {
                const pitches = allNotes.map(note => note.pitch);
                const velocities = allNotes.map(note => note.velocity);
                
                // Calculate musical statistics
                const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
                const pitchRange = Math.max(...pitches) - Math.min(...pitches);
                const mostCommonPitch = this.getMostFrequent(pitches);
                const noteDensity = allNotes.length / duration;
                
                // Determine musical characteristics
                let pitchCharacter = "medium";
                if (avgPitch > 70) pitchCharacter = "high";
                else if (avgPitch < 50) pitchCharacter = "low";
                
                let tempoCharacter = "medium";
                if (tempo > 140) tempoCharacter = "fast";
                else if (tempo < 80) tempoCharacter = "slow";
                
                // Create focused text description for better Gemini embeddings
                const focusedText = `Song: ${filename}. Tempo: ${Math.round(tempo)} BPM. Instruments: ${Array.from(instruments).slice(0, 5).join(', ')}. Style: ${tempoCharacter} tempo. Pitch: ${pitchCharacter}.`;
                
                // Keep the detailed text for reference
                const detailedText = `Song: ${filename}. Tempo: ${Math.round(tempo)} BPM (${tempoCharacter}), Duration: ${duration.toFixed(1)}s. Instruments: ${Array.from(instruments).join(', ')}. Musical features: ${allNotes.length} notes, average pitch ${Math.round(avgPitch)} (${pitchCharacter}), pitch range ${pitchRange}, note density ${noteDensity.toFixed(1)} notes/sec.`;
                
                return {
                    filename,
                    filePath: midiPath,
                    durationSeconds: duration,
                    tempoBpm: Math.round(tempo),
                    tempoCharacter,
                    instruments: Array.from(instruments),
                    totalNotes: allNotes.length,
                    minPitch: Math.min(...pitches),
                    maxPitch: Math.max(...pitches),
                    avgPitch: Math.round(avgPitch),
                    pitchCharacter,
                    avgVelocity: velocities.reduce((a, b) => a + b, 0) / velocities.length,
                    noteDensity,
                    pitchRange,
                    mostCommonPitch,
                    focusedText,
                    detailedText,
                    fullText: focusedText // Use focused text for embeddings
                };
            } else {
                return {
                    filename,
                    filePath: midiPath,
                    error: "No notes found",
                    focusedText: `Song: ${filename}. Error: No notes found in MIDI file.`,
                    detailedText: `Song: ${filename}. Error: No notes found in MIDI file.`,
                    fullText: `Song: ${filename}. Error: No notes found in MIDI file.`
                };
            }
        } catch (error) {
            return {
                filename: browserPath.basename(midiPath, '.mid').toLowerCase(),
                filePath: midiPath,
                error: error.message,
                focusedText: `Song: ${browserPath.basename(midiPath, '.mid').toLowerCase()}. Error: ${error.message}`,
                detailedText: `Song: ${browserPath.basename(midiPath, '.mid').toLowerCase()}. Error: ${error.message}`,
                fullText: `Song: ${browserPath.basename(midiPath, '.mid').toLowerCase()}. Error: ${error.message}`
            };
        }
    }

    getMostFrequent(arr) {
        /** Get the most frequent element in an array */
        const counts = {};
        arr.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    async processMidiDataset(datasetPath = "midi_dataset") {
        /** Process all MIDI files in the dataset */
        const midiFiles = browserGlob.sync(`${datasetPath}/**/*.mid`);
        console.log(`Found ${midiFiles.length} MIDI files`);
        
        // If no MIDI files found, throw error instead of using sample data
        if (midiFiles.length === 0) {
            throw new Error("No MIDI files found in dataset. Please provide real MIDI files or use loadDocuments() with existing processed data.");
        }
        
        this.documents = [];
        for (const file of midiFiles) {
            const metadata = await this.extractComprehensiveMetadata(file);
            this.documents.push({
                pageContent: metadata.fullText,
                metadata
            });
        }
        
        console.log(`Processed ${this.documents.length} documents`);
        return this.documents;
    }



    async generateEmbeddings() {
        /** Generate embeddings for all documents using Gemini */
        console.log("Generating embeddings...");
        this.embeddings = [];
        this.filenames = [];
        
        for (const doc of this.documents) {
            try {
                const result = await this.embeddingModel.embedContent(doc.pageContent);
                this.embeddings.push(result.embedding);
                this.filenames.push(doc.metadata.filename);
            } catch (error) {
                console.error(`Error generating embedding for ${doc.metadata.filename}:`, error);
                // Use zero vector as fallback
                this.embeddings.push(new Array(768).fill(0));
                this.filenames.push(doc.metadata.filename);
            }
        }
        
        console.log(`Generated ${this.embeddings.length} embeddings`);
    }

    async saveVectorstore(savePath = "faiss_index_gemini") {
        /** Save the vector store data */
        const data = {
            embeddings: this.embeddings,
            documents: this.documents,
            filenames: this.filenames
        };
        
        await browserFS.ensureDir(savePath);
        await browserFS.writeJson(`${savePath}/index.json`, data);
        console.log(`Vector store saved to ${savePath}`);
    }

    async loadVectorstore(loadPath = "faiss_index_gemini") {
        /** Load an existing vector store */
        const data = await browserFS.readJson(`${loadPath}/index.json`);
        this.embeddings = data.embeddings;
        this.documents = data.documents;
        this.filenames = data.filenames;
        console.log(`Vector store loaded from ${loadPath}`);
    }

    cosineSimilarity(vecA, vecB) {
        /** Calculate cosine similarity between two vectors */
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (normA * normB);
    }

    async searchSimilarMusic(query, k = 1) {
        /** Search for similar music using Gemini embeddings */
        if (!this.embeddings.length) {
            throw new Error("Vector store not loaded. Call loadVectorstore() first.");
        }
        
        // Generate embedding for query
        const queryResult = await this.embeddingModel.embedContent(query);
        const queryEmbedding = queryResult.embedding;
        
        // Calculate similarities
        const similarities = this.embeddings.map((embedding, index) => ({
            index,
            similarity: this.cosineSimilarity(queryEmbedding, embedding),
            document: this.documents[index]
        }));
        
        // Sort by similarity and return top k
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, k).map(item => item.document);
    }

    async advancedSearch(query, k = 1) {
        /** Advanced search with multiple query strategies */
        if (!this.embeddings.length) {
            throw new Error("Vector store not loaded. Call loadVectorstore() first.");
        }
        
        // Multiple search queries for better coverage
        const searchQueries = [
            query,
            `${query} tempo style`,
            `${query} instruments`,
            `${query} musical characteristics`
        ];
        
        const allDocs = [];
        for (const searchQuery of searchQueries) {
            const docs = await this.searchSimilarMusic(searchQuery, k);
            allDocs.push(...docs);
        }
        
        // Remove duplicates based on filename
        const seen = new Set();
        const uniqueDocs = [];
        for (const doc of allDocs) {
            if (!seen.has(doc.metadata.filename)) {
                seen.add(doc.metadata.filename);
                uniqueDocs.push(doc);
            }
        }
        
        return uniqueDocs.slice(0, k);
    }

    async generateMusicWithGemini(docs, query = "Generate a new melody") {
        /** Generate music using Gemini API based on retrieved documents */
        
        // Prepare context from retrieved documents
        const contextParts = docs.map((doc, i) => {
            return `Song ${i+1}: ${doc.metadata.filename}
  Tempo: ${doc.metadata.tempoBpm || 'unknown'} BPM
  Key: ${doc.metadata.key || 'unknown'}
  Instruments: ${doc.metadata.instruments || []}
  Musical characteristics: ${doc.pageContent}`;
        });
        
        const context = contextParts.join('\n\n');
        
        // Create a detailed prompt for Gemini with better rhythm instructions
        const prompt = `Based on these musical examples:
${context}

Query: ${query}

Please generate a new MIDI note sequence in the format: pitch:start_time-end_time
Examples of good rhythm patterns:
- Quarter notes: 60:0.00-0.25 62:0.25-0.50 64:0.50-0.75 65:0.75-1.00
- Eighth notes: 60:0.00-0.125 62:0.125-0.25 64:0.25-0.375 65:0.375-0.50
- Mixed rhythm: 60:0.00-0.5 62:0.5-0.75 64:0.75-1.0 65:1.0-1.125 67:1.125-1.25

Requirements:
- Use only valid MIDI pitches (0-127, middle C = 60)
- Create a melodic sequence of at least 200 notes
- Use varied note durations as needed, including sixteenth notes, quarter notes, third notes,and eighth notes
- Make timing precise and musical with good rhythm flow
- Create interesting melodic movement (not just scales)
- Must be in the same key as the given MIDI files
- Match the style and tempo characteristics of the given MIDI files
- Start at time 0.0 and create a cohesive 8-16 second musical phrase
- Output ONLY the MIDI sequence, no other text

Generated MIDI sequence:`;
        
        try {
            const result = await this.generationModel.generateContent(prompt);
            const response = await result.response;
            
            if (response.text()) {
                return response.text().trim();
            } else {
                return "No response generated";
            }
        } catch (error) {
            console.error("Error with Gemini API:", error);
            return null;
        }
    }

    textToMidi(noteString, outputPath = "generated.mid") {
        /** Convert note string to MIDI file */
        try {
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
            const notes = noteString.trim().split(' ');
            
            for (const noteRepr of notes) {
                if (noteRepr.includes(':') && noteRepr.includes('-')) {
                    const [pitch, times] = noteRepr.split(':');
                    const [start, end] = times.split('-').map(Number);
                    
                    // Validate MIDI pitch range (0-127)
                    const pitchNum = parseInt(pitch);
                    if (pitchNum >= 0 && pitchNum <= 127) {
                        // Note on
                        midi.track[0].event.push({
                            type: 9,
                            deltaTime: Math.round((start - currentTime) * 480),
                            data: [pitchNum, 100]
                        });
                        
                        // Note off
                        midi.track[0].event.push({
                            type: 8,
                            deltaTime: Math.round((end - start) * 480),
                            data: [pitchNum, 0]
                        });
                        
                        currentTime = end;
                    }
                }
            }
            
            // Convert to MIDI file format and save
            const midiData = MidiParser.write(midi);
            browserFS.writeFileSync(outputPath, midiData);
            
            console.log(`MIDI file saved as ${outputPath}`);
            return true;
        } catch (error) {
            console.error("Error creating MIDI:", error);
            return false;
        }
    }

    extractNotesFromText(text) {
        /** Extract note sequences from generated text */
        const notePattern = /(\d+):(\d+\.\d+)-(\d+\.\d+)/g;
        const matches = [...text.matchAll(notePattern)];
        
        const notes = matches.map(match => {
            const [, pitch, start, end] = match;
            return `${pitch}:${start}-${end}`;
        });
        
        return notes.join(' ');
    }

    async saveDocuments(filepath = "midi_documents_gemini.json") {
        /** Save processed documents to file */
        await browserFS.writeJson(filepath, this.documents);
        console.log(`Documents saved to ${filepath}`);
    }

    async loadDocuments(filepath = "midi_documents_gemini.json") {
        /** Load processed documents from file */
        this.documents = await browserFS.readJson(filepath);
        console.log(`Loaded ${this.documents.length} documents from ${filepath}`);
    }
}

// Browser-compatible main function
async function initializeRAGSystem(apiKey) {
    /** Initialize the RAG system for browser use */
    
    if (!apiKey) {
        throw new Error("API key is required");
    }
    
    const ragSystem = new GeminiMusicRAG(apiKey);

    // Use the improved vector store that we created
    if (await browserFS.pathExists("faiss_index_gemini")) {
        console.log("Loading JavaScript Gemini vector store...");
        await ragSystem.loadVectorstore("faiss_index_gemini");
    } else {
        console.log("JavaScript vector store not found. Creating it...");
        if (await browserFS.pathExists("midi_documents_gemini.json")) {
            console.log("Loading existing documents...");
            await ragSystem.loadDocuments();
        } else {
            console.log("Processing MIDI dataset...");
            await ragSystem.processMidiDataset();
            await ragSystem.saveDocuments();
        }
        
        // Generate embeddings and save vector store
        await ragSystem.generateEmbeddings();
        await ragSystem.saveVectorstore("faiss_index_gemini");
    }
    
    return ragSystem;
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.GeminiMusicRAG = GeminiMusicRAG;
    window.initializeRAGSystem = initializeRAGSystem;
}

// Export for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiMusicRAG;
} 