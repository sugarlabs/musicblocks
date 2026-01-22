// Teaching Tools Widget for Music Blocks
// Provides interactive staff component and real-time feedback system

class TeachingTools {
    constructor(activity) {
        this.activity = activity;
        this.widget = null;
        this.staffSVG = null;
        this.selectedNote = 'quarter';
        this.placedNotes = [];
        this.currentLesson = 'basic-notes';
        this.progress = 0;
        this.lessons = {
            'basic-notes': {
                name: 'Basic Notes',
                target: ['C4', 'D4', 'E4'],
                feedback: 'Place C, D, and E notes on the staff',
                description: 'Learn to place basic notes on the treble clef staff'
            },
            'scales': {
                name: 'C Major Scale',
                target: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
                feedback: 'Complete the C major scale',
                description: 'Practice placing all notes of the C major scale'
            },
            'intervals': {
                name: 'Perfect Fifth',
                target: ['C4', 'G4'],
                feedback: 'Place notes that form a perfect fifth interval',
                description: 'Learn about musical intervals by placing a perfect fifth'
            },
            'chords': {
                name: 'C Major Chord',
                target: ['C4', 'E4', 'G4'],
                feedback: 'Place the notes of a C major chord (C-E-G)',
                description: 'Build your first major chord'
            }
        };
    }

    init() {
        this.createWidget();
        this.setupEventListeners();
    }

    createWidget() {
        // Remove existing widget if present
        if (this.widget) {
            this.widget.remove();
        }

        // Create main widget container
        this.widget = document.createElement('div');
        this.widget.id = 'teachingToolsWidget';
        this.widget.innerHTML = `
            <div class="widget-header">
                <h3>Teaching Tools</h3>
                <button class="close-btn" onclick="teachingTools.close()">&times;</button>
            </div>
            <div class="widget-content">
                <div class="lesson-selector">
                    <select id="lessonSelect">
                        <option value="basic-notes">Basic Notes</option>
                        <option value="scales">C Major Scale</option>
                        <option value="intervals">Perfect Fifth</option>
                        <option value="chords">C Major Chord</option>
                    </select>
                    <div class="lesson-description">
                        ${this.lessons[this.currentLesson].description}
                    </div>
                </div>
                
                <div class="feedback-panel">
                    <div id="feedbackMessage" class="feedback">
                        ${this.lessons[this.currentLesson].feedback}
                    </div>
                </div>
                
                <div class="interactive-staff">
                    <svg id="staffSVG" width="400" height="200" viewBox="0 0 400 200">
                        <!-- Staff lines -->
                        <line x1="50" y1="60" x2="350" y2="60" stroke="#333" stroke-width="1"/>
                        <line x1="50" y1="80" x2="350" y2="80" stroke="#333" stroke-width="1"/>
                        <line x1="50" y1="100" x2="350" y2="100" stroke="#333" stroke-width="1"/>
                        <line x1="50" y1="120" x2="350" y2="120" stroke="#333" stroke-width="1"/>
                        <line x1="50" y1="140" x2="350" y2="140" stroke="#333" stroke-width="1"/>
                        
                        <!-- Treble clef -->
                        <text x="20" y="110" font-family="serif" font-size="40" fill="#333">𝄞</text>
                    </svg>
                </div>
                
                <div class="note-palette">
                    <button class="note-btn selected" data-note="quarter">♩</button>
                    <button class="note-btn" data-note="half">♪</button>
                    <button class="note-btn" data-note="whole">○</button>
                    <button class="note-btn" onclick="teachingTools.clearStaff()">Clear</button>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.progress}%"></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.widget);
        this.staffSVG = document.getElementById('staffSVG');
    }

    setupEventListeners() {
        // Lesson selector
        const lessonSelect = document.getElementById('lessonSelect');
        lessonSelect.addEventListener('change', (e) => {
            this.currentLesson = e.target.value;
            this.resetLesson();
        });

        // Note palette buttons
        document.querySelectorAll('.note-btn[data-note]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.note-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedNote = e.target.dataset.note;
            });
        });

        // Staff click handler
        this.staffSVG.addEventListener('click', (e) => {
            this.handleStaffClick(e);
        });

        // Make widget draggable
        this.makeDraggable();
    }

    handleStaffClick(event) {
        const rect = this.staffSVG.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert click position to note
        const note = this.positionToNote(x, y);
        if (note) {
            this.placeNote(x, y, note);
            this.checkProgress();
        }
    }

    positionToNote(x, y) {
        // Map Y position to musical notes (treble clef)
        const noteMap = {
            40: 'A5',   // Above staff
            50: 'G5',   // Top line
            60: 'F5',   // Space
            70: 'E5',   // Line
            80: 'D5',   // Space
            90: 'C5',   // Line
            100: 'B4',  // Space
            110: 'A4',  // Line
            120: 'G4',  // Space
            130: 'F4',  // Line
            140: 'E4',  // Space
            150: 'D4',  // Below staff
            160: 'C4'   // Below staff
        };

        // Find closest staff position
        let closestY = 60;
        let minDistance = Math.abs(y - 60);
        
        for (let staffY = 40; staffY <= 160; staffY += 10) {
            const distance = Math.abs(y - staffY);
            if (distance < minDistance) {
                minDistance = distance;
                closestY = staffY;
            }
        }

        return noteMap[closestY];
    }

    placeNote(x, y, note) {
        // Snap to staff lines/spaces
        const snappedY = Math.round((y - 40) / 10) * 10 + 40;
        
        // Create note element
        const noteElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        noteElement.setAttribute('x', x);
        noteElement.setAttribute('y', snappedY + 5);
        noteElement.setAttribute('font-family', 'serif');
        noteElement.setAttribute('font-size', '20');
        noteElement.setAttribute('fill', '#2196F3');
        noteElement.setAttribute('text-anchor', 'middle');
        noteElement.setAttribute('class', 'placed-note');
        noteElement.textContent = this.getNoteSymbol(this.selectedNote);
        
        // Add click handler for removal
        noteElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNote(noteElement, note);
        });

        this.staffSVG.appendChild(noteElement);
        this.placedNotes.push({ element: noteElement, note: note });
    }

    removeNote(element, note) {
        element.remove();
        this.placedNotes = this.placedNotes.filter(n => n.element !== element);
        this.checkProgress();
    }

    getNoteSymbol(noteType) {
        const symbols = {
            'quarter': '♩',
            'half': '♪', 
            'whole': '○'
        };
        return symbols[noteType] || '♩';
    }

    checkProgress() {
        const lesson = this.lessons[this.currentLesson];
        const placedNoteNames = this.placedNotes.map(n => n.note);
        const targetNotes = lesson.target;
        
        // Check how many target notes are placed
        let correctNotes = 0;
        targetNotes.forEach(targetNote => {
            if (placedNoteNames.includes(targetNote)) {
                correctNotes++;
            }
        });

        this.progress = (correctNotes / targetNotes.length) * 100;
        this.updateProgressBar();
        this.updateFeedback(correctNotes, targetNotes.length);
    }

    updateProgressBar() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = this.progress + '%';
        }
    }

    updateFeedback(correct, total) {
        const feedbackElement = document.getElementById('feedbackMessage');
        if (!feedbackElement) return;

        feedbackElement.className = 'feedback';
        
        if (correct === total) {
            feedbackElement.classList.add('success');
            feedbackElement.textContent = 'Excellent! Lesson completed!';
        } else if (correct > 0) {
            feedbackElement.classList.add('success');
            feedbackElement.textContent = `Good! ${correct}/${total} notes correct. Keep going!`;
        } else {
            feedbackElement.classList.add('error');
            feedbackElement.textContent = this.lessons[this.currentLesson].feedback;
        }
    }

    clearStaff() {
        // Remove all placed notes
        document.querySelectorAll('.placed-note').forEach(note => note.remove());
        this.placedNotes = [];
        this.progress = 0;
        this.updateProgressBar();
        this.updateFeedback(0, this.lessons[this.currentLesson].target.length);
    }

    resetLesson() {
        this.clearStaff();
        const feedbackElement = document.getElementById('feedbackMessage');
        const descriptionElement = document.querySelector('.lesson-description');
        
        if (feedbackElement) {
            feedbackElement.className = 'feedback';
            feedbackElement.textContent = this.lessons[this.currentLesson].feedback;
        }
        
        if (descriptionElement) {
            descriptionElement.textContent = this.lessons[this.currentLesson].description;
        }
    }

    makeDraggable() {
        const header = this.widget.querySelector('.widget-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === header || e.target.tagName === 'H3') {
                isDragging = true;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                this.widget.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    show() {
        if (!this.widget) {
            this.init();
        }
        this.widget.style.display = 'block';
    }

    close() {
        if (this.widget) {
            this.widget.style.display = 'none';
        }
    }

    toggle() {
        if (!this.widget) {
            this.init();
            this.show();
        } else {
            const isVisible = this.widget.style.display !== 'none';
            if (isVisible) {
                this.close();
            } else {
                this.show();
            }
        }
    }
}

// Global instance
let teachingTools = null;

// Initialize function that can be called externally
function initializeTeachingTools(activity) {
    if (!teachingTools && activity) {
        teachingTools = new TeachingTools(activity);
        
        // Connect to toolbar button
        const teachingToolsIcon = document.getElementById('teachingToolsIcon');
        if (teachingToolsIcon) {
            teachingToolsIcon.setAttribute('data-tooltip', 'Teaching Tools');
            teachingToolsIcon.addEventListener('click', () => {
                teachingTools.toggle();
            });
        }
    }
    return teachingTools;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for activity to be available
    const initTeachingTools = () => {
        if (typeof activity !== 'undefined') {
            teachingTools = new TeachingTools(activity);
            
            // Connect to toolbar button
            const teachingToolsIcon = document.getElementById('teachingToolsIcon');
            if (teachingToolsIcon) {
                // Ensure tooltip is set
                teachingToolsIcon.setAttribute('data-tooltip', 'Teaching Tools');
                teachingToolsIcon.addEventListener('click', () => {
                    teachingTools.toggle();
                });
            }
        } else {
            setTimeout(initTeachingTools, 100);
        }
    };
    
    initTeachingTools();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeachingTools;
}