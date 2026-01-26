/**
 * Copyright (c) 2025 Anvita Prasad DMP'25
 * TunerDisplay class for visualizing pitch detection
 */
function TunerDisplay(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.ctx = canvas.getContext("2d");
    this.note = "A";
    this.cents = 0;
    this.frequency = 440;
    this.chromaticMode = true; // Default to chromatic mode

    // Create mode toggle container
    this.modeContainer = document.createElement("div");
    Object.assign(this.modeContainer.style, {
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    });
    canvas.parentElement.appendChild(this.modeContainer);

    // Create mode buttons wrapper
    const buttonsWrapper = document.createElement("div");
    Object.assign(buttonsWrapper.style, {
        display: "flex",
        gap: "4px",
        position: "relative"
    });
    this.modeContainer.appendChild(buttonsWrapper);

    // Create chromatic mode button
    this.chromaticButton = document.createElement("div");
    Object.assign(this.chromaticButton.style, {
        width: "40px",
        height: "32px",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s ease"
    });
    const chromaticIcon = document.createElement("img");
    Object.assign(chromaticIcon, {
        src: "header-icons/chromatic-mode.svg",
        width: "20",
        height: "20",
        alt: ""
    });
    this.chromaticButton.appendChild(chromaticIcon);
    buttonsWrapper.appendChild(this.chromaticButton);

    // Create target pitch mode button
    this.targetPitchButton = document.createElement("div");
    Object.assign(this.targetPitchButton.style, {
        width: "40px",
        height: "32px",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s ease"
    });
    const targetIcon = document.createElement("img");
    Object.assign(targetIcon, {
        src: "header-icons/target-pitch-mode.svg",
        width: "20",
        height: "20",
        alt: ""
    });
    this.targetPitchButton.appendChild(targetIcon);
    buttonsWrapper.appendChild(this.targetPitchButton);

    // Add click handlers
    this.chromaticButton.onclick = () => {
        this.chromaticMode = true;
        this.updateButtonStyles();
    };

    this.targetPitchButton.onclick = () => {
        this.chromaticMode = false;
        this.updateButtonStyles();
    };

    // Initial button styles
    this.updateButtonStyles();
}

/**
 * Updates the styles of mode toggle buttons based on current mode
 */
TunerDisplay.prototype.updateButtonStyles = function () {
    if (this.chromaticMode) {
        this.chromaticButton.style.backgroundColor = platformColor.selectorBackground;
        this.chromaticButton.querySelector("img").style.filter = "brightness(0) invert(1)";
        this.targetPitchButton.style.backgroundColor = "transparent";
        this.targetPitchButton.querySelector("img").style.filter = "none";
    } else {
        this.targetPitchButton.style.backgroundColor = platformColor.selectorBackground;
        this.targetPitchButton.querySelector("img").style.filter = "brightness(0) invert(1)";
        this.chromaticButton.style.backgroundColor = "transparent";
        this.chromaticButton.querySelector("img").style.filter = "none";
    }
};

/**
 * Updates the tuner display with new pitch information
 * @param {string} note - The detected note
 * @param {number} cents - The cents deviation from the note
 * @param {number} frequency - The detected frequency
 */
TunerDisplay.prototype.update = function (note, cents, frequency) {
    this.note = note;
    this.cents = cents;
    this.frequency = frequency;
    this.draw();
};

/**
 * Draws the tuner display
 */
TunerDisplay.prototype.draw = function () {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate positions relative to the meter
    const meterWidth = width * 0.8;
    const meterHeight = 10;
    const meterX = (width - meterWidth) / 2;
    const meterY = height - 80; // Base position of meter

    // Draw the tuning meter background
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // Draw the center line
    ctx.fillStyle = "#000000";
    ctx.fillRect(meterX + meterWidth / 2 - 1, meterY, 2, meterHeight);

    // Draw the indicator
    const indicatorX = meterX + meterWidth / 2 + (this.cents / 50) * (meterWidth / 2);
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(indicatorX - 2, meterY - 5, 4, meterHeight + 10);

    // Position text much lower in the canvas
    // Draw the note
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.fillText(this.note, width / 2, height - 200); // Much lower position

    // Draw the cents deviation
    ctx.font = "24px Arial";
    ctx.fillText(
        (this.cents >= 0 ? "+" : "") + Math.round(this.cents) + "¢",
        width / 2,
        height - 160
    ); // Much lower position

    // Draw the frequency
    ctx.font = "18px Arial";
    ctx.fillText(this.frequency.toFixed(1) + " Hz", width / 2, height - 40); // Near bottom
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
    frequencyToPitch: function (frequency) {
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        if (frequency < C0) {
            return ["C", 0, C0];
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
    calculatePlaybackRate: function (baseCents, adjustment) {
        return Math.pow(2, (baseCents + adjustment) / 1200);
    }
};
if (typeof module !== "undefined") {
    module.exports = { TunerDisplay, TunerUtils };
}
