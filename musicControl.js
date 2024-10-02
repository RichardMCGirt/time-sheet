document.addEventListener('DOMContentLoaded', function() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const playPauseButton = document.getElementById('playPauseButton');

    // Function to update playPauseButton text content
    function updateButtonText() {
        playPauseButton.textContent = backgroundMusic.paused ? 'Play' : 'Pause';
    }

    // Function to check if Jason Smith or Hunter is logged in
    function isExemptUserLoggedIn() {
        const userEmail = sessionStorage.getItem('userEmail');
        return userEmail === 'jason.smith@vanirinstalledsales.com' || userEmail === 'Hunter@vanirinstalledsales.com';
    }

    // Function to unmute the computer and set the volume to max
    function unmuteAndSetVolumeMax() {
        backgroundMusic.muted = false;
        backgroundMusic.volume = 1.0;
    }

    // Handle play/pause button click
    playPauseButton.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default button behavior (like form submission)

        // Check if the user is exempt from auto-playing the audio
        if (!isExemptUserLoggedIn()) {
            backgroundMusic.currentTime = 9; // Start the song 9 seconds in
            unmuteAndSetVolumeMax();
        }

        // Toggle play/pause
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(function(error) {
                console.error("Playback failed:", error);
            });
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

    // Ensure the audio state is preserved after a page refresh
    if (sessionStorage.getItem('isMusicPlaying') === 'true' && !isExemptUserLoggedIn()) {
        unmuteAndSetVolumeMax();
        backgroundMusic.play().catch(function(error) {
            console.error("Playback failed on refresh:", error);
        });
    } else {
        updateButtonText();
    }
});
