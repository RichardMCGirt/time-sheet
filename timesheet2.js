document.addEventListener("DOMContentLoaded", function () {
    function waitForUserEmail(callback, retries = 10) {
        const el = document.getElementById("user-email");
        if (el && el.textContent.trim()) {
            callback(el.textContent.trim().toLowerCase());
        } else if (retries > 0) {
            setTimeout(() => waitForUserEmail(callback, retries - 1), 300);
        } else {
            console.warn("❗ #user-email not found or empty after retries");
        }
    }

    waitForUserEmail((userEmail) => {
        console.log("✅ Resolved user email for jumpscare check:", userEmail);

        if (userEmail === "diana.smith@vanirinstalledsales.com") {
            const jumpscareKey = "dianaJumpscareDate";
            const today = new Date().toISOString().split("T")[0];
            const lastShownDate = localStorage.getItem(jumpscareKey);

            if (lastShownDate !== today) {
let countdown = 10;
                console.log(`👻 Jumpscare for Diana will trigger in ${countdown} seconds`);

                const interval = setInterval(() => {
                    countdown--;
                    if (countdown % 60 === 0 || countdown <= 20) {
                        console.log(`⏳ ${countdown} seconds remaining`);
                    }
                    if (countdown <= 0) {
                        clearInterval(interval);
                        console.log("🎯 Triggering Diana's jumpscare!");
                        localStorage.setItem(jumpscareKey, today);
                        triggerDianaJumpscare();
                    }
                }, 1000);
            } else {
                console.log("✅ Diana's jumpscare already triggered today.");
            }
        }
    });
});



document.querySelectorAll('.remaining-personal-hours').forEach(el => {
    el.textContent = Math.floor(parseFloat(el.textContent));
});

    async function autoLogin(email) {
        const password = "Vanir2024!!"; // Hardcoded password
        console.log(`Attempting auto-login as ${email}`);

        try {
            const user = await fetchUserFromAirtable(email, password);

            if (user) {
                console.log("User authenticated:", user);

                // Store user info in localStorage
                localStorage.setItem("userEmail", email);
                sessionStorage.setItem("user", JSON.stringify(user));

                // Redirect to the appropriate page
                const employeeRedirectEmails = [
                    "brett.moss@vanirinstalledsales.com",
                    "tony.amenta@vanirinstalledsales.com",
                    "josh@vanirinstalledsales.com",
                    "ethen.wilson@vanirinstalledsales.com",
                    "jason.smith@vanirinstalledsales.com",
                    "dallas.hudson@vanirinstalledsales.com",
                    "brooke.slaugenhoup@vanirinstalledsales.com",
                    "carina.gonzalez@vanirinstalledsales.com",
                ];

                if (employeeRedirectEmails.includes(email.toLowerCase())) {
                    window.location.href = "employeetimesheet.html";
                } else {
                    window.location.href = "timesheet.html";
                }
            } else {
                alert("Invalid login credentials.");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Failed to log in.");
        }
    }
function triggerDianaJumpscare() {
    // Create full screen overlay
    const overlay = document.createElement("div");
    overlay.id = "jumpscare-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "black";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "10000";

    // Embed the GIF
    overlay.innerHTML = `
        <div class="tenor-gif-embed" data-postid="23875914" data-share-method="host" data-aspect-ratio="1" data-width="80%">
            <a href="https://tenor.com/view/dandadan-dandamazing-manga-momo-ayase-gif-23875914">Dandadan Dandamazing GIF</a> from 
            <a href="https://tenor.com/search/dandadan-gifs">Dandadan GIFs</a>
        </div>
        <style>
            #jumpscare-overlay a { color: white; font-size: 12px; }
        </style>
    `;

    // Remove after 4 seconds (adjust if needed)
    setTimeout(() => {
        overlay.remove();
    }, 4000);

    document.body.appendChild(overlay);

    // Load the Tenor script once
    if (!document.getElementById("tenor-embed-script")) {
        const script = document.createElement("script");
        script.id = "tenor-embed-script";
        script.src = "https://tenor.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
    }
}


//document.addEventListener("DOMContentLoaded", function () {
    // Add test button for jumpscare
  //  const testBtn = document.createElement("button");
    //testBtn.textContent = "🎃 Trigger Diana Jumpscare";
    //testBtn.style.position = "fixed";
   // testBtn.style.bottom = "20px";
   // testBtn.style.right = "20px";
   // testBtn.style.zIndex = "9999";
   // testBtn.style.padding = "10px";
   // testBtn.style.backgroundColor = "#ff0044";
   // testBtn.style.color = "#fff";
   // testBtn.style.border = "none";
   // testBtn.style.borderRadius = "8px";
   // testBtn.style.cursor = "pointer";

   // testBtn.addEventListener("click", triggerDianaJumpscare);
   // document.body.appendChild(testBtn);
//});


    async function fetchUserFromAirtable(email, password) {
        const apiKey = "pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c";
        const baseId = "appD3QeLneqfNdX12";
        const tableId = "tbljmLpqXScwhiWTt";

        const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({email}='${email}', {password}='${password}')`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const data = await response.json();
            return data.records.length > 0 ? data.records[0].fields : null;
        } catch (error) {
            console.error("Error fetching user:", error);
            return null;
        }
    }

    document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed. Initializing time dropdowns...");
    initializeTimeDropdowns();

    // Check if logged-in user is Luz Arceo
    const userEmail = document.getElementById('user-email').textContent.trim();
    console.log("User Email:", userEmail);

    if (userEmail === 'luz.arceo@vanirinstalledsales.com') {
        console.log("Luz detected. Checking if shortcut prompt has been shown today.");

        const lastShownDate = localStorage.getItem('shortcutPromptDate');
        const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD

        if (lastShownDate !== today) {
            console.log("Showing shortcut prompt for today.");

            // Create a centered div message
            const centerMessage = document.createElement("div");
            centerMessage.id = "center-message";
            centerMessage.innerHTML = `
                <div class="message-box">
                    <p>Would you like to apply your AI-generated shortcut?</p>
                    <button id="apply-shortcut">Yes</button>
                    <button id="dismiss-message">No</button>
                </div>
            `;
            document.body.appendChild(centerMessage);

            // Add event listeners to buttons
            document.getElementById("apply-shortcut").addEventListener("click", function() {
                console.log("Applying Luz's shortcut...");
                applyDianaShortcut();
                centerMessage.remove(); // Remove the message after applying shortcut
                localStorage.setItem('shortcutPromptDate', today); // Save date to prevent re-showing
            });

            document.getElementById("dismiss-message").addEventListener("click", function() {
                console.log("User declined shortcut.");
                centerMessage.remove(); // Remove the message
                localStorage.setItem('shortcutPromptDate', today); // Save date to prevent re-showing
            });
        } else {
            console.log("Shortcut prompt has already been shown today. Skipping.");
        }
    }

    // Hide the navbar initially if the loading bar is visible
    toggleNavbar();

    // Assume loading completes after some time (you can replace this with actual logic when loading completes)
    setTimeout(function() {
        setLoadingState(false); // This will hide the loading bar and show the navbar
    }, 3000); // Example timeout, adjust according to your loading logic

    addGlobal55Shortcut(); // Add the "77" shortcut functionality
});

// Function to check if PTO or personal hours have been used
function checkTimeUsed() {
    const ptoTime = parseInt(document.getElementById('pto-time').innerText, 10);
    const personalTime = parseInt(document.getElementById('total-personal-time-display').innerText, 10);

    // Check if any Personal_hoursX input is greater than zero
    let personalHoursGreaterThanZero = false;
    document.querySelectorAll('input[name^="Personal_hours"]').forEach(function(input) {
        if (parseInt(input.value, 10) > 0) {
            personalHoursGreaterThanZero = true;
        }
    });

    // Hide the .info-container if any condition is met
    if (ptoTime > 0 || personalTime > 0 || personalHoursGreaterThanZero) {
        document.querySelector('.info-container').style.display = 'none';
    } else {
        document.querySelector('.info-container').style.display = 'block';
    }
}

// Function to enforce max limit of 10 for PTO_hoursX and disable the increase button if remaining PTO hours is zero
function checkRemainingPtoHours() {
    const remainingPtoHours = parseFloat(document.getElementById('remaining-pto-hours').innerText);

    document.querySelectorAll('input[name^="PTO_hours"]').forEach(function(input) {
        const currentValue = parseFloat(input.value);
        const maxPto = 10;

        if (remainingPtoHours <= 0) {
            input.setAttribute('max', currentValue); // Disable increase by setting max to current value if remaining PTO is zero
        } else if (currentValue >= maxPto) {
            input.value = maxPto; // Set the value to the maximum PTO hours allowed (10)
            input.setAttribute('max', maxPto); // Limit further increase to 10
        } else {
            input.setAttribute('max', maxPto); // Ensure that max is set to 10 for valid cases
        }
    });
}

// Function to enforce max limit of 10 for PTO_hoursX and disable the increase if remaining PTO hours is zero
function checkRemainingPtoHours() {
    const remainingPtoHours = parseFloat(document.getElementById('remaining-pto-hours').innerText);

    document.querySelectorAll('input[name^="PTO_hours"]').forEach(function(input) {
        const currentValue = parseFloat(input.value);
        const maxPto = 10;

        if (remainingPtoHours <= 0) {
            input.setAttribute('max', currentValue); // Disable increase by setting max to current value if remaining PTO is zero
        } else if (currentValue >= maxPto) {
            input.value = maxPto; // Set the value to the maximum PTO hours allowed (10)
            input.setAttribute('max', maxPto); // Limit further increase to 10
        } else {
            input.setAttribute('max', maxPto); // Ensure that max is set to 10 for valid cases
        }
    });
}

// Function to enforce max limit of 8 for Personal_hoursX and disable the increase if remaining personal hours is zero
function checkRemainingPersonalHours() {
    const remainingPersonalHours = parseFloat(document.getElementById('remaining-personal-hours').innerText);

    document.querySelectorAll('input[name^="Personal_hours"]').forEach(function(input) {
        const currentValue = parseFloat(input.value);
        const maxPersonal = 8;

        if (remainingPersonalHours <= 0) {
            input.setAttribute('max', currentValue); // Disable increase by setting max to current value if remaining personal is zero
        } else if (currentValue >= maxPersonal) {
            input.value = maxPersonal; // Set the value to the maximum personal hours allowed (8)
            input.setAttribute('max', maxPersonal); // Limit further increase to 8
        } else {
            input.setAttribute('max', maxPersonal); // Ensure that max is set to 8 for valid cases
        }
    });
}

// Observe changes in the PTO, personal time, and remaining PTO and personal hours elements
const ptoTimeElement = document.getElementById('pto-time');
const personalTimeElement = document.getElementById('total-personal-time-display');
const remainingPersonalHoursElement = document.getElementById('remaining-personal-hours');
const remainingPtoHoursElement = document.getElementById('remaining-pto-hours');

// Create a MutationObserver to detect changes in the text content of the PTO, personal time, and remaining personal hours elements
const observer = new MutationObserver(function() {
    checkTimeUsed();
    checkRemainingPtoHours();
    checkRemainingPersonalHours();
});

// Set the observer to monitor changes in child nodes (text) of the elements
observer.observe(ptoTimeElement, { childList: true });
observer.observe(personalTimeElement, { childList: true });
observer.observe(remainingPersonalHoursElement, { childList: true, subtree: true });
observer.observe(remainingPtoHoursElement, { childList: true, subtree: true });

// Add event listeners to the Personal_hoursX and PTO_hoursX inputs to detect changes in their values
document.querySelectorAll('input[name^="Personal_hours"], input[name^="PTO_hours"]').forEach(function(input) {
    input.addEventListener('input', function() {
        checkTimeUsed();
        checkRemainingPtoHours();
        checkRemainingPersonalHours();
    });
});

// Initial check on page load
document.addEventListener('DOMContentLoaded', function() {
    checkTimeUsed();
    checkRemainingPtoHours();
    checkRemainingPersonalHours();
});


function addGlobal55Shortcut() {
    let keysPressed = "";

    document.addEventListener('keydown', function(event) {
        if (document.activeElement.tagName !== 'INPUT') { // Ensure no input is focused
            keysPressed += event.key; // Append the pressed key to the string

            if (keysPressed.endsWith('55')) {
                apply55Shortcut(); // Trigger the shortcut
                keysPressed = ""; // Reset the key sequence
            }

            // Optionally, clear the string if it gets too long or doesn't match
            if (keysPressed.length > 2) {
                keysPressed = keysPressed.slice(-2); // Keep only the last two characters
            }
        }
    });
}

function apply55Shortcut() {
    const timeEntryTable = document.getElementById('time-entry-table');
    const rows = timeEntryTable.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const index = parseInt(row.dataset.day, 10);
        const startTimeInput = row.querySelector('input[name^="start_time"]');
        const endTimeInput = row.querySelector('input[name^="end_time"]');
        const lunchStartInput = row.querySelector('input[name^="lunch_start"]');
        const lunchEndInput = row.querySelector('input[name^="lunch_end"]');

        if (index === 7) {
            startTimeInput.value = '07:00';
            endTimeInput.value = '12:00';
        } else if ([1, 2, 3, 6].includes(index)) {
            startTimeInput.value = '07:00';
            endTimeInput.value = '16:00';
            lunchStartInput.value = '12:00'; // Set lunch start time to 12:00 PM
            lunchEndInput.value = '13:00';   // Set lunch end time to 1:00 PM
        }
    });
}

function initializeTimeDropdowns() {
    const timeEntryTable = document.getElementById('time-entry-table');
    const inputs = timeEntryTable.querySelectorAll('input[type="time"], input[type="number"]');

    inputs.forEach(input => {
        input.addEventListener('change', checkInputsAndToggleSummary);
        input.addEventListener('keydown', handleKeyNavigation);
        input.addEventListener('keyup', handleTimeInput);
    });

    // Initial check to set the correct visibility of the summary section on page load
    checkInputsAndToggleSummary();
}

function checkInputsAndToggleSummary() {
    const timeEntryTable = document.getElementById('time-entry-table');
    const inputs = timeEntryTable.querySelectorAll('input[type="time"], input[type="number"]');
    const summarySection = document.getElementById('summary');
    let hasInput = Array.from(inputs).some(input => input.value);

    summarySection.style.display = hasInput ? 'flex' : 'none';
}

function handleKeyNavigation(event) {
    const key = event.key;
    const input = event.target;

    // Allow left and right arrow navigation for all input types
    if (key === 'ArrowRight') {
        navigateToNextField(input);
    } else if (key === 'ArrowLeft') {
        navigateToPreviousField(input);
    }
    
// Prevent up and down arrow navigation for number and time inputs
if (input.type !== 'number' && input.type !== 'time') {
    if (key === 'ArrowDown') {
        navigateToNextField(input);
    } else if (key === 'ArrowUp') {
        navigateToPreviousField(input);
    }
}
}

function navigateToNextField(currentField) {
    const timeEntryTable = document.getElementById('time-entry-table');
    const inputs = Array.from(timeEntryTable.querySelectorAll('input[type="time"], input[type="number"]'));
    const currentIndex = inputs.indexOf(currentField);

    for (let i = currentIndex + 1; i < inputs.length; i++) {
        if (!isFieldInSkippedDay(inputs[i])) {
            inputs[i].focus();
            break;
        }
    }
}

function navigateToPreviousField(currentField) {
    const timeEntryTable = document.getElementById('time-entry-table');
    const inputs = Array.from(timeEntryTable.querySelectorAll('input[type="time"], input[type="number"]'));
    const currentIndex = inputs.indexOf(currentField);

    for (let i = currentIndex - 1; i >= 0; i--) {
        if (!isFieldInSkippedDay(inputs[i])) {
            inputs[i].focus();
            break;
        }
    }
}

function getDayNumberFromField(field) {
    const name = field.name;
    const match = name.match(/date(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

function isFieldInSkippedDay(field) {
    const inputs = Array.from(document.querySelectorAll('input'));
    const fieldIndex = inputs.indexOf(field);
    const indexesToSkip = [4, 5]; // Input indexes to skip
    return indexesToSkip.includes(fieldIndex);
}

function handleTimeInput(event) {
    const value = event.target.value.toUpperCase();
    if (value.includes('AM') || value.includes('PM')) {
        navigateToNextField(event.target);
    }
}

function toggleNavbar(isLoading) {
    const loadingBar = document.getElementById('loading-bar-container');
    const navbar = document.getElementById('navbar');

    if (isLoading) {
        loadingBar.style.display = 'block';
        navbar.style.display = 'none';
    } else {
        loadingBar.style.display = 'none';
        navbar.style.display = 'block';
    }
}

function setLoadingState(isLoading) {
    toggleNavbar(isLoading); // Adjust the navbar and loading bar visibility accordingly
}

// Event listeners for logout and email navigation
document.getElementById('logout-button').addEventListener('click', function(event) {
    event.preventDefault();
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
});

document.getElementById('user-email').addEventListener('click', function() {
    // Retrieve the email from the user email field
    const userEmail = document.getElementById('user-email').textContent.trim();

    // Check if the user is Katy, redirect to supervisor.html, otherwise to employeetimesheet.html
    if (userEmail === 'katy@vanirinstalledsales.com') {
        window.location.href = 'supervisor.html';
    } else {
        window.location.href = 'employeetimesheet.html';
    }
});


document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            console.log(`Checkbox ${this.id} was checked and rotated.`);
        } else {
            console.log(`Checkbox ${this.id} was unchecked.`);
        }
    });
});