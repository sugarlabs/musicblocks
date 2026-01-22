// Teaching Tools Widget for Music Theory Lessons
class TeachingTools {
    constructor(activity) {
        this.activity = activity;
        this.isVisible = false;
        this.currentLesson = null;
        this.userProgress = {};
        this.feedbackSystem = new FeedbackSystem();
        this.interactiveStaff = new InteractiveStaff();
        this.init();
    }

    init() {
        this.createWidget();
        this.setupEventListeners();
    }

    createWidget() {
        const widgetHTML = `
            <div id="teachingToolsWidget" class="widget" style="display: none;">
                <div class="widget-header">
                    <h3>Teaching Tools</h3>
                    <button id="closeTeachingTools" class="close-btn">&times;</button>
                </div>
                <div class="widget-content">
                    <div class="lesson-selector">
                        <select id="lessonSelect">
                            <option value="">Select a Lesson</option>
                            <option value="note-placement">Note Placement</option>
                            <option value="intervals">Intervals</option>
                            <option value="scales">Scales</option>
                            <option value="chords">Chords</option>
                        </select>
                    </div>
                    <div id="interactiveStaff" class="interactive-staff"></div>
                    <div id="feedbackPanel" class="feedback-panel"></div>
                    <div class="progress-bar">
                        <div id="progressFill" class="progress-fill"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        this.widget = document.getElementById('teachingToolsWidget');
    }

    setupEventListeners() {
        document.getElementById('closeTeachingTools').onclick = () => this.hide();
        document.getElementById('lessonSelect').onchange = (e) => this.loadLesson(e.target.value);
    }

    show() {
        this.widget.style.display = 'block';
        this.isVisible = true;
        this.interactiveStaff.render();
    }

    hide() {
        this.widget.style.display = 'none';
        this.isVisible = false;
    }

    loadLesson(lessonType) {
        this.currentLesson = lessonType;
        this.interactiveStaff.setLesson(lessonType);
        this.feedbackSystem.reset();
        this.updateProgress(0);
    }

    updateProgress(percentage) {
        document.getElementById('progressFill').style.width = percentage + '%';
    }
}

class InteractiveStaff {
    constructor() {
        this.notes = [];
        this.currentLesson = null;
        this.staffLines = 5;
        this.notePositions = {};
    }

    render() {
        const container = document.getElementById('interactiveStaff');
        container.innerHTML = `
            <svg id="staffSVG" width="400" height="200" viewBox="0 0 400 200">
                ${this.createStaffLines()}
                ${this.createClef()}
                <g id="notesGroup"></g>
            </svg>
            <div class="note-palette">
                <button class="note-btn" data-note="quarter">♩</button>
                <button class="note-btn" data-note="half">♪</button>
                <button class="note-btn" data-note="whole">○</button>
            </div>
        `;
        this.setupStaffInteraction();
    }

    createStaffLines() {
        let lines = '';
        for (let i = 0; i < this.staffLines; i++) {
            const y = 40 + (i * 20);
            lines += `<line x1="50" y1="${y}" x2="350" y2="${y}" stroke="#000" stroke-width="1"/>`;
        }
        return lines;
    }

    createClef() {
        return `<text x="20" y="80" font-size="40" font-family="serif">𝄞</text>`;
    }

    setupStaffInteraction() {
        const svg = document.getElementById('staffSVG');
        svg.onclick = (e) => this.placeNote(e);
        
        document.querySelectorAll('.note-btn').forEach(btn => {
            btn.onclick = () => this.selectNoteType(btn.dataset.note);
        });
    }

    placeNote(event) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const notePosition = this.getStaffPosition(y);
        const note = this.createNote(x, notePosition.y, notePosition.pitch);
        
        this.notes.push(note);
        this.renderNote(note);
        this.checkAnswer(note);
    }

    getStaffPosition(y) {
        const lineHeight = 20;
        const staffStart = 40;
        const position = Math.round((y - staffStart) / (lineHeight / 2));
        
        const pitches = ['F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4'];
        const pitch = pitches[position] || 'C4';
        
        return {
            y: staffStart + (position * (lineHeight / 2)),
            pitch: pitch
        };
    }

    createNote(x, y, pitch) {
        return {
            id: Date.now(),
            x: x,
            y: y,
            pitch: pitch,
            type: this.selectedNoteType || 'quarter'
        };
    }

    renderNote(note) {
        const notesGroup = document.getElementById('notesGroup');
        const noteSymbol = this.getNoteSymbol(note.type);
        
        const noteElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        noteElement.setAttribute('x', note.x);
        noteElement.setAttribute('y', note.y + 5);
        noteElement.setAttribute('font-size', '20');
        noteElement.setAttribute('font-family', 'serif');
        noteElement.textContent = noteSymbol;
        noteElement.setAttribute('data-note-id', note.id);
        
        notesGroup.appendChild(noteElement);
    }

    getNoteSymbol(type) {
        const symbols = {
            quarter: '♩',
            half: '♪',
            whole: '○'
        };
        return symbols[type] || '♩';
    }

    selectNoteType(type) {
        this.selectedNoteType = type;
        document.querySelectorAll('.note-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector(`[data-note="${type}"]`).classList.add('selected');
    }

    setLesson(lessonType) {
        this.currentLesson = lessonType;
        this.notes = [];
        document.getElementById('notesGroup').innerHTML = '';
    }

    checkAnswer(note) {
        const feedback = new FeedbackSystem();
        feedback.evaluateNote(note, this.currentLesson);
    }
}

class FeedbackSystem {
    constructor() {
        this.correctAnswers = 0;
        this.totalAttempts = 0;
        this.lessons = {
            'note-placement': {
                target: ['C4', 'E4', 'G4'],
                message: 'Place notes on C, E, and G lines'
            },
            'intervals': {
                target: ['C4', 'E4'],
                message: 'Create a major third interval'
            },
            'scales': {
                target: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
                message: 'Build a C major scale'
            }
        };
    }

    evaluateNote(note, lessonType) {
        this.totalAttempts++;
        const lesson = this.lessons[lessonType];
        
        if (!lesson) return;
        
        const isCorrect = lesson.target.includes(note.pitch);
        
        if (isCorrect) {
            this.correctAnswers++;
            this.showFeedback('Correct! Well done!', 'success');
        } else {
            this.showFeedback(`Try again. Expected: ${lesson.target.join(', ')}`, 'error');
        }
        
        this.updateProgress();
    }

    showFeedback(message, type) {
        const panel = document.getElementById('feedbackPanel');
        panel.innerHTML = `<div class="feedback ${type}">${message}</div>`;
        
        setTimeout(() => {
            panel.innerHTML = '';
        }, 3000);
    }

    updateProgress() {
        const percentage = (this.correctAnswers / Math.max(this.totalAttempts, 1)) * 100;
        document.getElementById('progressFill').style.width = percentage + '%';
    }

    reset() {
        this.correctAnswers = 0;
        this.totalAttempts = 0;
        document.getElementById('feedbackPanel').innerHTML = '';
        document.getElementById('progressFill').style.width = '0%';
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TeachingTools, InteractiveStaff, FeedbackSystem };
}