// Game state
let cities = [];
let currentCity1 = null;
let currentCity2 = null;
let actualDistance = 0;
let score = 0;
let round = 0;
const MAX_ROUNDS = 5;

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameArea = document.querySelector('.game-area');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const newGameBtn = document.getElementById('new-game-btn');
const globeContainer = document.getElementById('globe-container');
const globeEl = document.getElementById('globe');
const toggleGlobeBtn = document.getElementById('toggle-globe');
const city1El = document.getElementById('city1');
const city2El = document.getElementById('city2');
const guessInput = document.getElementById('guess');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const resultEl = document.getElementById('result');
const scoreEl = document.getElementById('score');
const roundEl = document.getElementById('round');
const finalScoreEl = document.getElementById('final-score');

// Load cities from JSON file
async function loadCities() {
    try {
        const response = await fetch('cities.json');
        cities = await response.json();
        console.log('Loaded ${cities.length} cities');
    } catch (error) {
        console.error('Error loading cities:', error);
        alert('Error loading cities. Please check cities.json file.');
    }
}

let scene, camera, renderer, globe, markers = [];
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let globeVisible = true;

function initGlobe() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, globeEl.clientWidth / globeEl.clientHeight, 0.1, 1000);
    camera.position.z = 2.5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(globeEl.clientWidth, globeEl.clientHeight);
    globeEl.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 64, 64);

    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-day.jpg');
    
    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        shininess: 5
    });
    globe = new THREE.Mesh(geometry, material);
    
    globe.rotation.y = Math.PI;

    scene.add(globe);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    globeEl.addEventListener('mousedown', onMouseDown);
    globeEl.addEventListener('mousemove', onMouseMove);
    globeEl.addEventListener('mouseup', onMouseUp);
    globeEl.addEventListener('mouseleave', onMouseUp);

    // Prevent image dragging
    renderer.domElement.addEventListener('dragstart', (e) => e.preventDefault());
    
    // Mouse wheel zoom
    globeEl.addEventListener('wheel', onMouseWheel);

    window.addEventListener('resize', onWindowResize);

    animate();
}

function latLonToVector3(lat, lon, radius = 1) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (-lon) * (Math.PI / 180);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
}

function addCityMarker(lat, lon, color) {
    const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    const position = latLonToVector3(lat, lon, 1.01);
    marker.position.copy(position);

    globe.add(marker);
    markers.push(marker);

    return marker;
}

function clearMarkers() {
    markers.forEach(marker => {
        globe.remove(marker);
    });
    markers = [];
}

// Debug function - add test markers
function addTestMarkers() {
    clearMarkers();
    // 0°N, 0°E - Should be in Gulf of Guinea off west Africa
    addCityMarker(0, 0, 0xff0000);
    // 0°N, 90°E - Should be in Indian Ocean near Sumatra
    addCityMarker(0, 90, 0x00ff00);
    // 0°N, -90°W - Should be in Pacific Ocean near Galapagos
    addCityMarker(0, -90, 0x0000ff);
    // 45°N, 0°E - Should be in France
    addCityMarker(45, 0, 0xffff00);
    console.log("Test markers added:");
    console.log("Red: 0°N, 0°E (Gulf of Guinea)");
    console.log("Green: 0°N, 90°E (Indian Ocean)");
    console.log("Blue: 0°N, -90°W (Pacific)");
    console.log("Yellow: 45°N, 0°E (France)");
}

function onMouseDown(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    globe.rotation.y += deltaX * 0.005;
    globe.rotation.x += deltaY * 0.005;

    previousMousePosition = { x: e.clientX, y: e.clientY };
}

function onMouseUp() {
    isDragging = false;
}


function onMouseWheel(e) {
    e.preventDefault();
    
    // Zoom in/out by adjusting camera position
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? 1 : -1;
    
    camera.position.z += delta * zoomSpeed;
    
    // Limit zoom range
    camera.position.z = Math.max(1.5, Math.min(5, camera.position.z));
}

function onWindowResize() {
    if (!globeEl.clientWidth) return;
    camera.aspect = globeEl.clientWidth / globeEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(globeEl.clientWidth, globeEl.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function toggleGlobe() {
    globeVisible = !globeVisible;
    if (globeVisible) {
        globeContainer.classList.remove('hidden-globe');
        toggleGlobeBtn.textContent = 'Hide Globe';
    } else {
        globeContainer.classList.add('hidden-globe');
        toggleGlobeBtn.textContent = 'Show Globe';
    }
}

// Start the game
function startGame() {
    startScreen.classList.add('hidden');
    gameArea.classList.remove('hidden');

    if (!renderer) {
        initGlobe();
        // setTimeout(() => addTestMarkers(), 500);
    }

    startNewRound();
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
    if (round >= MAX_ROUNDS) {
        endGame();
        return;
    }

    const randomCities = getRandomCities();
    if (!randomCities) return;

    [currentCity1, currentCity2] = randomCities;

    city1El.textContent = `${currentCity1.name}, ${getCountryName(currentCity1.country)}`;
    city2El.textContent = `${currentCity2.name}, ${getCountryName(currentCity2.country)}`;

    clearMarkers();
    addCityMarker(currentCity1.lat, currentCity1.lon, 0xff0000); // Red for city 1
    addCityMarker(currentCity2.lat, currentCity2.lon, 0x00ff00); // Green for city 2

    actualDistance = calculateDistance(
        currentCity1.lat, currentCity1.lon,
        currentCity2.lat, currentCity2.lon
    );

    console.log(`Actual distance: ${actualDistance} km`);

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

    if (percentError <= 100) {
        return 100 - Math.floor(percentError);
    } else {
        return 0;
    }
}

// Handle guess submission
function submitGuess() {
    const guess = parseInt(guessInput.value);
    
    if (isNaN(guess) || guess <= 0) {
        alert('Please enter a valid distance');
        return;
    }

    const roundScore = calculateScore(guess, actualDistance);
    score += roundScore;
    scoreEl.textContent = score;

    const percentError = Math.abs(guess - actualDistance) / actualDistance * 100;

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

    if (round >= MAX_ROUNDS) {
        nextBtn.textContent = 'Finish Game';
    } else {
        nextBtn.textContent = 'Next Round';
    }
}

// Restart game
function restartGame() {
    score = 0;
    round = 0;
    scoreEl.textContent = score;
    roundEl.textContent = round;
    gameArea.classList.add('hidden');
    endScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

// End the game and show final score
function endGame() {
    gameArea.classList.add('hidden');
    endScreen.classList.remove('hidden');
    finalScoreEl.textContent = score;
}

// Event listeners
startBtn.addEventListener('click', startGame);
newGameBtn.addEventListener('click', restartGame);
submitBtn.addEventListener('click', submitGuess);
nextBtn.addEventListener('click', startNewRound);
restartBtn.addEventListener('click', restartGame);
toggleGlobeBtn.addEventListener('click', toggleGlobe);

// Allow Enter key to submit
guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !submitBtn.disabled) {
        submitGuess();
    }
});

// Load cities when page loads
loadCities();

// Convert country codes to full names
function getCountryName(code) {
    return countryNames[code] || code;
}

const countryNames = {
  "AF": "Afghanistan",
  "AX": "Åland Islands",
  "AL": "Albania",
  "DZ": "Algeria",
  "AS": "American Samoa",
  "AD": "Andorra",
  "AO": "Angola",
  "AI": "Anguilla",
  "AQ": "Antarctica",
  "AG": "Antigua and Barbuda",
  "AR": "Argentina",
  "AM": "Armenia",
  "AW": "Aruba",
  "AU": "Australia",
  "AT": "Austria",
  "AZ": "Azerbaijan",
  "BS": "Bahamas (the)",
  "BH": "Bahrain",
  "BD": "Bangladesh",
  "BB": "Barbados",
  "BY": "Belarus",
  "BE": "Belgium",
  "BZ": "Belize",
  "BJ": "Benin",
  "BM": "Bermuda",
  "BT": "Bhutan",
  "BO": "Bolivia (Plurinational State of)",
  "BQ": "Bonaire, Sint Eustatius and Saba",
  "BA": "Bosnia and Herzegovina",
  "BW": "Botswana",
  "BV": "Bouvet Island",
  "BR": "Brazil",
  "IO": "British Indian Ocean Territory (the)",
  "BN": "Brunei Darussalam",
  "BG": "Bulgaria",
  "BF": "Burkina Faso",
  "BI": "Burundi",
  "CV": "Cabo Verde",
  "KH": "Cambodia",
  "CM": "Cameroon",
  "CA": "Canada",
  "KY": "Cayman Islands (the)",
  "CF": "Central African Republic (the)",
  "TD": "Chad",
  "CL": "Chile",
  "CN": "China",
  "CX": "Christmas Island",
  "CC": "Cocos (Keeling) Islands (the)",
  "CO": "Colombia",
  "KM": "Comoros (the)",
  "CD": "Congo (the Democratic Republic of the)",
  "CG": "Congo (the)",
  "CK": "Cook Islands (the)",
  "CR": "Costa Rica",
  "CI": "Côte d'Ivoire",
  "HR": "Croatia",
  "CU": "Cuba",
  "CW": "Curaçao",
  "CY": "Cyprus",
  "CZ": "Czechia",
  "DK": "Denmark",
  "DJ": "Djibouti",
  "DM": "Dominica",
  "DO": "Dominican Republic (the)",
  "EC": "Ecuador",
  "EG": "Egypt",
  "SV": "El Salvador",
  "GQ": "Equatorial Guinea",
  "ER": "Eritrea",
  "EE": "Estonia",
  "SZ": "Eswatini",
  "ET": "Ethiopia",
  "FK": "Falkland Islands (the) [Malvinas]",
  "FO": "Faroe Islands (the)",
  "FJ": "Fiji",
  "FI": "Finland",
  "FR": "France",
  "GF": "French Guiana",
  "PF": "French Polynesia",
  "TF": "French Southern Territories (the)",
  "GA": "Gabon",
  "GM": "Gambia (the)",
  "GE": "Georgia",
  "DE": "Germany",
  "GH": "Ghana",
  "GI": "Gibraltar",
  "GR": "Greece",
  "GL": "Greenland",
  "GD": "Grenada",
  "GP": "Guadeloupe",
  "GU": "Guam",
  "GT": "Guatemala",
  "GG": "Guernsey",
  "GN": "Guinea",
  "GW": "Guinea-Bissau",
  "GY": "Guyana",
  "HT": "Haiti",
  "HM": "Heard Island and McDonald Islands",
  "VA": "Holy See (the)",
  "HN": "Honduras",
  "HK": "Hong Kong",
  "HU": "Hungary",
  "IS": "Iceland",
  "IN": "India",
  "ID": "Indonesia",
  "IR": "Iran (Islamic Republic of)",
  "IQ": "Iraq",
  "IE": "Ireland",
  "IM": "Isle of Man",
  "IL": "Israel",
  "IT": "Italy",
  "JM": "Jamaica",
  "JP": "Japan",
  "JE": "Jersey",
  "JO": "Jordan",
  "KZ": "Kazakhstan",
  "KE": "Kenya",
  "KI": "Kiribati",
  "KP": "Korea (the Democratic People's Republic of)",
  "KR": "Korea (the Republic of)",
  "KW": "Kuwait",
  "KG": "Kyrgyzstan",
  "LA": "Lao People's Democratic Republic (the)",
  "LV": "Latvia",
  "LB": "Lebanon",
  "LS": "Lesotho",
  "LR": "Liberia",
  "LY": "Libya",
  "LI": "Liechtenstein",
  "LT": "Lithuania",
  "LU": "Luxembourg",
  "MO": "Macao",
  "MK": "Republic of North Macedonia",
  "MG": "Madagascar",
  "MW": "Malawi",
  "MY": "Malaysia",
  "MV": "Maldives",
  "ML": "Mali",
  "MT": "Malta",
  "MH": "Marshall Islands (the)",
  "MQ": "Martinique",
  "MR": "Mauritania",
  "MU": "Mauritius",
  "YT": "Mayotte",
  "MX": "Mexico",
  "FM": "Micronesia (Federated States of)",
  "MD": "Moldova (the Republic of)",
  "MC": "Monaco",
  "MN": "Mongolia",
  "ME": "Montenegro",
  "MS": "Montserrat",
  "MA": "Morocco",
  "MZ": "Mozambique",
  "MM": "Myanmar",
  "NA": "Namibia",
  "NR": "Nauru",
  "NP": "Nepal",
  "NL": "Netherlands (the)",
  "NC": "New Caledonia",
  "NZ": "New Zealand",
  "NI": "Nicaragua",
  "NE": "Niger (the)",
  "NG": "Nigeria",
  "NU": "Niue",
  "NF": "Norfolk Island",
  "MP": "Northern Mariana Islands (the)",
  "NO": "Norway",
  "OM": "Oman",
  "PK": "Pakistan",
  "PW": "Palau",
  "PS": "Palestine, State of",
  "PA": "Panama",
  "PG": "Papua New Guinea",
  "PY": "Paraguay",
  "PE": "Peru",
  "PH": "Philippines (the)",
  "PN": "Pitcairn",
  "PL": "Poland",
  "PT": "Portugal",
  "PR": "Puerto Rico",
  "QA": "Qatar",
  "RE": "Réunion",
  "RO": "Romania",
  "RU": "Russian Federation (the)",
  "RW": "Rwanda",
  "BL": "Saint Barthélemy",
  "SH": "Saint Helena, Ascension and Tristan da Cunha",
  "KN": "Saint Kitts and Nevis",
  "LC": "Saint Lucia",
  "MF": "Saint Martin (French part)",
  "PM": "Saint Pierre and Miquelon",
  "VC": "Saint Vincent and the Grenadines",
  "WS": "Samoa",
  "SM": "San Marino",
  "ST": "Sao Tome and Principe",
  "SA": "Saudi Arabia",
  "SN": "Senegal",
  "RS": "Serbia",
  "SC": "Seychelles",
  "SL": "Sierra Leone",
  "SG": "Singapore",
  "SX": "Sint Maarten (Dutch part)",
  "SK": "Slovakia",
  "SI": "Slovenia",
  "SB": "Solomon Islands",
  "SO": "Somalia",
  "ZA": "South Africa",
  "GS": "South Georgia and the South Sandwich Islands",
  "SS": "South Sudan",
  "ES": "Spain",
  "LK": "Sri Lanka",
  "SD": "Sudan (the)",
  "SR": "Suriname",
  "SJ": "Svalbard and Jan Mayen",
  "SE": "Sweden",
  "CH": "Switzerland",
  "SY": "Syrian Arab Republic",
  "TW": "Taiwan (Province of China)",
  "TJ": "Tajikistan",
  "TZ": "Tanzania, United Republic of",
  "TH": "Thailand",
  "TL": "Timor-Leste",
  "TG": "Togo",
  "TK": "Tokelau",
  "TO": "Tonga",
  "TT": "Trinidad and Tobago",
  "TN": "Tunisia",
  "TR": "Turkey",
  "TM": "Turkmenistan",
  "TC": "Turks and Caicos Islands (the)",
  "TV": "Tuvalu",
  "UG": "Uganda",
  "UA": "Ukraine",
  "AE": "United Arab Emirates (the)",
  "GB": "United Kingdom of Great Britain and Northern Ireland (the)",
  "UM": "United States Minor Outlying Islands (the)",
  "US": "United States of America (the)",
  "UY": "Uruguay",
  "UZ": "Uzbekistan",
  "VU": "Vanuatu",
  "VE": "Venezuela (Bolivarian Republic of)",
  "VN": "Viet Nam",
  "VG": "Virgin Islands (British)",
  "VI": "Virgin Islands (U.S.)",
  "WF": "Wallis and Futuna",
  "EH": "Western Sahara",
  "YE": "Yemen",
  "ZM": "Zambia",
  "ZW": "Zimbabwe"
}