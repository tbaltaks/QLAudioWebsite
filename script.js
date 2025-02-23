"use strict";

// === THEME TOGGLE ===
const themeToggle = document.getElementById('theme-toggle');

// Check for saved theme preference
const currentTheme = localStorage.getItem('theme') || 'light-mode';
document.body.classList.add(currentTheme);

// Function to update button text
const updateButtonText = () => {
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
};

// Set initial button text
updateButtonText();

// Toggle Theme on Click
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark-mode' : 'light-mode');
    updateButtonText();
});


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 


// === AUDIO PLAYBACK ===
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const cells = document.querySelectorAll(".audio-cell");

const fadeDuration = 4; // Fade duration in seconds
const animationDuration = 260; // in milliseconds
const storedCellData = new Map(); // Store per-cell audio info

// Load and decode audio files for each button
async function loadAudio(cell) {
    const audioURL = cell.dataset.audio;
    if (!audioURL) return;

    try {
        const response = await fetch(audioURL);
        if (!response.ok) throw new Error("Failed to fetch audio");

        const arrayBuffer = await response.arrayBuffer();
        const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`Decoded AudioBuffer for ${audioURL}`);

        storedCellData.set(cell, {
            buffer: decodedAudioBuffer,
            sourceNode: null,
            gainNode: null,
            isPlaying: false,
            isActive: false,
            visualizer: cell.querySelector(".visualizer"),
            stems: cell.querySelectorAll(".stem"),
            visHeight: cell.querySelector(".visualizer").clientHeight,
            baseStemHeight: parseFloat(window.getComputedStyle(cell.querySelector(".stem")).height),
        });

        const cellData = storedCellData.get(cell);
        cellData.MAX_EXTRA_HEIGHT = cellData.visHeight * 0.55;
        cellData.MAX_TOTAL_HEIGHT = cellData.baseStemHeight + cellData.MAX_EXTRA_HEIGHT;

    } catch (error) {
        console.error("Error loading audio:", error);
    }
}

// Initialise all cells
cells.forEach(cell => {
  loadAudio(cell);
});


// === AUDIO CONTROL ===
function playAudio(cell) {
  if (!storedCellData.has(cell)) {
      console.error("Audio not loaded yet for this cell");
      return;
  }

  const cellData = storedCellData.get(cell);

  if (audioContext.state === "suspended") {
      audioContext.resume();
  }

  if (cellData.sourceNode) {
      // If already fading out, stop fade and fade in
      fadeGain(cellData.gainNode, 1, fadeDuration);
  } else {
      // Create a new source and gain node
      cellData.sourceNode = audioContext.createBufferSource();
      cellData.sourceNode.buffer = cellData.buffer;
      cellData.sourceNode.loop = true;

      cellData.gainNode = audioContext.createGain();
      cellData.gainNode.gain.value = 0;

      cellData.sourceNode.connect(cellData.gainNode);
      cellData.gainNode.connect(audioContext.destination);
      cellData.sourceNode.start(0);

      setupAudioVisualizer(cell, cellData.gainNode)
  }

  cellData.isPlaying = true;
  fadeGain(cellData.gainNode, 1, fadeDuration);
}

// Stop audio with fade-out
function stopAudio(cell) {
  if (!storedCellData.has(cell)) return;

  const cellData = storedCellData.get(cell);

  if (cellData.sourceNode && cellData.gainNode) {
      fadeGain(cellData.gainNode, 0, fadeDuration, () => {
          if (!cellData.isActive) { // Ensure it's still meant to be off
              cellData.sourceNode.stop();
              cellData.sourceNode.disconnect();
              cellData.gainNode.disconnect();
              cellData.sourceNode = null;
              cellData.isPlaying = false;
              stopVisualizer(cell);
          }
      });
  }
}


// === AUDIO FADE LOGIC ===
function fadeGain(gainNode, targetValue, durationInSeconds, callback) {
    if (!gainNode) return;
    
    const startValue = gainNode.gain.value;
    const startTime = audioContext.currentTime;

    function step() {
        const elapsed = audioContext.currentTime - startTime;
        let t = Math.min(elapsed / durationInSeconds, 1);
        let eased = t * t * (3 - 2 * t);
        let newValue = startValue + (targetValue - startValue) * eased;

        gainNode.gain.setValueAtTime(newValue, audioContext.currentTime);

        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            if (callback) callback();
        }
    }

    requestAnimationFrame(step);
}


// === AUDIO VISUALIZER ===
function setupAudioVisualizer(cell, gainNode) {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  // Connect the gain node to this cell's analyser (do not reconnect to destination)
  gainNode.connect(analyser);
  
  // Store these in the cell's audioData for later use.
  const cellData = storedCellData.get(cell);
  cellData.analyser = analyser;
  cellData.dataArray = dataArray;
  
  // Start the update loop for this cell.
  updateVisualizer(cell);
}

// Function to map frequencies into visualizer stems
function gatherSamplesIntoBands(frequencyData, analyser, numStems, maxFrequency) {
    const sampleRate = audioContext.sampleRate;
    const binResolution = sampleRate / analyser.fftSize;
    const capBin = Math.floor(maxFrequency / binResolution);
    let totalBins = Math.min(frequencyData.length, capBin);

    let bandedSampleData = new Array(numStems).fill(0);
    let sampleIndex = 0;
    let rawSampleCount = 1;

    for (let i = 0; i < numStems; i++) {
        let sampleSum = 0, count = 0, roundedSampleCount = Math.floor(rawSampleCount + 0.5);
        
        for (let j = 0; j < roundedSampleCount && sampleIndex < totalBins; j++) {
            sampleSum += frequencyData[sampleIndex];
            count++;
            sampleIndex++;
        }

        let sampleAverage = count > 0 ? sampleSum / count : 0;
        bandedSampleData[i] = sampleAverage * Math.max(((i + 1) * 0.1), 1);
        rawSampleCount *= 1.28;
    }

    return bandedSampleData;
}

// The update loop for a single cell's visualizer.
function updateVisualizer(cell) {
    const cellData = storedCellData.get(cell);
    if (!cellData || !cellData.analyser) return;

    // Retreieve audio data and gather into bands
    cellData.analyser.getByteFrequencyData(cellData.dataArray);
    const bandedData = gatherSamplesIntoBands(cellData.dataArray, cellData.analyser, cellData.stems.length, 24000);
    const baseStemHeight = cellData.baseStemHeight;
    const MAX_EXTRA_HEIGHT = cellData.MAX_EXTRA_HEIGHT;

    bandedData.forEach((value, i) => {
        const normalizedValue = value / 220;
        const additionalHeight = Math.min(normalizedValue * MAX_EXTRA_HEIGHT, MAX_EXTRA_HEIGHT);
        cellData.stems[i].style.height = `${baseStemHeight + additionalHeight}px`;
    });

    // Store RAF ID in cellData for potential cancellation
    cellData.visualizerRAF = requestAnimationFrame(() => updateVisualizer(cell));
}

// When stopping audio for a cell, cancel its visualizer update.
function stopVisualizer(cell) {
  const cellData = storedCellData.get(cell);
  if (cellData && cellData.visualizerRAF) {
       cancelAnimationFrame(cellData.visualizerRAF);
       cellData.visualizerRAF = null;
  }
  // Optionally, reset the stems.
  const visualizer = cell.querySelector(".visualizer");
  if (visualizer) {
       const stems = visualizer.querySelectorAll(".stem");
       stems.forEach(stem => {
            stem.style.height = "";
       });
  }
}


// === BORDER ANIMATION ===
function animateBorder(cell, duration, isFillingIn) {
  let startTime;

  function step(timestamp) {
      if (!startTime) startTime = timestamp;
      let elapsed = timestamp - startTime;
      let progress = Math.min(elapsed / duration, 1);
      let angle = 360 * progress;

      let maskValue = isFillingIn
          ? `conic-gradient(from 0deg, white ${angle}deg, transparent ${angle}deg)`
          : `conic-gradient(from ${angle}deg, white ${360 - angle}deg, transparent ${360 - angle}deg)`;

      cell.style.setProperty("--border-mask", maskValue);

      if (progress < 1) {
          requestAnimationFrame(step);
      }
  }

  requestAnimationFrame(step);
}


// === QUICK TAP & SLOW TAP FUNCTIONS ===
function toggleAudio(cell) {
  const cellData = storedCellData.get(cell);
  cellData.isActive = !cellData.isActive;
  cell.classList.toggle("active", cellData.isActive);
  
  if (cellData.isActive) {
      playAudio(cell);
      animateBorder(cell, animationDuration, true);
  } else {
      stopAudio(cell);
      animateBorder(cell, animationDuration, false);
  }
}

function soloAudio(cell) {
  const cellData = storedCellData.get(cell);
  // Ensure this cell is ON
  if (!cellData.isActive) {
      cellData.isActive = true;
      cell.classList.add("active");
      playAudio(cell);
      animateBorder(cell, animationDuration, true);
  }
  // Turn off every other cell
  storedCellData.forEach((otherData, otherCell) => {
      if (otherCell !== cell && otherData.isActive) {
          otherData.isActive = false;
          otherCell.classList.remove("active");
          stopAudio(otherCell);
          animateBorder(otherCell, animationDuration, false);
      }
  });
}


// === BUTTON TOGGLE USING POINTER EVENTS ===

// Define thresholds (in milliseconds) for slow tap states
const durationToAction = 500;   // Time until slow tap is "actioned"
const durationToComplete = 1000; // Additional time needed to complete slow tap

cells.forEach(cell => {
  // Set initial styles based on data attributes
  cell.style.backgroundColor = cell.dataset.color || "#ccc";
  
  // Variables to track pointer state per cell
  let pointerDownTime = 0;
  let actionTimer = null;
  let completeTimer = null;
  let isSlowTapActioned = false;
  let isSlowTapCompleted = false;
  let isPointerDown = false;

  cell.addEventListener("pointerdown", (e) => {
      isPointerDown = true;
      pointerDownTime = Date.now();
      // (Optional) Fire "started" event here
      
      // Start timer for "actioned" state
      actionTimer = setTimeout(() => {
          if (isPointerDown) {
              isSlowTapActioned = true;
              // (Optional) Fire "actioned" event here
              
              // Start timer for "completed" state
              completeTimer = setTimeout(() => {
                  if (isPointerDown) {
                      isSlowTapCompleted = true;
                      // (Optional) Fire "completed" event here
                      // Execute slow tap logic: force this cell ON and turn off others.
                      soloAudio(cell);
                  }
              }, durationToComplete);
          }
      }, durationToAction);
  });

  cell.addEventListener("pointerup", (e) => {
      isPointerDown = false;
      clearTimeout(actionTimer);
      clearTimeout(completeTimer);
      
      if (!isSlowTapActioned) {
          // "Cancelled": released before action threshold; execute quick tap.
          // (Optional) Fire "cancelled" event here.
          toggleAudio(cell);
      } else if (isSlowTapActioned && !isSlowTapCompleted) {
          // "Released": slow tap was actioned but not completed; cancel slow tap.
          // (Optional) Fire "released" event here.
          // No further action is taken.
      }
      // Reset flags for the next interaction.
      isSlowTapActioned = false;
      isSlowTapCompleted = false;
  });

  cell.addEventListener("pointerleave", (e) => {
      isPointerDown = false;
      clearTimeout(actionTimer);
      clearTimeout(completeTimer);
      isSlowTapActioned = false;
      isSlowTapCompleted = false;
  });

  cell.addEventListener("pointercancel", (e) => {
      isPointerDown = false;
      clearTimeout(actionTimer);
      clearTimeout(completeTimer);
      isSlowTapActioned = false;
      isSlowTapCompleted = false;
  });
});