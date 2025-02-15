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

// Get reference to the scroll container instead of window
const scrollContainer = document.getElementById('scroll-container');
const header = document.getElementById('main-header');
const logo = document.getElementById('logo');
const appImage = document.getElementById('app-image');
const content = document.getElementById('content');

const maxScroll = 300;       // scroll distance for full effect
const maxHeaderHeight = 200; // original header height (px)
const minHeaderHeight = 60;  // smallest header height (px)

scrollContainer.addEventListener('scroll', () => {
  const scrollTop = scrollContainer.scrollTop;
  
  // Calculate proportional shrink factor (0 to 1)
  const shrinkFactor = Math.min(scrollTop / maxScroll, 1);
  
  // Calculate new header height based on scroll
  const newHeaderHeight = maxHeaderHeight - ((maxHeaderHeight - minHeaderHeight) * shrinkFactor);
  header.style.height = `${newHeaderHeight}px`;
  
  // Scale the SVG logo (adjust scaling range as needed)
  const newLogoScale = 1 - (0.4 * shrinkFactor);
  logo.style.transform = `scale(${newLogoScale})`;
  
  // Fade and scale the app image
  const newImageScale = 1 - (0.3 * shrinkFactor);
  const newImageOpacity = 1 - shrinkFactor;
  appImage.style.transform = `scale(${newImageScale})`;
  appImage.style.opacity = newImageOpacity;
  
  // Adjust main content margin so it starts below the header (with extra spacing)
  content.style.marginTop = `${newHeaderHeight + 20}px`;
});