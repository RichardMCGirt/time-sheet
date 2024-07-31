document.addEventListener('DOMContentLoaded', function() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const playPauseButton = document.getElementById('playPauseButton');

    // Function to update playPauseButton text content
    function updateButtonText() {
        if (playPauseButton.textContent === 'Pause') {
            playPauseButton.textContent = 'Play';
        }
    }

    // Always play the audio when the page loads
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
});