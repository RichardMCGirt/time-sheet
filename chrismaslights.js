document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // Create a container for Christmas lights
    const lightsContainer = document.createElement('div');
    lightsContainer.classList.add('christmas-lights-container');
    body.appendChild(lightsContainer);

    // Number of lights for random background
    const numberOfLights = 50;

    // Function to create a single light
    const createLight = (x, y, color) => {
        const light = document.createElement('span');
        light.classList.add('light');
        light.style.backgroundColor = color;
        light.style.left = x + 'px';
        light.style.top = y + 'px';
        return light;
    };

    // Add randomly positioned lights
    const randomLights = () => {
        for (let i = 0; i < numberOfLights; i++) {
            const randomX = Math.random() * window.innerWidth;
            const randomY = Math.random() * window.innerHeight;
            const colors = ['red', 'green', 'blue', 'yellow', 'pink'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            lightsContainer.appendChild(createLight(randomX, randomY, randomColor));
        }
    };

    // Add lights to spell out "Vanir" horizontally
    const spellVanir = () => {
        const vanirContainer = document.createElement('div');
        vanirContainer.classList.add('vanir-lights-container');
        body.appendChild(vanirContainer);

        // Define a grid pattern for each letter with spacing
        const gridSize = 40; // Spacing between lights in a letter
        const letterSpacing = 220; // Spacing between letters
        const colors = ['red', 'green', 'blue', 'yellow', 'pink'];
        const vanirPattern = [
            ' *   * ', // V
            '* * * *',
            '*  *  *',
            ' *    *',
            '  *  * ',
            '   **  ',
            '*******', // A
            '*     *',
            '*******',
            '*     *',
            '*     *',
            '*     *', // N
            '*     *',
            '* *   *',
            '*  *  *',
            '*   * *',
            '*    * ',
            '   *   ', // I
            '   *   ',
            '   *   ',
            '   *   ',
            '   *   ',
            '*******', // R
            '*     *',
            '*   ** ',
            '* **   ',
            '**     ',
            '* **   ',
        ];

        // Position each letter horizontally
        let startX = 100; // Starting x position
        let startY = 100; // Starting y position
        let currentX = startX;

        for (let i = 0; i < 5; i++) { // Loop through 5 letters
            vanirPattern.forEach((row, rowIndex) => {
                row.split('').forEach((char, colIndex) => {
                    if (char === '*') {
                        const x = currentX + colIndex * gridSize;
                        const y = startY + rowIndex * gridSize;
                        const randomColor = colors[Math.floor(Math.random() * colors.length)];
                        vanirContainer.appendChild(createLight(x, y, randomColor));
                    }
                });
            });
            currentX += letterSpacing; // Move to the next letter position
        }
    };

    // Add both random and patterned lights
    randomLights();
    spellVanir();
});
