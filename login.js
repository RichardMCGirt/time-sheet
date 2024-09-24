const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'app9gw2qxhGCmtJvW';
const tableId = 'tbljmLpqXScwhiWTt/';

// DOM elements
const jokeText = document.getElementById('joke-text');
const loginButton = document.getElementById('loginButton');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const playPauseButton = document.getElementById('playPauseButton');
const loginSuccessMessage = document.getElementById('login-success');

// Add input event listener to start/pause music based on input fields
emailInput.addEventListener('input', handleInput);
passwordInput.addEventListener('input', handleInput);
playPauseButton.addEventListener('click', toggleMusic);

loginButton.addEventListener('click', login);

// Trigger login on Enter key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        login(); // Trigger the login function
    }
});

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed");
    debounce(fetchJoke, 300)(); // Fetch joke on page load with debounce
    playPauseButton.style.display = 'none'; // Initially hide the play/pause button
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Fetch all records from Airtable with pagination
async function fetchAllRecords() {
    let allRecords = [];
    let offset = '';

    try {
        do {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={email}='${emailInput.value}'${offset ? `&offset=${offset}` : ''}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const data = await response.json();
            allRecords = allRecords.concat(data.records);
            offset = data.offset; // Update the offset for the next request, if present

        } while (offset); // Continue fetching as long as there's an offset

        return allRecords;

    } catch (error) {
        console.error('Error fetching records:', error);
        return [];
    }
}

// The login function that uses fetchAllRecords
async function login() {
    const email = emailInput.value;
    const password = passwordInput.value;

    console.log("Login attempt with email:", email);
    console.log("Password entered:", password); // Log the entered password

    if (!email || !password) {
        alert('Please fill in both email and password fields.');
        return;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    try {
        const allRecords = await fetchAllRecords(); // Fetch all records from Airtable
        console.log("Fetched records from Airtable:", allRecords); // Log the fetched records

        const user = allRecords.find(record => {
            console.log("Checking record:", record.fields); // Log the individual record being checked
            console.log("Record email:", record.fields.email); // Log email of the record
            console.log("Record password:", record.fields.password); // Log password of the record
            return record.fields.email === email && record.fields.password === password;
        });

        if (user) {
            console.log("User authenticated:", user);
            sessionStorage.setItem('user', JSON.stringify(user.fields));
            localStorage.setItem('userEmail', email);

            const backgroundMusic = document.getElementById('backgroundMusic');
            if (backgroundMusic) {
                backgroundMusic.play();
                sessionStorage.setItem('isMusicPlaying', 'true');
                updateButtonText();
                playPauseButton.style.display = 'block'; // Show the play/pause button
            }

            loginSuccessMessage.classList.remove('hidden'); // Show success message
            window.location.href = 'timesheet.html';
        } else {
            console.log("No matching user found. Invalid email or password."); // Log if no match is found
            alert('Invalid email or password');
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
    }
}




async function fetchJoke() {
    console.log('Fetching a random joke...');

    try {
        const response = await fetch('https://official-joke-api.appspot.com/jokes/random');
        if (!response.ok) {
            throw new Error(`Failed to fetch joke: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched joke data:', data);

        jokeText.textContent = `${data.setup} - ${data.punchline}`;
    } catch (error) {
        console.error('Error fetching joke:', error);
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

emailInput.addEventListener('input', handleInput);
emailInput.addEventListener('keydown', handleKeyDown);

function handleKeyDown(event) {
    if (event.key === '@') {
        const emailValue = emailInput.value;
        if (!emailValue.includes('@vanirinstalledsales.com')) {
            event.preventDefault();
            emailInput.value = `${emailValue}@vanirinstalledsales.com`;
            emailInput.setSelectionRange(emailInput.value.length, emailInput.value.length);
        }
    }
    if (event.key === 'p') {
        handleKeyPPress();
    }
}

function handleInput() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const email = emailInput.value;
    const password = passwordInput.value;

    // Get the first letter of the email or password, if available
    const firstLetter = (email.charAt(0) || password.charAt(0)).toLowerCase();

    // Check if music should play
    const shouldPlayMusic = (email || password) &&
        firstLetter !== 'j' &&
        firstLetter !== 'r' &&
        firstLetter !== 'd' &&
        firstLetter !== 'b' &&
        firstLetter !== 'k' &&
        firstLetter !== 'm';

    if (shouldPlayMusic) {
        if (backgroundMusic && backgroundMusic.paused) {
            backgroundMusic.muted = false;
            backgroundMusic.volume = 1.0;
            backgroundMusic.play();
            sessionStorage.setItem('isMusicPlaying', 'true');
            updateButtonText();
            playPauseButton.style.display = 'block'; // Show the play/pause button
        }
    } else {
        if (backgroundMusic && !backgroundMusic.paused) {
            backgroundMusic.pause();
            sessionStorage.setItem('isMusicPlaying', 'false');
            playPauseButton.style.display = 'none'; // Hide the play/pause button
        }
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.querySelector('.email-input');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');

    const minWidth = emailInput.style.minWidth;
    const minWidthValue = parseInt(minWidth, 10);

    function adjustWidth() {
        const newWidth = ((emailInput.value.length + 2) * 8) + 'px';
        emailInput.style.width = (parseInt(newWidth, 13) < minWidthValue) ? minWidth : newWidth;
    }

    adjustWidth(); // Initial width based on default value

    emailInput.addEventListener('input', adjustWidth);

    togglePasswordButton.addEventListener('click', function () {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePasswordButton.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            togglePasswordButton.textContent = 'Show';
        }
    });
});

function toggleMusic() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        sessionStorage.setItem('isMusicPlaying', 'true');
    } else {
        backgroundMusic.pause();
        sessionStorage.setItem('isMusicPlaying', 'false');
    }
    updateButtonText();
}

function updateButtonText() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    playPauseButton.textContent = backgroundMusic.paused ? 'Play' : 'Pause';
}

let pPressCount = 0;

function handleKeyPPress() {
    pPressCount++;
    if (pPressCount === 2) {
        const backgroundMusic = document.getElementById('backgroundMusic');
        if (!backgroundMusic.paused) {
            backgroundMusic.pause();
            sessionStorage.setItem('isMusicPlaying', 'false');
            updateButtonText();
        }
        pPressCount = 0; // Reset counter after pausing
    }
    setTimeout(() => { pPressCount = 0; }, 300); // Reset counter if 'p' is not pressed again within 300ms
}
