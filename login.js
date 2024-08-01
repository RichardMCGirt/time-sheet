const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'app9gw2qxhGCmtJvW';
const tableId = 'tbljmLpqXScwhiWTt/';

// DOM elements
const jokeText = document.getElementById('joke-text'); // Element to display the joke
const loginButton = document.getElementById('loginButton');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

loginButton.addEventListener('click', login);

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed");
    debounce(fetchJoke, 300)(); // Fetch joke on page load with debounce

    const backgroundMusic = document.getElementById('backgroundMusic');
    const playPauseButton = document.getElementById('playPauseButton');

    // Function to update playPauseButton text content
    function updateButtonText() {
        if (playPauseButton.textContent === 'Pause') {
            playPauseButton.textContent = 'Play';
        }
    }

    // Function to check if Jason Smith is logged in
    function isJasonLoggedIn() {
        const userEmail = localStorage.getItem('userEmail');
        return userEmail === 'jason.smith@vanirinstalledsales.com';
    }

    // Always play the audio when the page loads if Jason Smith is not logged in
    if (backgroundMusic && playPauseButton && !isJasonLoggedIn()) {
        backgroundMusic.currentTime = 9; // Start the song 9 seconds in
        if (sessionStorage.getItem('isMusicPlaying') === 'true') {
            backgroundMusic.play();
            playPauseButton.textContent = 'Pause';
        } else {
            backgroundMusic.play();
            playPauseButton.textContent = 'Pause';
            sessionStorage.setItem('isMusicPlaying', 'true');
        }

        // Handle play/pause button click
        playPauseButton.addEventListener('click', function() {
            if (backgroundMusic.paused) {
                backgroundMusic.play();
                playPauseButton.textContent = 'Pause';
                sessionStorage.setItem('isMusicPlaying', 'true');
            } else {
                backgroundMusic.pause();
                playPauseButton.textContent = 'Play';
                sessionStorage.setItem('isMusicPlaying', 'false');
            }
        });

        // Store the music state on play and pause
        backgroundMusic.onplay = function() {
            sessionStorage.setItem('isMusicPlaying', 'true');
        };

        backgroundMusic.onpause = function() {
            sessionStorage.setItem('isMusicPlaying', 'false');
            updateButtonText(); // Call the function to update the button text content
        };
    }
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

async function login() {
    const email = emailInput.value;
    const password = passwordInput.value;

    console.log("Login attempt with email:", email);

    if (!email || !password) {
        alert('Please fill in both email and password fields.');
        return;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={email}='${email}'`, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched user data from Airtable:", data);
        const user = data.records.find(record => record.fields.email === email && record.fields.password === password);

        if (user) {
            console.log("User authenticated:", user);
            sessionStorage.setItem('user', JSON.stringify(user.fields));
            localStorage.setItem('userEmail', email);

            const backgroundMusic = document.getElementById('backgroundMusic');
            if (backgroundMusic && email !== 'jason.smith@vanirinstalledsales.com') {
                backgroundMusic.play();
                sessionStorage.setItem('isMusicPlaying', 'true');
            }

            window.location.href = 'timesheet.html';
        } else {
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
