document.addEventListener('DOMContentLoaded', function() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const playPauseButton = document.getElementById('playPauseButton');
    
    // Function to update playPauseButton text content
    function updateButtonText() {
        playPauseButton.textContent = backgroundMusic.paused ? 'Play' : 'Pause';
    }

    // Function to check if Jason Smith is logged in
    function isJasonLoggedIn() {
        const userEmail = sessionStorage.getItem('userEmail');
        return userEmail === 'jason.smith@vanirinstalledsales.com';
    }

    // Play the audio when the page loads if Jason Smith is not logged in
    if (!isJasonLoggedIn()) {
        backgroundMusic.currentTime = 9; // Start the song 9 seconds in
        backgroundMusic.play();
        sessionStorage.setItem('isMusicPlaying', 'true');
        updateButtonText();
    }

    // Handle play/pause button click
    playPauseButton.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default button behavior (like form submission)
        if (backgroundMusic.paused) {
            backgroundMusic.play();
        } else {
            backgroundMusic.pause();
        }
        updateButtonText();
    });

    // Store the music state on play and pause
    backgroundMusic.onplay = function() {
        sessionStorage.setItem('isMusicPlaying', 'true');
        updateButtonText();
    };

    backgroundMusic.onpause = function() {
        sessionStorage.setItem('isMusicPlaying', 'false');
        updateButtonText();
    };

    // Continue playing if the page is refreshed
    if (sessionStorage.getItem('isMusicPlaying') === 'true' && !isJasonLoggedIn()) {
        backgroundMusic.currentTime = 9; // Start the song 9 seconds in
        backgroundMusic.play();
        updateButtonText();
    }
});
