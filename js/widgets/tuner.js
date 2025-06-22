/**
 * TunerDisplay class for visualizing pitch detection
 */
function TunerDisplay(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.ctx = canvas.getContext('2d');
    this.note = 'A';
    this.cents = 0;
    this.frequency = 440;
}

/**
 * Updates the tuner display with new pitch information
 * @param {string} note - The detected note
 * @param {number} cents - The cents deviation from the note
 * @param {number} frequency - The detected frequency
 */
TunerDisplay.prototype.update = function(note, cents, frequency) {
    this.note = note;
    this.cents = cents;
    this.frequency = frequency;
    this.draw();
};

/**
 * Draws the tuner display
 */
TunerDisplay.prototype.draw = function() {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw the note
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.fillText(this.note, width / 2, height / 2);
    
    // Draw the cents deviation
    ctx.font = '24px Arial';
    ctx.fillText((this.cents >= 0 ? '+' : '') + Math.round(this.cents) + '¢', width / 2, height / 2 + 30);
    
    // Draw the frequency
    ctx.font = '18px Arial';
    ctx.fillText(this.frequency.toFixed(1) + ' Hz', width / 2, height / 2 + 60);
    
    // Draw the tuning meter
    const meterWidth = width * 0.8;
    const meterHeight = 10;
    const meterX = (width - meterWidth) / 2;
    const meterY = height - 40;
    
    // Draw the background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    // Draw the center line
    ctx.fillStyle = '#000000';
    ctx.fillRect(meterX + meterWidth / 2 - 1, meterY, 2, meterHeight);
    
    // Draw the indicator
    const indicatorX = meterX + (meterWidth / 2) + (this.cents / 50) * (meterWidth / 2);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(indicatorX - 2, meterY - 5, 4, meterHeight + 10);
};

/**
 * TunerUtils class for pitch detection and calculation
 */
const TunerUtils = {
    /**
     * Converts a frequency to pitch information
     * @param {number} frequency - The frequency to convert
     * @returns {Array} [note, cents, frequency]
     */
    frequencyToPitch: function(frequency) {
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        if (frequency < C0) {
            return ['C', 0, C0];
        }
        
        const h = Math.round(12 * Math.log2(frequency / C0));
        const octave = Math.floor(h / 12);
        const n = h % 12;
        const cents = Math.round(1200 * Math.log2(frequency / (C0 * Math.pow(2, h / 12))));
        
        return [noteNames[n], cents, frequency];
    },
    
    /**
     * Calculates the playback rate for a given cents adjustment
     * @param {number} baseCents - The base cents value
     * @param {number} adjustment - The cents adjustment to apply
     * @returns {number} The calculated playback rate
     */
    calculatePlaybackRate: function(baseCents, adjustment) {
        return Math.pow(2, (baseCents + adjustment) / 1200);
    }
}; 