document.addEventListener('DOMContentLoaded', function() {
    const audio = new Audio('9 to 5 - Dolly Parton.mp3');
    let isPlaying = false;
    const playPauseButton = document.getElementById('play-pause-button');

    // Check if the button element exists
    if (!playPauseButton) {
        console.error("Element with ID 'play-pause-button' not found.");
        return;
    }

    // Check localStorage for saved state and time
    if (localStorage.getItem('isPlaying') === 'true') {
        const currentTime = localStorage.getItem('currentTime');
        audio.currentTime = currentTime ? parseFloat(currentTime) : 0;
        audio.play();
        isPlaying = true;
        playPauseButton.textContent = 'Pause';
    }

    playPauseButton.addEventListener('click', function() {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        isPlaying = !isPlaying;
        this.textContent = isPlaying ? 'Pause' : 'Play';
        localStorage.setItem('isPlaying', isPlaying);
    });

    // Save current time and state before the page is unloaded
    window.addEventListener('beforeunload', function() {
        localStorage.setItem('currentTime', audio.currentTime);
        localStorage.setItem('isPlaying', isPlaying);
    });
});