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


// === SCROLLING APP BACKDROP ===
const labels = [
  "Label 1", "Label 2", "Label 3", "Label 4", "Label 5",
  "Label 6", "Label 7", "Label 8", "Label 9", "Label 10"
];
const colours = [
  "#e2d370", "#9fec83", "#6ce1d3", "#61b7ff", "#6c7ded", "#8d45f3", "#d046e9", "#dc4f82", "#e46868", "#f7ad7b"
];

// Define grid dimensions
const rows = 10;
const columns = 10;

// Function to create the grid cells inside a given grid container
function createGrid(gridElement, labels, colours) 
{
  for (let row = 0; row < rows; row++) 
  {
    for (let column = 0; column < columns; column++) 
    {
      const index = row * columns + column;
      const cell = document.createElement("div");
      cell.className = "grid-cell";

      // Create cells and add colour (using the arrays cyclically if they have fewer than 100 entries)
      cell.style.color = colours[index % colours.length];
      gridElement.appendChild(cell);

      // Create stem container
      const visualizer = document.createElement("div");
      visualizer.className = "visualizer";
      cell.appendChild(visualizer)

      // Add stems
      for (let i = 0; i < 16; i++) {
        const stem = document.createElement("div");
        stem.style.backgroundColor = colours[index % colours.length];
        stem.classList.add("stem");
        visualizer.appendChild(stem);
      }

      // Add label
      const text = document.createElement("span");
      text.textContent = labels[index % labels.length];
      cell.appendChild(text);
    }
  }
}

// Get references to both grid containers
const grid1 = document.getElementById("grid1");
const grid2 = document.getElementById("grid2");

// Dynamically instantiate the grid cells in each container
createGrid(grid1, labels, colours);
createGrid(grid2, labels, colours);

// Get the wrapper and one grid element (assumed to be duplicated side by side)
const gridWrapper = document.querySelector('.grid-wrapper');
const gridElement = document.querySelector('.grid');
const gridWidth = gridElement.offsetWidth; // Use the actual width of one grid

let lastTimestamp;
let distance = 0;
const speed = 6; // pixels per second, adjust as needed

// Trigger the scroll
requestAnimationFrame(animateGrid);

function animateGrid(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  
  // Increase the distance by delta time
  distance += (delta / 1000) * speed;
  
  // When we've scrolled one full grid copy, subtract that width to reset exactly
  if (distance >= gridWidth) {
    distance -= gridWidth;
  }
  
  // Use translate3d for smoother performance
  gridWrapper.style.transform = `translate3d(-${distance}px, 0, 0)`;
  
  requestAnimationFrame(animateGrid);
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 


// === ON LOAD EVENT ===
document.addEventListener('DOMContentLoaded', () => {
  const foregroundCell = document.querySelector('#foreground-cell-wrapper .audio-cell');
  const popupText = document.querySelector('#foreground-cell-wrapper .popup-text');

  // Attach a click listener on the foreground cell to hide the popup text
  foregroundCell.addEventListener('click', () => {
    if (popupText) {
      // Start the fade-out/up animation
      popupText.style.animation = 'popup-out 0.6s forwards';
    }
  });
});


// === ON WINDOW RESIZE EVENT ===
window.addEventListener('resize', () => {
  gridWidth = gridElement.offsetWidth;
});


// ON SCROLL EVENT 
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  let delta = window.scrollY - lastScrollY;

  const logo = document.getElementById('logo');

  if (delta > 0 && window.scrollY > 240) // User is scrolling downward
  {
    logo.classList.add('shrink');
  } 
  else if (delta < 0 && window.scrollY < 480) // User is scrolling upward
  {
    logo.classList.remove('shrink');
  }

  lastScrollY = window.scrollY;
});


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 


// === AUDIO PLAYBACK ===

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const cells = document.querySelectorAll(".audio-cell");

const fadeDuration = 4; // Fade duration in seconds
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

  // Ensure any ongoing fade is stopped by storing a reference
  if (gainNode.fadeAnimationFrame) {
      cancelAnimationFrame(gainNode.fadeAnimationFrame);
  }

  function step() {
      const elapsed = audioContext.currentTime - startTime;
      let t = Math.min(elapsed / durationInSeconds, 1);
      let eased = t * t * (3 - 2 * t);
      let newValue = startValue + (targetValue - startValue) * eased;

      gainNode.gain.setValueAtTime(newValue, audioContext.currentTime);

      if (t < 1) {
          gainNode.fadeAnimationFrame = requestAnimationFrame(step);
      } else {
          gainNode.fadeAnimationFrame = null; // Clear reference when fade is complete
          gainNode.gain.setValueAtTime(targetValue, audioContext.currentTime); // Ensure exact final value
          if (callback) callback();
      }
  }

  gainNode.fadeAnimationFrame = requestAnimationFrame(step);
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
  // const visualizer = cell.querySelector(".visualizer");
  // if (visualizer) {
  //      const stems = visualizer.querySelectorAll(".stem");
  //      stems.forEach(stem => {
  //           stem.style.height = "";
  //      });
  // }
}


// === BORDER ANIMATION ===
const borderFillSpeed = 1200; // (degrees per second)

function fillBorder(cell, speed, slowFill = false){
  let startTime;
  let startAngle = getCurrentBorderAngle(cell);
  const duration = slowFill ? durationToComplete : ((360 - startAngle) / speed) * 1000; // in milliseconds

  // Cancel any ongoing animation for this cell
  if (cell._borderAnimationFrame) {
    cancelAnimationFrame(cell._borderAnimationFrame);
    cell._borderAnimationFrame = null;
  }

  function easeInOut(t) {
    return t * t * (3 - 2 * t); // Smoothstep easing
  }

  // Trigger the animation
  cell._borderAnimationFrame = requestAnimationFrame(step);

  // Clockwise fill: animate from startAngle to 360
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    let elapsed = timestamp - startTime;
    let progress = easeInOut(Math.min(elapsed / duration, 1));

    let newAngle = startAngle + (360 - startAngle) * progress;
    let maskValue = `conic-gradient(from 0deg, white ${newAngle}deg, transparent ${newAngle}deg)`;
    cell.style.setProperty("--border-mask", maskValue);
    
    if (progress < 1) {
      cell._borderAnimationFrame = requestAnimationFrame(step);
    } else {
      cell._borderAnimationFrame = null;
    }
  }
}

function unfillBorder(cell, speed, inReverse = false, slowUnfill = false) {
  let startTime;
  let startAngle = getCurrentBorderAngle(cell);
  const duration = slowUnfill ? durationToComplete : (startAngle / speed) * 1000; // in milliseconds

  // Cancel any ongoing animation for this cell
  if (cell._borderAnimationFrame) {
    cancelAnimationFrame(cell._borderAnimationFrame);
    cell._borderAnimationFrame = null;
  }

  function easeInOut(t) {
    return t * t * (3 - 2 * t); // Smoothstep easing
  }

  // Trigger the animation
  cell._borderAnimationFrame = requestAnimationFrame(step);

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    let elapsed = timestamp - startTime;
    let progress = easeInOut(Math.min(elapsed / duration, 1));
    let maskValue;

    if (inReverse) {
      // Anticlockwise unfill: decrease fill from startAngle down to 0
      let newAngle = startAngle * (1 - progress);
      maskValue = `conic-gradient(from 0deg, white ${newAngle}deg, transparent ${newAngle}deg)`;
    } else {
      // Clockwise unfill: white stays at 360 while transparent grows from 0 to 360
      let newAngle = 360 * progress;
      maskValue = `conic-gradient(from 0deg, transparent ${newAngle}deg, white ${newAngle}deg)`;
    }
    
    cell.style.setProperty("--border-mask", maskValue);
    
    if (progress < 1) {
      cell._borderAnimationFrame = requestAnimationFrame(step);
    } else {
      cell._borderAnimationFrame = null;
    }
  }
}

function fillOuterBorder(cell){
  let startTime;
  let startAngle = getCurrentBorderAngle(cell, true);

  // Cancel any ongoing animation for this cell
  if (cell._borderAnimationFrame) {
    cancelAnimationFrame(cell._outerBorderAnimationFrame);
    cell._borderAnimationFrame = null;
  }

  function easeInOut(t) {
    return t * t * (3 - 2 * t); // Smoothstep easing
  }

  // Trigger the animation
  cell._borderAnimationFrame = requestAnimationFrame(step);

  // Clockwise fill: animate from startAngle to 360
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    let elapsed = timestamp - startTime;
    let progress = easeInOut(Math.min(elapsed / durationToComplete, 1));

    let newAngle = startAngle + (360 - startAngle) * progress;
    let maskValue = `conic-gradient(from 0deg, white ${newAngle}deg, transparent ${newAngle}deg)`;
    cell.style.setProperty("--outer-border-mask", maskValue);
    
    if (progress < 1) {
      cell._borderAnimationFrame = requestAnimationFrame(step);
    } else {
      maskValue = `conic-gradient(from 0deg, white 0deg, transparent 0deg)`;
      cell.style.setProperty("--outer-border-mask", maskValue);
      cell._borderAnimationFrame = null;
    }
  }
}

function unfillOuterBorder(cell, speed) {
  let startTime;
  let startAngle = getCurrentBorderAngle(cell, true);
  const duration = (startAngle / speed) * 1000; // in milliseconds

  // Cancel any ongoing animation for this cell
  if (cell._borderAnimationFrame) {
    cancelAnimationFrame(cell._borderAnimationFrame);
    cell._borderAnimationFrame = null;
  }

  function easeInOut(t) {
    return t * t * (3 - 2 * t); // Smoothstep easing
  }

  // Trigger the animation
  cell._borderAnimationFrame = requestAnimationFrame(step);

  // Anticlockwise unfill: decrease fill from startAngle down to 0
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    let elapsed = timestamp - startTime;
    let progress = easeInOut(Math.min(elapsed / duration, 1));

    let newAngle = startAngle * (1 - progress);
    let maskValue = `conic-gradient(from 0deg, white ${newAngle}deg, transparent ${newAngle}deg)`;
    cell.style.setProperty("--outer-border-mask", maskValue);
    
    if (progress < 1) {
      cell._borderAnimationFrame = requestAnimationFrame(step);
    } else {
      cell._borderAnimationFrame = null;
    }
  }
}

function getCurrentBorderAngle(cell, isOuterBorder = false) {
  const computedStyle = getComputedStyle(cell);
  const maskValue = isOuterBorder ? computedStyle.getPropertyValue("--outer-border-mask").trim() : computedStyle.getPropertyValue("--border-mask").trim();
  
  // Check if the gradient is in reversed order (i.e. "transparent" comes before "white")
  if(maskValue.indexOf("transparent") < maskValue.indexOf("white")) {
    // For reversed (clockwise unfill) mode, the fill is effectively 360 minus the transparent value.
    const reversedMatch = maskValue.match(/transparent\s+(\d+(?:\.\d+)?)deg/);
    if(reversedMatch && reversedMatch[1]) {
      return 360 - parseFloat(reversedMatch[1]);
    }
  }
  
  // Otherwise, assume standard format (white then transparent)
  const standardMatch = maskValue.match(/white\s+(\d+(?:\.\d+)?)deg/);
  return standardMatch ? parseFloat(standardMatch[1]) : 0;
}


// === QUICK TAP & SLOW TAP FUNCTIONS ===

function toggleCell(cell) {
  const cellData = storedCellData.get(cell);
  cellData.isActive = !cellData.isActive;
  cell.classList.toggle("active", cellData.isActive);
  
  if (cellData.isActive) {
      playAudio(cell);
      fillBorder(cell, borderFillSpeed)
  } else {
      stopAudio(cell);
      unfillBorder(cell, borderFillSpeed)
  }
}

function soloCell(cell) {
  const cellData = storedCellData.get(cell);
  // Ensure this cell is ON
  if (!cellData.isActive) {
      cellData.isActive = true;
      cell.classList.add("active");
      playAudio(cell);
  }
  // Turn off every other cell
  storedCellData.forEach((otherData, otherCell) => {
      if (otherCell !== cell && otherData.isActive) {
          otherData.isActive = false;
          otherCell.classList.remove("active");
          stopAudio(otherCell);
      }
  });
}


// === BUTTON TOGGLE USING POINTER EVENTS ===
// Define thresholds (in milliseconds) for slow tap states
const durationToAction = 250; // Time until slow tap is "actioned"
const durationToComplete = 1000; // Additional time needed to complete slow tap

cells.forEach(cell => {
  // Variables to track pointer state per cell
  let actionTimer = null;
  let completeTimer = null;
  let isSlowTapActioned = false;
  let isSlowTapCompleted = false;
  let isPointerDown = false;

  cell.addEventListener("pointerdown", (e) => { // Tap STARTED
    isPointerDown = true;
      
      // Start timer for "actioned" state
      actionTimer = setTimeout(() => {
          if (isPointerDown) { // Slow tap ACTIONED
            isSlowTapActioned = true;

            // Start to fill this cells border
            const cellData = storedCellData.get(cell);
            if (cellData.isActive) { 
              fillOuterBorder(cell);
            } else {
              fillBorder(cell, 0, true);
            }

            // Start to unfill all aother active cells borders
            storedCellData.forEach((otherData, otherCell) => {
              if (otherCell !== cell && otherData.isActive) unfillBorder(otherCell, 0, true, true);
            });
              
              // Start timer for "completed" state
              completeTimer = setTimeout(() => {
                  if (isPointerDown) { // Slow tap COMPLETED
                    isSlowTapCompleted = true;
                    soloCell(cell);
                  }
              }, durationToComplete);
          }
      }, durationToAction);
  });

  cell.addEventListener("pointerup", (e) => {
    if (!isPointerDown) return;
      isPointerDown = false;
      clearTimeout(actionTimer);
      clearTimeout(completeTimer);
      
      if (!isSlowTapActioned) { // Quick tap PERFORMED
        toggleCell(cell);
      } else if (isSlowTapActioned && !isSlowTapCompleted) { // Slow tap RELEASED
        // Reset border back to unfilled
        const cellData = storedCellData.get(cell);
        if (cellData.isActive) {
          unfillOuterBorder(cell, 800);
        } else {
          unfillBorder(cell, 800, true);
        }

        // Refill all aother active cells borders
        storedCellData.forEach((otherData, otherCell) => {
          if (otherCell !== cell && otherData.isActive) fillBorder(otherCell, borderFillSpeed);
        });
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