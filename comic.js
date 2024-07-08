document.addEventListener("DOMContentLoaded", async function() {
    const comicImage = document.getElementById('comic-image');
    const comicTitle = document.getElementById('comic-title');

    // Fetch and display today's comic
    await fetchComic();

    async function fetchComic() {
        console.log('Fetching today\'s comic...');
        
        const today = new Date().toISOString().split('T')[0];
        const lastFetchDate = localStorage.getItem('lastComicFetchDate');
        
        if (lastFetchDate === today) {
            console.log('Comic already fetched today.');
            return;
        }

        try {
            const response = await fetch('/comic');
            if (!response.ok) {
                throw new Error(`Failed to fetch comic: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            comicImage.src = url;
            comicTitle.textContent = "Calvin and Hobbes - January 2, 1990";

            localStorage.setItem('lastComicFetchDate', today);
        } catch (error) {
            console.error('Error fetching comic:', error);
        }
    }
});
