document.addEventListener('DOMContentLoaded', function() {
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
        // Replace this with the actual logic to check if Jason Smith is logged in
        // For example, check the email stored in session or a variable
        const userEmail = sessionStorage.getItem('userEmail');
        return userEmail === 'jason.smith@vanirinstalledsales.com';
    }

    // Always play the audio when the page loads if Jason Smith is not logged in
    if (!isJasonLoggedIn()) {
        backgroundMusic.currentTime = 9; // Start the song 9 seconds in
        if (sessionStorage.getItem('isMusicPlaying') === 'true') {
            backgroundMusic.play();
            playPauseButton.textContent = 'Pause';
        } else {
            backgroundMusic.play();
            playPauseButton.textContent = 'Pause';
            sessionStorage.setItem('isMusicPlaying', 'true');
        }
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
});
