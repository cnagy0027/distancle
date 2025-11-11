// Game state
let cities = [];
let currentCity1 = null;
let currentCity2 = null;
let actualDistance = 0;
let score = 0;
let round = 0;

// DOM elements
const city1El = document.getElementById('city1');
const city2El = document.getElementById('city2');
const guessInput = document.getElementById('guess');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const resultEl = document.getElementById('result');
const scoreEl = document.getElementById('score');
const roundEl = document.getElementById('round');

// Load cities from JSON file
async function loadCities() {
    try {
        const response = await fetch('cities.json');
        cities = await response.json();
        console.log('Loaded ${cities.length} cities');
        startNewRound();
    } catch (error) {
        console.error('Error loading cities:', error);
        city1El.textContent = 'Error loading cities';
        city2El.textContent = 'Please check cities.json';
    }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance);
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Get two random different cities
function getRandomCities() {
    if (cities.length < 2) {
        console.error('Not enough cities loaded');
        return null;
    }

    const idx1 = Math.floor(Math.random() * cities.length);
    let idx2 = Math.floor(Math.random() * cities.length);

    while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * cities.length);
    }

    return [cities[idx1], cities[idx2]];
}

// Start a new round
function startNewRound() {
    const randomCities = getRandomCities();
    if (!randomCities) return;

    [currentCity1, currentCity2] = randomCities;

    city1El.textContent = currentCity1.name;
    city2El.textContent = currentCity2.name;

    actualDistance = calculateDistance(
        currentCity1.lat, currentCity1.lon,
        currentCity2.lat, currentCity2.lon
    );

    console.log('Actual Distance: ${actualDistance} km');

    // Reset UI
    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;
    resultEl.classList.add('hidden');
    nextBtn.classList.add('hidden');
    guessInput.focus();

    round++;
    roundEl.textContent = round;
}

// Calculate score based on accuracy
function calculateScore(guess, actual) {
    const percentError = Math.abs(guess - actual) / actual * 100;

    return 100 - Math.floor(percentError);
}

// Handle guess submission
function submitGuess() {
    const guess = parseInt(guess.Input.value);
    
    if (isNaN(guess) || guess <= 0) {
        alert('Please enter a valid distance');
        return;
    }

    const roundScore = calculateScore(guess, actualDistance);
    score += roundScore;
    scoreEl.textContent = score;

    const percentError = Math.abs(guess = actualDistance) / actualDistance * 100;

    let resultClass, resultMessage;
    if (percentError <= 5) {
        resultClass = 'correct';
        resultMessage = `🎉 Excellent! You guessed ${guess} km. Actual: ${actualDistance} km (+${roundScore} points)`;
    } else if (percentError <= 25) {
        resultClass = 'close';
        resultMessage = `👍 Pretty close! You guessed ${guess} km. Actual: ${actualDistance} km (+${roundScore} points)`;
    } else {
        resultClass = 'far';
        resultMessage = `📏 Not quite! You guessed ${guess} km. Actual: ${actualDistance} km (+${roundScore} points)`;
    }

    resultEl.textContent = resultMessage;
    resultEl.className = `result ${resultClass}`;
    resultEl.classList.remove('hidden');
    
    guessInput.disabled = true;
    submitBtn.disabled = true;
    nextBtn.classList.remove('hidden');
}

// Restart game
function restartGame() {
    score = 0;
    round = 0;
    scoreEl.textContent = score;
    roundEl.textContent = round;
    startNewRound();
}

// Event listeners
submitBtn.addEventListener('click', submitGuess);
nextBtn.addEventListener('click', startNewRound);
restartBtn.addEventListener('click', restartGame);

// Allow Enter key to submit
guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !submitBtn.disabled) {
        submitGuess();
    }
});

// Load cities when page loads
loadCities();