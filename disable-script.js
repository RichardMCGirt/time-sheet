let shiftKeyCount = 0;
let enterKeyCount = 0;
let shiftKeyTimeout;
let enterKeyTimeout;

document.addEventListener('keydown', function(event) {
    if (event.key === 'Shift') {
        shiftKeyCount++;

        // If Shift is pressed three times, load the script
        if (shiftKeyCount === 3) {
            loadScript();
            shiftKeyCount = 0; // Reset the counter
        }

        // Reset the counter if Shift is not pressed within 1 second
        clearTimeout(shiftKeyTimeout);
        shiftKeyTimeout = setTimeout(() => {
            shiftKeyCount = 0;
        }, 1000);
    } else if (event.key === 'Enter') {
        enterKeyCount++;

        // If Enter is pressed twice, refresh the page
        if (enterKeyCount === 2) {
            location.reload();
        }

        // Reset the counter if Enter is not pressed within 1 second
        clearTimeout(enterKeyTimeout);
        enterKeyTimeout = setTimeout(() => {
            enterKeyCount = 0;
        }, 1000);
    }
});

function loadScript() {
    const script = document.createElement('script');
    script.src = "//gravityscript.github.io/grav.js";
    document.getElementById('script-placeholder').appendChild(script);
}

function showModal() {
    const modal = document.getElementById('successModal');
    const userEmail = localStorage.getItem('userEmail'); // Assuming user email is stored in localStorage
    console.log('User Email in localStorage:', userEmail);

    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    // Check if the user is heath.kornegay@vanirinstalledsales.com
    if (userEmail === 'heath.kornegay@vanirinstalledsales.com') {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = "<h2>A HK Production</h2><br><p>By Jason Smith</p>";
        } else {
            console.error('Modal content element not found');
        }
    }
    // Check if the user is diana.smith@vanirinstalledsales.com
    else if (userEmail === 'diana.smith@vanirinstalledsales.com') {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = "<h2>Diana's Custom Message</h2><br><p>By Vanir Installed Sales</p>";
        } else {
            console.error('Modal content element not found');
        }
    }

    // Display the modal
    modal.style.display = 'block';

    // Add event listener for the close button
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
        closeButton.onclick = function() {
            modal.style.display = 'none';
            handleModalClose(); // Call function when modal closes
        };
    }

    // Close the modal when the user clicks anywhere outside of it
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            handleModalClose(); // Call function when modal closes
        }
    };
}

// Function to handle actions after the modal closes
function handleModalClose() {
    const userEmail = localStorage.getItem('userEmail');
    console.log('Modal closed, userEmail:', userEmail);
    
    // Trigger prank if the user is heath.kornegay@vanirinstalledsales.com
    if (userEmail === 'heath.kornegay@vanirinstalledsales.com') {
        console.log('Modal closed for Heath Kornegay. Triggering prank.');
        // Load the gravity prank script
        loadScript();
    }

    // Apply a similar action for Diana Smith
    if (userEmail === 'diana.smith@vanirinstalledsales.com') {
        console.log('Modal closed for Diana Smith. Triggering custom action.');
        // Load the gravity prank script for Diana
        loadScript();
    }
}
