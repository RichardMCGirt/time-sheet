document.addEventListener('DOMContentLoaded', function() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const playPauseButton = document.getElementById('playPauseButton');
    
    // Function to update playPauseButton text content
    function updateButtonText() {
        playPauseButton.textContent = backgroundMusic.paused ? 'Play' : 'Pause';
    }

    // Function to check if Jason Smith or Richard McGirt is logged in
    function isExemptUserLoggedIn() {
        const userEmail = sessionStorage.getItem('userEmail');
        return userEmail === 'jason.smith@vanirinstalledsales.com'  || userEmail === 'Hunter@vanirinstalledsales.com';
    }

    // Function to unmute the computer and set the volume to max
    function unmuteAndSetVolumeMax() {
        backgroundMusic.muted = false;
        backgroundMusic.volume = 1.0;
    }

    // Play the audio when the page loads if neither Jason Smith nor Richard McGirt is logged in
    if (!isExemptUserLoggedIn()) {
        backgroundMusic.currentTime = 9; // Start the song 9 seconds in
        unmuteAndSetVolumeMax();
        backgroundMusic.play();
        sessionStorage.setItem('isMusicPlaying', 'true');
        updateButtonText();
    }

    // Handle play/pause button click
    playPauseButton.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default button behavior (like form submission)
        if (backgroundMusic.paused) {
            unmuteAndSetVolumeMax();
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
    if (sessionStorage.getItem('isMusicPlaying') === 'true' && !isExemptUserLoggedIn()) {
        backgroundMusic.currentTime = 9; // Start the song 9 seconds in
        unmuteAndSetVolumeMax();
        backgroundMusic.play();
        updateButtonText();
    }
});
