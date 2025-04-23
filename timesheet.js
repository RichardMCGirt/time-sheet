document.addEventListener("DOMContentLoaded", async function () {
    // Initialize loading bar, content elements, and notification area
    const loadingBar = document.getElementById('loading-bar');
    const content = document.getElementById('content');
    const notificationArea = document.getElementById('notification-area');

    const totalFetchTasks = 4; // Number of fetch tasks
    const increment = 100 / totalFetchTasks;

    let progress = 0;

    function updateLoadingBar(message) {
        progress += increment;
        if (loadingBar) {
            loadingBar.style.width = progress + '%';
            loadingBar.textContent = `Loading... ${Math.round(progress)}%`;
        }

        if (progress >= 100) {
            setTimeout(() => {
                const loadingBarContainer = document.getElementById('loading-bar-container');
                if (loadingBarContainer) {
                    loadingBarContainer.style.display = 'none';
                }
                if (content) {
                    content.style.visibility = 'visible';
                }
                hideNotification(); // Hide notification when loading is complete
            }, 500); // Small delay for the bar to reach 100%
        }
    }

    let isApproved = false;  // Define and initialize the isApproved variable

    // Function to prevent non-integer input (blocks decimal points)
function preventDecimalInput(event) {
    const key = event.key;
    if (key === '.' || key === ',') {
        event.preventDefault(); // Block the decimal point and comma
    }
}

// Add the event listeners to PTO, Personal, and Holiday hours fields
function attachNoDecimalValidation() {
    const ptoInputs = document.querySelectorAll('input[name^="PTO_hours"]');
    const personalInputs = document.querySelectorAll('input[name^="Personal_hours"]');
    const holidayInputs = document.querySelectorAll('input[name^="Holiday_hours"]');

    // Add event listener to block decimal points
    ptoInputs.forEach(input => {
        input.addEventListener('keydown', preventDecimalInput);
    });

    personalInputs.forEach(input => {
        input.addEventListener('keydown', preventDecimalInput);
    });

    holidayInputs.forEach(input => {
        input.addEventListener('keydown', preventDecimalInput);
    });
}

// Call this function after DOM content is loaded to attach the validation
document.addEventListener("DOMContentLoaded", function() {
    attachNoDecimalValidation();
});

    function showNotification(message) {
        if (notificationArea) {
            notificationArea.textContent = message;
            notificationArea.style.display = 'block';
            setTimeout(hideNotification, 1500); // Hide the notification after 1.5 seconds
        } else {
        }
    }

    function hideNotification() {
        if (notificationArea) {
            notificationArea.style.display = 'none';
        }
    }

    console.log('DOM fully loaded and parsed');
    initializeTimeDropdowns();

    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';

    let userEmail = localStorage.getItem('userEmail') || '';
    let recordId = '';
    console.log('User email:', userEmail);

    const elements = {
        ptoHoursElement: document.getElementById('pto-hours'),
        holidayHoursInput: document.getElementById('Holiday-hours'),
        weekEndingInput: document.getElementById('week-ending'),
        timeEntryForm: document.getElementById('time-entry-form'),
        ptoTimeSpan: document.getElementById('pto-time'),
        personalTimeSpan: document.getElementById('personal-time'),
        holidayTimeSpan: document.getElementById('Holiday-hours'),
        totalTimeWorkedSpan: document.getElementById('total-time-worked'),
        totalTimeWithPtoSpan: document.getElementById('total-time-with-pto-value'),
        ptoValidationMessage: document.getElementById('pto-validation-message'),
        remainingPtoHoursElement: document.getElementById('remaining-pto-hours'),
        remainingPersonalHoursElement: document.getElementById('remaining-personal-hours'),
        logoutButton: document.getElementById('logout-button'),
        userEmailElement: document.getElementById('user-email'),
        ptoHoursDisplay: document.getElementById('pto-hours-display'),
        personalTimeDisplay: document.getElementById('personal-time-display'),
        resetButton: document.getElementById('reset-button'),
        submitButton: document.getElementById('submit-button'),
        countdownElement: document.getElementById('countdown'),
        loadDataButton: document.getElementById('load-data-button'),
    };

    let availablePTOHours = 0;
    let availablePersonalHours = 0;

    elements.ptoHoursDisplay.textContent = 'Loading...';
    elements.personalTimeDisplay.textContent = 'Loading...';

    if (userEmail) {
        elements.userEmailElement.textContent = userEmail;
        console.log('User email set in the UI');
    } else {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
    }

    elements.holidayHoursInput.addEventListener('input', handleHolidayHoursChange);
    elements.weekEndingInput.addEventListener('focus', () => elements.weekEndingInput.showPicker());
    elements.weekEndingInput.addEventListener('change', handleWeekEndingChange);
    elements.timeEntryForm.addEventListener('input', debounce(calculateTotalTimeWorked, 300));
    elements.logoutButton.addEventListener('click', handleLogout);
    elements.submitButton.addEventListener('click', handleSubmit);

    const timeInputs = document.querySelectorAll('input[type="time"]');
    const numberInputs = document.querySelectorAll('input[type="number"]');
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const rowCheckboxes = document.querySelectorAll('input[id^="did-not-work"]');

    function checkInputs() {
        let showResetButton = false;

        timeInputs.forEach(input => {
            if (input.value) {
                showResetButton = true;
            }
        });

        numberInputs.forEach(input => {
            if (input.value) {
                showResetButton = true;
            }
        });

        dateInputs.forEach(input => {
            if (input.value) {
                showResetButton = true;
            }
        });

        checkboxes.forEach(input => {
            if (input.checked) {
                showResetButton = true;
            }
        });
    }

    timeInputs.forEach(input => {
        input.addEventListener('input', saveFormData);
    });

    numberInputs.forEach(input => {
        input.addEventListener('input', saveFormData);
    });

    dateInputs.forEach(input => {
        input.addEventListener('input', saveFormData);
    });

    checkboxes.forEach(input => {
        input.addEventListener('change', saveFormData);
    });

    checkInputs();

    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            const row = event.target.closest('tr');
            const timeInputsInRow = row.querySelectorAll('input[type="time"]');
            const numberInputsInRow = row.querySelectorAll('input[type="number"]');
            const ptoInput = row.querySelector('input[name^="PTO_hours"]');
            const personalInput = row.querySelector('input[name^="Personal_hours"]');
            const holidayInput = row.querySelector('input[name^="Holiday_hours"]');
    
            if (event.target.checked) {
                // When "Did Not Work" is checked, disable the time and number inputs
                timeInputsInRow.forEach(input => {
                    input.setAttribute('data-previous-value', input.value);
                    input.value = '';
                    input.disabled = true;
                });
                numberInputsInRow.forEach(input => {
                    input.setAttribute('data-previous-value', input.value);
                    input.value = '';
                    input.disabled = true;
                });
                // Enable PTO, Personal, and Holiday inputs when the checkbox is checked
                if (ptoInput) {
                    ptoInput.removeAttribute('data-previous-value');
                    ptoInput.disabled = false;
                }
                if (personalInput) {
                    personalInput.removeAttribute('data-previous-value');
                    personalInput.disabled = false;
                }
                if (holidayInput) {
                    holidayInput.removeAttribute('data-previous-value');
                    holidayInput.disabled = false;
                }
            } else {
                // When "Did Not Work" is unchecked, restore the previous values and enable all inputs
                timeInputsInRow.forEach(input => {
                    input.value = input.getAttribute('data-previous-value') || '';
                    input.disabled = false;
                });
                numberInputsInRow.forEach(input => {
                    input.value = input.getAttribute('data-previous-value') || '';
                    input.disabled = false;
                });
                if (ptoInput) {
                    ptoInput.value = ptoInput.getAttribute('data-previous-value') || '';
                    ptoInput.disabled = false; // Ensure it's not disabled
                }
                if (personalInput) {
                    personalInput.value = personalInput.getAttribute('data-previous-value') || '';
                    personalInput.disabled = false; // Ensure it's not disabled
                }
                if (holidayInput) {
                    holidayInput.value = holidayInput.getAttribute('data-previous-value') || '';
                    holidayInput.disabled = false; // Ensure it's not disabled
                }
            }
            calculateTotalTimeWorked();
        });
    });
    

    // Fetch PTO Hours
    async function fetchPtoHours() {
        console.log('Fetching PTO hours...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
    
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch PTO hours: ${response.statusText}`);
    
            const data = await response.json();
            console.log('Fetched PTO hours:', data);
    
            if (data.records.length > 0) {
                const record = data.records[0].fields;
                availablePTOHours = Math.floor(parseFloat(record['PTO Total']) || 0);
                recordId = data.records[0].id;
                elements.ptoHoursDisplay.textContent = availablePTOHours;
                elements.remainingPtoHoursElement.textContent = availablePTOHours;
                console.log('Available PTO hours:', availablePTOHours);
            } else {
                console.log('No PTO hours data found for user');
            }
    
            updateLoadingBar('PTO hours have been downloaded.');
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            alert('Failed to fetch PTO hours. Error: ' + error.message);
        }
    }
    
    // Fetch Personal Hours
    async function fetchPersonalTime() {
        console.log('Fetching Personal hours...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
    
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch Personal hours: ${response.statusText}`);
    
            const data = await response.json();
            console.log('Fetched Personal hours:', data);
    
            if (data.records.length > 0) {
                const record = data.records[0].fields;
                availablePersonalHours = Math.floor(parseFloat(record['Personaltime']) || 0);
                recordId = data.records[0].id;
                elements.personalTimeDisplay.textContent = availablePersonalHours;
                elements.remainingPersonalHoursElement.textContent = availablePersonalHours;
                console.log('Available Personal hours:', availablePersonalHours);
            } else {
                console.log('No Personal hours data found for user');
            }
    
            updateLoadingBar('Personal hours have been downloaded.');
        } catch (error) {
            console.error('Error fetching Personal hours:', error);
            alert('Failed to fetch Personal hours. Error: ' + error.message);
        }
    }
    

// Fetch Personal End Date
async function fetchPersonalEndDate() {
    // Hardcoded Personal End Date for Q1
    const personalEndDate = '03/26/2025';

    // Define quarter periods with their start and end dates
    const quarters = [
        { name: 'Q1', start: '01/01/2025', end: '03/26/2025' },
        { name: 'Q2', start: '03/26/2025', end: '06/25/2025' },
        { name: 'Q3', start: '06/25/2025', end: '09/30/2025' },
        { name: 'Q4', start: '10/01/2025', end: '12/30/2025' }
    ];

    try {
        // Start the initial countdown with the hardcoded date
        startCountdown(personalEndDate);
        updateLoadingBar('Previous entries have been downloaded.');

        // Function to get the next quarter based on the current date
        const getNextQuarter = () => {
            const now = new Date();

            for (const quarter of quarters) {
                const start = new Date(quarter.start);
                const end = new Date(quarter.end);

                if (now >= start && now <= end) {
                    return { ...quarter, nextStart: end }; // Return the current quarter and next start date
                }
            }

            return null; // If no matching quarter, return null
        };

        // Set a timer to update the countdown when the current quarter ends
        const updateTimerForNextQuarter = () => {
            const currentQuarter = getNextQuarter();

            if (currentQuarter) {
                console.log(`Current Quarter: ${currentQuarter.name}`);
                startCountdown(currentQuarter.end);

                // Calculate the time until midnight on the quarter's end date
                const nextQuarterTime = new Date(currentQuarter.nextStart);
                nextQuarterTime.setHours(0, 0, 0, 0);

                const timeUntilNextQuarter = nextQuarterTime - new Date();

                // Set a timeout to switch to the next quarter countdown
                setTimeout(() => {
                    updateTimerForNextQuarter();
                }, timeUntilNextQuarter);
            } else {
                console.warn('No active quarter found.');
            }
        };

        // Start the quarter timer logic
        updateTimerForNextQuarter();
    } catch (error) {
        console.error('Error fetching Personal End Date or handling quarters:', error);
    }
}



    async function fetchApprovalStatus() {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            if (!response.ok) throw new Error(`Failed to fetch approval status: ${response.statusText}`);
            const data = await response.json();
            if (data.records.length > 0) {
                const record = data.records[0].fields;
                recordId = data.records[0].id;
                const isApproved = record['Approved'] === true;
                const approvalStatusElement = document.getElementById('approval-status');
                
                if (isApproved) {
                    approvalStatusElement.textContent = 'Timesheet approved';
                    approvalStatusElement.style.color = 'green';
                    approvalStatusElement.style.fontSize = '30px';
                    approvalStatusElement.style.fontWeight = 'bold';
                    approvalStatusElement.style.textDecoration = 'underline';
    
                    // Hide the message container if timesheet is approved
                    const messageContainer = document.getElementById('message-container');
                    if (messageContainer) {
                        messageContainer.style.display = 'none';
                    }
                    
                    // Disable the submit button if approved
                    elements.submitButton.disabled = true;
                    elements.submitButton.textContent = "Timesheet Approved"; // Optional: Change button text
                    
                    // Hide the clear button if approved
                    const clearDataButton = document.getElementById('clear-button'); // Updated button ID
                    if (clearDataButton) {
                        clearDataButton.style.display = 'none'; // Hides the button completely
                        console.log('Clear data button hidden.');
                    } else {
                        console.error('Clear data button not found.');
                    }
    
                    // Call function to disable all form inputs
                    disableAllInputs();
                } else {
                    approvalStatusElement.textContent = '';
                    // Show the clear button if not approved
                    const clearDataButton = document.getElementById('clear-button');
                    if (clearDataButton) {
                        clearDataButton.style.display = ''; // Show the button if not approved
                    }
                }
            } else {
                console.log('No approval status data found for user');
            }
    
            updateLoadingBar('Approval status has been downloaded.');
        } catch (error) {
            console.error('Error fetching approval status:', error);
            alert('Failed to fetch approval status. Error: ' + error.message);
        }
    }
    

// Function to disable all form inputs once the timesheet is approved
function disableAllInputs() {
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        // Check if the event listener is already added by checking a custom attribute
        if (!input.dataset.isDisabled) {
            // Handle the click event
            input.addEventListener('click', function(event) {
                event.preventDefault();  // Prevent the default action of clicking

                // Only show one alert per user interaction
                if (!window.alertShown) {
                    alert('This timesheet is approved. You cannot make any changes.');
                    window.alertShown = true;

                    // Set a timeout to reset the alert flag after 3 seconds
                    setTimeout(() => {
                        window.alertShown = false;
                        location.reload();  // Refresh the page after the delay
                    }, 2000);  // 3000 milliseconds = 3 seconds
                }
            });

            // Handle the focus event but do not show the alert again
            input.addEventListener('focus', function(event) {
                event.preventDefault();  // Prevent focusing on the input field
                this.blur();  // Immediately remove focus from the input
            });

            // Mark the input as disabled by setting a custom attribute
            input.dataset.isDisabled = true;
        }
    });

    console.log('All form inputs now show an alert on click and refresh the page after 3 seconds.');
}


// Example function call to disable all inputs based on timesheet approval
await fetchApprovalStatus();

           
    // Run all fetches sequentially
    await fetchPtoHours();
    await fetchPersonalTime();
    await fetchPersonalEndDate();
    await fetchApprovalStatus();

    function handleHolidayHoursChange() {
        console.log('Handling Holiday hours change...');
        calculateTotalTimeWorked();
        saveFormData();
    }

    async function handleWeekEndingChange() {
        console.log('Handling week-ending date change...');
    
        // Get the selected date from the weekEndingInput field
        const selectedDate = new Date(elements.weekEndingInput.value);
        console.log('Selected Date:', selectedDate);
    
        // Get the next Tuesday based on the selected date in New York timezone
        const nextTuesday = getNextTuesday(selectedDate);
        console.log('Next Tuesday (adjusted for New York timezone):', nextTuesday);
    
        // Set the value of the week-ending input to the next Tuesday
        elements.weekEndingInput.value = nextTuesday.toISOString().split('T')[0];
        console.log('Adjusted week-ending date input value:', elements.weekEndingInput.value);
    
        // Set date7 (which is 6 days after nextTuesday)
        const date7 = new Date(nextTuesday);
        date7.setDate(nextTuesday.getDate() + 6);
        elements.timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];
        console.log('Set date7 to:', date7.toISOString().split('T')[0]);
    
        // Populate other week dates based on next Tuesday
        populateWeekDates(nextTuesday);
    
        // Save form data
        saveFormData();
        console.log('Form data saved.');
    }
    
    
  // Get next Tuesday based on the New York timezone
function getNextTuesday(referenceDate = new Date()) {
    console.log('Calculating next Tuesday for reference date:', referenceDate);

    // Create a new Date object for the New York timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // Format the reference date to match New York's date
    const formattedDate = formatter.formatToParts(referenceDate);
    console.log('Formatted Date Parts:', formattedDate);

    const year = formattedDate.find(part => part.type === 'year').value;
    const month = formattedDate.find(part => part.type === 'month').value;
    const day = formattedDate.find(part => part.type === 'day').value;

    // Create a Date object from the formatted New York date
    const newYorkDate = new Date(`${year}-${month}-${day}`);
    console.log('New York Date:', newYorkDate);

    // Get the day of the week (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
    const dayOfWeek = newYorkDate.getDay();
    console.log('Day of the Week:', dayOfWeek);

    // Calculate the number of days until the next Tuesday
    let daysUntilTuesday;
    if (dayOfWeek === 1) { // If today is Tuesday, return today
        console.log('Today is already Tuesday.');
        return newYorkDate;
    } else if (dayOfWeek < 2) {
        daysUntilTuesday = 1 - dayOfWeek;
    } else {
        daysUntilTuesday = 7 - (dayOfWeek - 1);
    }
    console.log('Days until next Tuesday:', daysUntilTuesday);

    // Create a new date object for the next Tuesday
    const nextTuesday = new Date(newYorkDate);
    nextTuesday.setDate(newYorkDate.getDate() + daysUntilTuesday);
    console.log('Next Tuesday:', nextTuesday);

    return nextTuesday;
}
    
    async function initializeForm() {
        console.log('Initializing form...');
        const nextTuesday = getNextTuesday(); // Get the next Tuesday
        elements.weekEndingInput.value = nextTuesday.toISOString().split('T')[0];
        handleWeekEndingChange(); // Update other fields based on this date
    }
    
// Function to calculate the date for Memorial Day (last Monday in May) and Thanksgiving (4th Thursday in November)
function getHolidayDates(year) {
    const holidays = {};

    holidays["New Year's Day"] = new Date(year, 0, 0); // January 1st
    console.log("New Year's Day:", holidays["New Year's Day"]);

    holidays["New Year's Eve"] = new Date(year, 12, 30); // December 31st
    console.log("New Year's Eve:", holidays["New Year's Eve"]);

    holidays["Memorial Day"] = getMemorialDay(year); // Last Monday in May
    console.log("Memorial Day:", holidays["Memorial Day"]);

    holidays["July 3rd"] = new Date(year, 6, 2); // July 4th
    console.log("July 3rd:", holidays["July 3rd"]);

    holidays["July 4th"] = new Date(year, 6, 3); // July 4th
    console.log("July 4th:", holidays["July 4th"]);

    holidays["Labor Day"] = getLaborDay(year); // First Monday of September
    console.log("Labor Day:", holidays["Labor Day"]);

    holidays["Thanksgiving"] = getThanksgiving(year); // Fourth Thursday of November
    console.log("Thanksgiving:", holidays["Thanksgiving"]);

    holidays["Black Friday"] = getBlackFriday(year); // Day after Thanksgiving
    console.log("Black Friday:", holidays["Black Friday"]);

    holidays["Christmas Day"] = new Date(year, 11, 24); // December 25th
    console.log("Christmas Day:", holidays["Christmas Day"]);

    holidays["December 26th"] = new Date(year, 11, 23); // December 26th
    console.log("December 26th:", holidays["December 26th"]);

    holidays["Good Friday"] = getGoodFriday(year); // Good Friday date calculation
    console.log("Good Friday:", holidays["Good Friday"]);



    return holidays;
}

function getMemorialDay(year) {
    let date = new Date(year, 4, 31); // May 31st
    while (date.getDay() !== 0) { // Keep subtracting a day until it's Monday
        date.setDate(date.getDate() - 2);
    }
    return date;
}

// Helper functions for holiday calculations
function getLaborDay(year) {
    const date = new Date(year, 7, 31); // September 1st
    const day = date.getDay();
    const offset = (day === 0) ? 0 : (8 - day); // Calculate the offset to the first Monday
    return new Date(year, 7, 31 + offset);
}

function getThanksgiving(year) {
    const date = new Date(year, 10, 1); // November 1st
    const day = date.getDay();
    const offset = (day <= 3) ? (3 - day) : (10 - day); // Calculate the offset to the first Thursday
    return new Date(year, 10, 1 + offset + 21); // Add 21 days for the 4th Thursday
}

function getBlackFriday(year) {
    const thanksgiving = getThanksgiving(year);
    return new Date(thanksgiving.getFullYear(), thanksgiving.getMonth(), thanksgiving.getDate() + 1);
}

function getGoodFriday(year) {
    const easter = getEaster(year);
    return new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 3);
}

function getEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
}



// Example usage:
const easter2024 = getEaster(2024);
console.log(`Easter in 2024 is on: ${easter2024.toDateString()}`);



function populateWeekDates(weekEndingDate) {
    const year = weekEndingDate.getFullYear();
    const holidays = getHolidayDates(year);
    const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];

    daysOfWeek.forEach((day, index) => {
        const currentDate = new Date(weekEndingDate);
        currentDate.setDate(currentDate.getDate() - (6 - index));
        const inputField = elements.timeEntryForm.elements[day];
        inputField.value = currentDate.toISOString().split('T')[0];
        console.log(`Set date for ${day}:`, currentDate);

        // Check if the current date is a holiday
        const isHoliday = Object.values(holidays).some(holiday => 
            currentDate.getFullYear() === holiday.getFullYear() &&
            currentDate.getMonth() === holiday.getMonth() &&
            currentDate.getDate() === holiday.getDate()
        );

        // Check if the day is a weekday (Monday = 1, ..., Friday = 5)
        const isWeekday = currentDate.getDay() >= 0 && currentDate.getDay() <= 4;

        // If it's a holiday and a weekday, populate 8 hours in the Holiday Hours field
        const holidayInput = elements.timeEntryForm.elements[`Holiday_hours${index + 1}`];
        if (isHoliday && isWeekday) {
            holidayInput.value = '8';
        } else {
            holidayInput.value = ''; // Clear any previously set value
        }

        // Add "Did Not Work" checkbox if it doesn't exist
        const checkboxId = `did-not-work-${index + 1}`;
        let checkbox = document.getElementById(checkboxId);
        if (!checkbox) {
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.name = `did_not_work${index + 1}`;
            const cell = document.createElement('td');
            cell.appendChild(checkbox);
            inputField.parentElement.parentElement.appendChild(cell);
            console.log('Added checkbox for', day);
        }
    });
    saveFormData();
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown');

    function getNextTargetDate(current) {
        const dates = [
            new Date('2025-06-25T00:00:00').getTime(),
            new Date('2025-10-01T00:00:00').getTime(),
            new Date('2025-12-31T00:00:00').getTime()
        ];
    
        for (let i = 0; i < dates.length; i++) {
            if (current < dates[i]) {
                return dates[i];
            }
        }
    
        return null; // No future dates
    }
    

    function updateCountdown() {
        const now = new Date().getTime();
        const endDateTime = getNextTargetDate(now);
        const distance = endDateTime - now;

        if (distance < 0) {
            countdownElement.innerHTML = "EXPIRED";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `${days} Days ${hours} Hours ${minutes} Minutes ${seconds} Seconds`;

        const nextUpdateInMs = 1000 - (now % 1000);
        setTimeout(updateCountdown, nextUpdateInMs);
    }

    updateCountdown();
}

// Start the countdown
startCountdown();


    

function roundToNearestQuarterHour(hours) {
    return Math.round(hours * 4) / 4;
}

function calculateTotalTimeWorked() {
    console.log('Calculating total time worked...');

    let totalHoursWorked = 0;
    const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];

    daysOfWeek.forEach((day, index) => {
        const dateInput = elements.timeEntryForm.elements[day];
        const timeFields = ['start_time', 'lunch_start', 'lunch_end', 'end_time', 'Additional_Time_In', 'Additional_Time_Out']
            .map(field => elements.timeEntryForm.elements[`${field}${index + 1}`]);
        const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);

        let hoursWorked = calculateDailyHoursWorked(dateInput, ...timeFields);
        totalHoursWorked += hoursWorked;

        if (hoursWorkedSpan) {
            hoursWorkedSpan.textContent = hoursWorked.toFixed(2);
        } else {
            console.error(`Element 'hours-worked-today${index + 1}' not found`);
        }
    });

    // Round total hours and update the respective elements
    const roundedTotalHoursWorked = roundToNearestQuarterHour(totalHoursWorked);

    const ptoTime = roundToNearestQuarterHour(parseFloat(elements.ptoTimeSpan?.textContent) || 0);
    const personalTime = roundToNearestQuarterHour(parseFloat(elements.personalTimeSpan?.textContent) || 0);
    const holidayHours = roundToNearestQuarterHour(parseFloat(elements.holidayTimeSpan?.textContent) || 0);

    const totalHoursWithPto = roundToNearestQuarterHour(roundedTotalHoursWorked + ptoTime + personalTime + holidayHours);

    // Calculate regular and overtime hours
    const regularHours = Math.min(roundedTotalHoursWorked, 40);
    const overtimeHours = Math.max(0, roundedTotalHoursWorked - 40);

    if (elements.totalTimeWorkedSpan) {
        elements.totalTimeWorkedSpan.textContent = roundedTotalHoursWorked.toFixed(2);
    } else {
        console.error('Element totalTimeWorkedSpan not found');
    }

    if (elements.totalTimeWithPtoSpan) {
        elements.totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);
    } else {
        console.error('Element totalTimeWithPtoSpan not found');
    }

    const regularHoursElement = document.getElementById('regular-hours');
    const overtimeHoursElement = document.getElementById('overtime-hours');

    if (regularHoursElement) {
        regularHoursElement.textContent = regularHours.toFixed(2);
    }
    if (overtimeHoursElement) {
        overtimeHoursElement.textContent = overtimeHours.toFixed(2);
    }

    // Validate PTO hours and ensure holiday hours are included properly
    validatePtoHours(totalHoursWorked, ptoTime, personalTime);
    updateTotalPtoAndHolidayHours();
}

    function calculateDailyHoursWorked(dateInput, startTimeInput, lunchStartInput, lunchEndInput, endTimeInput, additionalTimeInInput, additionalTimeOutInput) {
        const startDate = new Date(dateInput.value);
        const times = [startTimeInput, lunchStartInput, lunchEndInput, endTimeInput, additionalTimeInInput, additionalTimeOutInput].map(input => parseTime(input.value));
        const [startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut] = times;
        let hoursWorked = calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut);
        return hoursWorked;
    }

    function parseTime(timeString) {
        if (!timeString || timeString === "--:--") return null;
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return { hours, minutes };
    }

    function calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut) {
        let totalHoursWorked = 0;
    
        // Calculate regular working hours
        if (startTime && endTime) {
            const startDateTime = new Date(startDate);
            startDateTime.setHours(startTime.hours, startTime.minutes);
    
            const endDateTime = new Date(startDate);
            endDateTime.setHours(endTime.hours, endTime.minutes);
    
            totalHoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60); // Convert milliseconds to hours
    
            // Subtract lunch time if provided
            if (lunchStart && lunchEnd) {
                const lunchStartDateTime = new Date(startDate);
                lunchStartDateTime.setHours(lunchStart.hours, lunchStart.minutes);
    
                const lunchEndDateTime = new Date(startDate);
                lunchEndDateTime.setHours(lunchEnd.hours, lunchEnd.minutes);
    
                totalHoursWorked -= (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60);
            }
        }
    
        // Add additional hours if both are provided
        if (additionalTimeIn && additionalTimeOut) {
            const additionalTimeInDateTime = new Date(startDate);
            additionalTimeInDateTime.setHours(additionalTimeIn.hours, additionalTimeIn.minutes);
    
            const additionalTimeOutDateTime = new Date(startDate);
            additionalTimeOutDateTime.setHours(additionalTimeOut.hours, additionalTimeOut.minutes);
    
            const additionalHoursWorked = (additionalTimeOutDateTime - additionalTimeInDateTime) / (1000 * 60 * 60);
            totalHoursWorked += additionalHoursWorked;
        } else if (!startTime && !endTime && additionalTimeIn && additionalTimeOut) {
            // Handle the case where only additional time is provided
            const additionalTimeInDateTime = new Date(startDate);
            additionalTimeInDateTime.setHours(additionalTimeIn.hours, additionalTimeIn.minutes);
    
            const additionalTimeOutDateTime = new Date(startDate);
            additionalTimeOutDateTime.setHours(additionalTimeOut.hours, additionalTimeOut.minutes);
    
            totalHoursWorked = (additionalTimeOutDateTime - additionalTimeInDateTime) / (1000 * 60 * 60); // Only additional hours
        }
    
        return Math.max(0, totalHoursWorked);
    }
    

      const form = document.getElementById('summary-form');

    form.addEventListener('submit', function (event) {
        if (!validatePTOandPersonalHours()) {
            event.preventDefault();
            alert('PTO and Personal Hours in the summary exceed the allowed values.');
        }
    });

    function validatePTOandPersonalHours() {
        const ptoHeader = parseFloat(document.getElementById('pto-hours-display').textContent) || 0;
        const personalHeader = parseFloat(document.getElementById('personal-time-display').textContent) || 0;
        const ptoSummary = parseFloat(document.getElementById('pto-time').textContent) || 0;
        const personalSummary = parseFloat(document.getElementById('total-personal-time-display').textContent) || 0;

        return ptoSummary <= ptoHeader && personalSummary <= personalHeader;
    }

    const ptoTimeInput = document.getElementById('pto-time');
    const ptoHoursDisplay = document.getElementById('pto-hours-display');


    function validatePtoHours(totalHoursWorked, ptoTime, personalTime) {
        const remainingPTO = Math.max(0, availablePTOHours - ptoTime);
        const totalHoursWithPto = totalHoursWorked + ptoTime + personalTime;
        console.log('PTO used:', ptoTime);

        if (totalHoursWithPto > 40 && (ptoTime > 0 || personalTime > 0)) {
            elements.ptoValidationMessage.textContent = 'Total hours including PTO and Personal time cannot exceed 40 hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else if (ptoTime > availablePTOHours) {
            elements.ptoValidationMessage.textContent = 'PTO time used cannot exceed available PTO hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else if (personalTime > availablePersonalHours) {
            elements.ptoValidationMessage.textContent = 'Personal time used cannot exceed available Personal hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else {
            elements.ptoValidationMessage.textContent = '';
        }
    }

    function updateTotalPtoAndHolidayHours() {
        let totalPtoHours = 0;
        let totalHolidayHours = 0;
        let totalPersonalHours = 0;
    
        const ptoInputs = document.querySelectorAll('input[name^="PTO_hours"]');
        ptoInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            totalPtoHours += value;
        });
    
        const holidayInputs = document.querySelectorAll('input[name^="Holiday_hours"]');
        holidayInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            totalHolidayHours += value;
        });
    
        const personalInputs = document.querySelectorAll('input[name^="Personal_hours"]');
        personalInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            totalPersonalHours += value;
        });
    
        console.log('Total PTO hours:', totalPtoHours); // Debugging log
        console.log('Total Holiday hours:', totalHolidayHours);
        console.log('Total Personal hours:', totalPersonalHours);
    
        // Ensure the textContent is correctly updated
        elements.ptoTimeSpan.textContent = totalPtoHours.toFixed(0);
        elements.holidayTimeSpan.textContent = totalHolidayHours.toFixed(0);
        elements.personalTimeSpan.textContent = totalPersonalHours.toFixed(0);
    
        elements.remainingPtoHoursElement.textContent = Math.max(0, availablePTOHours - totalPtoHours).toFixed(0);
        elements.remainingPersonalHoursElement.textContent = Math.max(0, availablePersonalHours - totalPersonalHours).toFixed(0);
        const totalTimeWithPto = totalPtoHours + totalHolidayHours + totalPersonalHours + parseFloat(elements.totalTimeWorkedSpan.textContent);
        elements.totalTimeWithPtoSpan.textContent = totalTimeWithPto.toFixed(2);
    }
    

    async function updatePtoHours() {
        console.log('Updating PTO hours...');
        const usedPtoHoursValue = parseFloat(elements.ptoTimeSpan.textContent) || 0;
        console.log('Total PTO hours:', usedPtoHoursValue);
    
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        console.log('Endpoint for update:', endpoint);
    
        try {
            // Step 1: Fetch the current value of PTO from Airtable
            const fetchResponse = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!fetchResponse.ok) throw new Error(`Failed to fetch current PTO hours: ${fetchResponse.statusText}`);
    
            const fetchData = await fetchResponse.json();
            console.log('Fetched data:', fetchData);
            
            // Fetch and parse the current PTO hours
            const currentPtoHours = parseFloat(fetchData.fields['PTO']) || 0; // Default to 0 if undefined
            console.log('Current PTO hours fetched from Airtable:', currentPtoHours);
    
            if (isNaN(currentPtoHours)) throw new Error(`Invalid PTO hours value retrieved from Airtable: ${fetchData.fields['PTO']}`);
    
            // Step 2: Add the used PTO hours value to the current PTO hours
            const newPtoHoursValue = currentPtoHours + usedPtoHoursValue;
            console.log('New PTO hours value to update:', newPtoHoursValue);
    
            // Step 3: Patch the updated total back to Airtable
            const updateResponse = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: { 'PTO': newPtoHoursValue } })  // Send the new total as a number
            });
    
            const updateResponseData = await updateResponse.json();
            console.log('Update response data:', updateResponseData);
    
            if (!updateResponse.ok) throw new Error(`Failed to update PTO hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
            console.log('PTO hours updated successfully');
        } catch (error) {
            console.error('Error updating PTO hours:', error);
            throw new Error('Failed to update PTO hours. Error: ' + error.message);
        }
    }
             

    async function updatePersonalHours() {
        console.log('Updating Personal hours...');
        const usedPersonalHoursValue = parseFloat(elements.personalTimeSpan.textContent) || 0;
        const newPersonalHoursValue = Math.max(0, availablePersonalHours - usedPersonalHoursValue);
        console.log('Used Personal hours value:', usedPersonalHoursValue);
        console.log('New Personal hours value:', newPersonalHoursValue);

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        console.log('Endpoint for update:', endpoint);

        try {
            const updateResponse = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: { 'Personaltime': newPersonalHoursValue } })
            });

            const updateResponseData = await updateResponse.json();
            console.log('Update response data:', updateResponseData);

            if (!updateResponse.ok) throw new Error(`Failed to update Personal hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
            console.log('Personal hours updated successfully');
        } catch (error) {
            console.error('Error updating Personal hours:', error);
            throw new Error('Failed to update Personal hours. Error: ' + error.message);
        }
    }
    function validateWholeNumbers() {
        let hasDecimal = false; // Flag to track if any field has a decimal
    
        // Check PTO input fields directly
        const ptoInputs = document.querySelectorAll('input[name^="PTO_hours"]');
        ptoInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            console.log('Validating PTO input value:', value); // Log the value
            if (value % 1 !== 0) {
                alert(`PTO hours must be a whole number. Current value: ${value}`);
                hasDecimal = true;
            }
        });
    
        // Check Personal input fields directly
        const personalInputs = document.querySelectorAll('input[name^="Personal_hours"]');
        personalInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            console.log('Validating Personal input value:', value); // Log the value
            if (value % 1 !== 0) {
                alert(`Personal hours must be a whole number. Current value: ${value}`);
                hasDecimal = true;
            }
        });
    
        // Check Holiday input fields directly
        const holidayInputs = document.querySelectorAll('input[name^="Holiday_hours"]');
        holidayInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            console.log('Validating Holiday input value:', value); // Log the value
            if (value % 1 !== 0) {
                alert(`Holiday hours must be a whole number. Current value: ${value}`);
                hasDecimal = true;
            }
        });
    
        return !hasDecimal; // If any decimal was found, return false to prevent submission
    }
    
   async function handleSubmit(event) {
    event.preventDefault(); // Prevent form submission by default

    // Check if the submit button is disabled (e.g., when timesheet is approved)
    if (elements.submitButton.disabled) {
        console.log('Form submission blocked: Timesheet is already approved');
        return;
    }

    if (isApproved) {
        alert('This timesheet is approved. You cannot make any changes.');
        return;  // Stop the form submission if the timesheet is approved
    }

    console.log('User clicked submit.');

    if (!validateWholeNumbers()) {
        console.log("Validation failed: Non-whole number in PTO, Personal, or Holiday hours.");
        return; // Stop the form submission if the validation fails
    }

    const totalPtoHours = parseFloat(elements.ptoTimeSpan.textContent) || 0;
    const totalPersonalHours = parseFloat(elements.personalTimeSpan.textContent) || 0;

    // Validate the whole numbers for PTO, Personal, and Holiday Hours
    if (!validateWholeNumbers()) {
        console.log("Validation failed: Non-whole number in PTO, Personal, or Holiday hours.");
        return; // Stop the form submission if the validation fails
    }

    // Validate that PTO and Personal hours don't exceed the available amount
    if (totalPtoHours > availablePTOHours) {
        alert('PTO time used cannot exceed available PTO hours');
        return; // Stop the form submission if PTO hours exceed available hours
    }

    if (totalPersonalHours > availablePersonalHours) {
        alert('Personal time used cannot exceed available Personal hours');
        return; // Stop the form submission if Personal hours exceed available hours
    }

    // If all validations pass, proceed with submitting the data
    try {
        await updatePtoHours();
        await updatePersonalHours();
        await sendDataToAirtable();
        showModal(); // Show the success modal after successful submission
        throwConfetti();

        convertToCsvButton.click();


        // Get the user email from localStorage and prevent page refresh if it's Luz
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail !== '') {
            // Refresh the page after a delay if the user is not Luz
            setTimeout(() => {
                window.location.reload();
            }, 6000); // Reduced delay for a better user experience
        } else {
            console.log('Page refresh prevented for Luz.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(`An error occurred: ${error.message}`);
    }
}

    function throwConfetti() {
        confetti({
            particleCount: 1400,
            spread: 180,
            origin: { y: 0.6 }
        });
    }
    
    let countdownInterval; // Declare countdownInterval in a higher scope to track the interval
    
    function showModal() {
        const modal = document.getElementById('successModal');
        const userEmail = localStorage.getItem('userEmail'); // Assuming user email is stored in localStorage
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
    
        // Display the modal
        modal.style.display = 'block';
    
        // Check if the user is luz.arceo@vanirinstalledsales.com
        if (userEmail === '') {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                // Update the modal content for Luz and add a custom close button
                modalContent.innerHTML = `
                    <h2>What snack do you want?</h2>
                    <select name="snacks" id="snack-dropdown">
                        <option value="chips">Chips</option>
                        <option value="chocolate">Chocolate</option>
                        <option value="popcorn">Popcorn</option>
                        <option value="pretzels">Pretzels</option>
                        <option value="cookies">Cookies</option>
                        <option value="nuts">Nuts</option>
                        <option value="fruit">Fruit</option>
                        <option value="granola-bar">Granola Bar</option>
                        <option value="jerky">Jerky</option>
                        <option value="candy">Candy</option>
                        <option value="other">Other</option>
                    </select>
                    <button id="heathCloseButton" class="close-button">Close</button>
                `;
    
                // Add an event listener for when the user chooses an option
                const snackDropdown = document.getElementById('snack-dropdown');
                if (snackDropdown) {
                    snackDropdown.addEventListener('change', () => {
                        if (snackDropdown.value === 'other') {
                            // Replace dropdown with a text input box
                            snackDropdown.outerHTML = `<input type="text" id="snack-input" placeholder="Enter your snack" />`;
                            
                            // Attach event listener to new input for Shift key simulation
                            const snackInput = document.getElementById('snack-input');
                            snackInput.addEventListener('input', () => simulateShiftKeyPress());
                            console.log('Shift key simulated after entering custom snack.');
                        } else {
                            simulateShiftKeyPress();
                            console.log('Shift key simulated after selecting a snack option.');
                        }
                    });
                } else {
                    console.error('Snack dropdown not found.');
                }
            } else {
                console.error('Modal content element not found');
            }
    
            // Prevent form submission (and thus refresh) for Luz by stopping form’s default action if any submit action is present.
            document.addEventListener('submit', (event) => {
                event.preventDefault();
                console.log('Form submission prevented to avoid refresh for Luz.');
            });
    
            // Automatically close the modal after 13 seconds
            setTimeout(() => {

    modal.style.display = 'none';
    console.log('Modal closed after 13 seconds for Luz.');

    // Simulate pressing the Shift key three times
    for (let i = 0; i < 3; i++) {
        simulateShiftKeyPress();
    }
}, 8000);

// Add functionality to manually close the modal with the close button
const heathCloseButton = document.getElementById('heathCloseButton');
if (heathCloseButton) {
    heathCloseButton.onclick = function() {
        modal.style.display = 'none';
        console.log('Modal manually closed by Luz.');

        // Simulate pressing the Shift key three times when manually closed
        for (let i = 0; i < 3; i++) {
            simulateShiftKeyPress();
        }
    };
} else {
    console.error('Close button not found.');
}

    
        // Check if the user is diana.smith@vanirinstalledsales.com
        } else if (userEmail === '') {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                // Update the modal content for Diana and add a custom close button
                modalContent.innerHTML = `
                    <h2>Diana's Special Message</h2>
                    <p>Welcome to the VIP Section!</p>
                    <button id="dianaCloseButton" class="close-button">Close</button>
                `;
            } else {
                console.error('Modal content element not found');
            }
    
            // Automatically close the modal after 3 seconds for Diana
            setTimeout(() => {
                modal.style.display = 'none';
                console.log('Modal closed after 3 seconds for Diana.');
    
                // Simulate pressing the Shift key three times
                for (let i = 0; i < 3; i++) {
                    simulateShiftKeyPress();
                }
            }, 9000); // 3000 milliseconds = 3 seconds
    
            // Add functionality to manually close the modal with the close button
            const dianaCloseButton = document.getElementById('dianaCloseButton');
            if (dianaCloseButton) {
                dianaCloseButton.onclick = function() {
                    modal.style.display = 'none';
                    console.log('Modal manually closed by Diana.');
    
                    // Simulate pressing the Shift key three times when manually closed
                    for (let i = 0; i < 3; i++) {
                        simulateShiftKeyPress();
                    }
                };
            } else {
                console.error('Diana-specific close button not found.');
            }
        }
    }
    
    // Function to simulate pressing the Shift key three times
    function simulateShiftKeyPress() {
        console.log('Simulating Shift key press');
        const event = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(event);
    }
    
    async function sendDataToAirtable() {
        const date7 = elements.timeEntryForm.elements['date7']?.value || '0';
        const totalPtoHours = calculateColumnSum('PTO_hours');
        const totalPersonalHours = calculateColumnSum('Personal_hours');
        const totalHolidayHours = calculateColumnSum('Holiday_hours');
        
        console.log('Preparing to send data to Airtable:', {
            date7,
            totalPtoHours,
            totalPersonalHours,
            totalHolidayHours,
            totalTimeWorked: elements.totalTimeWorkedSpan.textContent,
            totalTimeWithPto: elements.totalTimeWithPtoSpan.textContent
        });
    
        try {
            const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        "date7": date7 || '0',
                        "PTO Time Used": parseFloat(totalPtoHours) || 0,
                        "Personal Time Used": parseFloat(totalPersonalHours) || 0,
                        "Holiday Hours Used": parseFloat(totalHolidayHours) || 0,
                        "Total Hours Worked": parseFloat(elements.totalTimeWorkedSpan.textContent) || 0,
                        "Total Time with PTO": parseFloat(elements.totalTimeWithPtoSpan.textContent) || 0,
                    }
                })
            });
    
            if (!response.ok) {
                const errorDetails = await response.json();
                console.error('Error updating Airtable:', response.statusText, errorDetails);
                throw new Error(`Failed to update data in Airtable: ${response.statusText} - ${JSON.stringify(errorDetails)}`);
            }
    
            console.log('Data successfully updated in Airtable');
        } catch (error) {
            console.error('Error updating Airtable:', error);
            alert(`Failed to update data in Airtable. 
                Error Details:
                - Status: ${response.status}
                - Status Text: ${response.statusText}
                - Endpoint: ${endpoint}
                - Record ID: ${recordId}
                - API Key: ${apiKey ? 'Provided' : 'Not Provided'}
                
               `);
                        }
    }
    
    
    document.addEventListener("DOMContentLoaded", function() {
        const timeEntryWrapper = document.querySelector('.time-entry-table-wrapper');
    
        let isScrolling;
    
        timeEntryWrapper.addEventListener('scroll', function() {
            timeEntryWrapper.style.scrollbarWidth = 'auto';
            timeEntryWrapper.style.setProperty('--scrollbar-width', 'auto');
    
            window.clearTimeout(isScrolling);
    
            isScrolling = setTimeout(function() {
                timeEntryWrapper.style.scrollbarWidth = 'none';
                timeEntryWrapper.style.setProperty('--scrollbar-width', 'none');
            }, 1000);
        });
    });

    function formatNumber(element) {
        const value = parseInt(element.innerText, 10) || 0;
        element.innerText = value.toString();
    }
    
    function formatAllNumbers() {
        formatNumber(document.getElementById('pto-time'));
        formatNumber(document.getElementById('total-personal-time-display'));
        formatNumber(document.getElementById('Holiday-hours'));
    }
    
    formatAllNumbers();
    
    setInterval(formatAllNumbers, 1);

    function clearForm() {
        console.log('Clearing form...');
        elements.timeEntryForm.reset();
        elements.ptoTimeSpan.textContent = '0';
        elements.personalTimeSpan.textContent = '0';
        elements.holidayTimeSpan.textContent = '0';
        elements.totalTimeWorkedSpan.textContent = '0.00';
        elements.totalTimeWithPtoSpan.textContent = '0.00';
        elements.remainingPtoHoursElement.textContent = '0';
        elements.remainingPersonalHoursElement.textContent = '0';
        window.location.reload();
    }

    function resetForm(event) {
        event.preventDefault();
        console.log('Resetting form...');
        clearForm();
    }

    function calculateColumnSum(columnName) {
        const inputs = document.querySelectorAll(`input[name^="${columnName}"]`);
        let total = 0;
        inputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            total += value;
        });
        return total;
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function scrollToElement(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    timeInputs.forEach(input => {
        input.addEventListener('focus', () => scrollToElement(input));
    });


    function handleLogout(event) {
        event.preventDefault();
        console.log('Logging out...');
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('user');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
    }

    const convertToCsvButton = document.getElementById('convert-to-csv-button');

    convertToCsvButton.addEventListener('click', convertToCsv);

    function convertToCsv() {
        console.log('Converting to CSV...');
    
        const userEmail = localStorage.getItem('userEmail') || 'user';
        const date7Value = document.querySelector('[name="date7"]')?.value || 'date7';
        const formattedDate7 = new Date(date7Value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
        // Format the file name using email and date7
        const fileName = `${userEmail}_${formattedDate7}.csv`.replace(/[@.]/g, '_');
    
        const rows = [];
        const employeeEmailRow = [userEmail];
        rows.push(employeeEmailRow);
    
        const headerRow = ['Date', 'Start Time', 'Lunch Start', 'Lunch End', 'End Time', 'Additional Time In', 'Additional Time Out', 'Hours Worked', 'PTO Hours', 'Personal Hours', 'Holiday Hours'];
        rows.push(headerRow);
    
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const row = [];
    
            // Format each date as "Month Name DD, YYYY" and ensure it stays in one cell
            const dateValue = document.querySelector(`[name="${day}"]`)?.value;
            const formattedDate = dateValue
                ? `"${new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}"`
                : '';
            

    
            row.push(formattedDate);
            const timeFields = ['start_time', 'lunch_start', 'lunch_end', 'end_time', 'Additional_Time_In', 'Additional_Time_Out']
            .map(field => document.querySelector(`[name="${field}${index + 1}"]`)?.value || '');
                    row.push(...timeFields);
            row.push(document.getElementById(`hours-worked-today${index + 1}`)?.textContent || '');
            row.push(elements.timeEntryForm.elements[`PTO_hours${index + 1}`]?.value || '');
            row.push(elements.timeEntryForm.elements[`Personal_hours${index + 1}`]?.value || '');
            row.push(elements.timeEntryForm.elements[`Holiday_hours${index + 1}`]?.value || '');
            rows.push(row);
        });
    
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
    
        // Create a custom modal for confirmation
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "50%";
        modal.style.left = "50%";
        modal.style.transform = "translate(-50%, -50%)";
        modal.style.padding = "20px";
        modal.style.backgroundColor = "black";
        modal.style.border = "1px solid #ccc";
        modal.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
        modal.style.zIndex = "1000";
    
        const message = document.createElement("p");
        message.innerText = "Do you want to download your time sheet?";
        modal.appendChild(message);
    
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "space-between";
        buttonContainer.style.marginTop = "20px";
    
        const yesButton = document.createElement("button");
        yesButton.innerText = "Yes";
        yesButton.style.padding = "10px 20px";
        yesButton.style.border = "none";
        yesButton.style.backgroundColor = "#4CAF50";
        yesButton.style.color = "white";
        yesButton.style.cursor = "pointer";
        yesButton.onclick = () => {
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri); // Use encodedUri from outer scope
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            document.body.removeChild(modal);
        };
    
        const noButton = document.createElement("button");
        noButton.innerText = "No";
        noButton.style.padding = "10px 20px";
        noButton.style.border = "none";
        noButton.style.backgroundColor = "#f44336";
        noButton.style.color = "white";
        noButton.style.cursor = "pointer";
        noButton.onclick = () => {
            console.log("User canceled the download.");
            document.body.removeChild(modal);
        };
    
        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);
    
        modal.appendChild(buttonContainer);
        document.body.appendChild(modal);
    }
    
    initializeForm();
    initializeTimeDropdowns();

    function handleArrowKeys(event) {
        const key = event.key;
        const currentInput = event.target;
        const inputs = Array.from(document.querySelectorAll('select.time-dropdown'));

        let index = inputs.indexOf(currentInput);

        if (key === 'ArrowRight') {
            index = (index + 1) % inputs.length;
        } else if (key === 'ArrowLeft') {
            index = (index - 1 + inputs.length) % inputs.length;
        } else if (key === 'ArrowDown') {
            index = (index + 6) % inputs.length;
        } else if (key === 'ArrowUp') {
            index = (index - 6 + inputs.length) % inputs.length;
        }
        inputs[index].focus();
    }

    function showPickerOnFocus() {
        const timeInputs = document.querySelectorAll('select.time-dropdown, input[type="number"]');
        timeInputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (input.showPicker) input.showPicker();
            });
        });
    }

    showPickerOnFocus();
    

    function saveFormData() {
        // Prevent saving form data if the timesheet is approved
        if (isApproved) {
            console.log('Form data saving is disabled because the timesheet is approved.');
            return;  // Exit the function and prevent saving
        }
    
        const formData = new FormData(elements.timeEntryForm);
        const data = {};
    
        // Save the form inputs to the data object
        formData.forEach((value, key) => {
            data[key] = value;
        });
    
        // Save number inputs
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            data[input.name] = input.value;
        });
    
        // Save date inputs
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            data[input.name] = input.value;
        });
    
        // Save time inputs
        const timeInputs = document.querySelectorAll('input[type="time"]');
        timeInputs.forEach(input => {
            data[input.name] = input.value;
        });
    
        // Save the data to localStorage
        localStorage.setItem('formData', JSON.stringify(data));
        console.log('Form data saved:', data);
    }
    
    function loadFormData() {
        const data = JSON.parse(localStorage.getItem('formData'));
        if (data) {
            Object.keys(data).forEach(key => {
                const input = elements.timeEntryForm.elements[key];
                if (input) {
                    input.value = data[key];
                }
            });

            // Load number inputs
            const numberInputs = document.querySelectorAll('input[type="number"]');
            numberInputs.forEach(input => {
                if (data[input.name]) {
                    input.value = data[input.name];
                }
            });

            // Load date inputs
            const dateInputs = document.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => {
                if (data[input.name]) {
                    input.value = data[input.name];
                }
            });

            // Load time inputs
            const timeInputs = document.querySelectorAll('input[type="time"]');
            timeInputs.forEach(input => {
                if (data[input.name]) {
                    input.value = data[input.name];
                }
            });

            calculateTotalTimeWorked();
        }
    }

    loadFormData(); // Load form data on page load
});

function toggleWorkInputs(dayIndex, isChecked) {
    const row = document.querySelector(`tr[data-day="${dayIndex + 1}"]`);
    const timeInputs = row.querySelectorAll('input[type="time"]');
    const numberInputs = row.querySelectorAll('input[type="number"]');
    
    if (isChecked) {
        timeInputs.forEach(input => {
            input.disabled = true;
            input.value = '';
        });
        numberInputs.forEach(input => {
            input.disabled = true;
            input.value = '';
        });
    } else {
        timeInputs.forEach(input => {
            input.disabled = false;
        });
        numberInputs.forEach(input => {
            input.disabled = false;
        });
    }
    calculateTotalTimeWorked();
   
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed. Initializing time dropdowns...");
    initializeTimeDropdowns();

    // Get the logged-in user email
    const userEmail = document.getElementById('user-email').textContent.trim();
    console.log("User Email:", userEmail);
    let popupTimeout = null;
    let popupsEnabled = true;
    

    if (userEmail === 'katie.pipp5in@vanirinstalledsales.com') {
        console.log('👀 Prank mode: Ads activated for Heath');
    
        const adMessages = [
            "🛠️ DEWALT XR Drill Combo Kit – now $129 at Home Depot!",
            "📦 Milwaukee M18 Batteries – Buy 1, Get 1 Free at Lowe’s!",
            "👷 Carhartt Work Jackets: 25% off at Tractor Supply Co.",
            "🧰 Klein Tools Backpack – trusted by pros, now on sale at Grainger.",
            "📱 Track your job sites with the Procore mobile app – free trial!",
            "🚚 Free delivery on orders $50+ at Acme Tools – this week only!",
            "🔒 3M Safety Gear bundle: Get a free hard hat with goggles at Fastenal.",
            "💳 Now offering 0% financing on Bosch Power Tools – via Northern Tool.",
            "🧼 GOJO Industrial Hand Cleaner – 2 for $10 at Menards!",
            "👕 Dickies Work Shirts – new drop at Academy Sports + Outdoors.",
            "🚧 RIDGID Jobsite Radios with Bluetooth – $30 off at Lowe’s!",
            "💡 Snap-on LED Work Lights – perfect for night installs, $19.99!",
            "📏 Bosch GLM Laser Measure – $20 off at Amazon!",
            "🪚 Makita Circular Saw Clearance – up to 40% off at Toolbarn!",
            "🧤 Mechanix Wear Gloves – Pro Pack special at Home Depot!",
        ];
        
        
        const adBackgrounds = [
            "#004080", "#e63946", "#1d3557", "#2a9d8f", "#f4a261",
            "#6a4c93", "#ffbe0b", "#3a86ff", "#a8dadc", "#264653",
            "#f72585", "#7209b7", "#ff006e", "#fb5607", "#ffb703",
        ];
        
        // Determine readable text color
        function getContrastingTextColor(bgColor) {
            const hex = bgColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        }
        function addClearAdsButton() {
            const button = document.createElement('button');
            button.textContent = "🧹 Clear All Ads";
            button.style.position = "fixed";
button.style.top = "50%";
button.style.left = "50%";
button.style.transform = "translate(-50%, -50%)";
button.style.padding = "14px 22px";
button.style.fontSize = "18px";
button.style.backgroundColor = "#d62828";
button.style.color = "white";
button.style.border = "none";
button.style.borderRadius = "8px";
button.style.cursor = "pointer";
button.style.zIndex = "10002";
button.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";

        
button.addEventListener('click', () => {
    popupsEnabled = false;
    clearTimeout(popupTimeout);

    // Remove standalone popup ads
    document.querySelectorAll('.popup-ad').forEach(p => p.remove());

    // Remove stacked side ads
    document.querySelectorAll('.stacked-ad').forEach(ad => ad.remove());

    // Remove columns
    document.querySelectorAll('div[style*="height: 100vh"]').forEach(col => col.remove());

    button.remove(); // Optionally remove the button itself
});

        
            document.body.appendChild(button);
        }
        
        
        function showPopupAd() {
            if (!popupsEnabled) return; // 🔒 Prevent ads if cleared

            const popup = document.createElement('div');
            const index = Math.floor(Math.random() * adMessages.length);
            const message = adMessages[index];
            const bg = adBackgrounds[index];
            const textColor = getContrastingTextColor(bg);
            popup.classList.add('popup-ad');

            popup.style.position = 'fixed';
            popup.style.width = '280px';
            popup.style.minHeight = '120px';
            popup.style.backgroundColor = bg;
            popup.style.color = textColor;
            popup.style.top = `${Math.random() * (window.innerHeight - 150)}px`;
            popup.style.left = `${Math.random() * (window.innerWidth - 300)}px`;
            popup.style.zIndex = '10001';
            popup.style.padding = '15px 20px';
            popup.style.borderRadius = '8px';
            popup.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)';
            popup.style.fontSize = '14px';
            popup.style.opacity = '1';
            popup.style.transition = 'opacity 0.3s ease-in-out';
            popup.classList.add('popup-ad'); // mark for easy clearing later
            popup.innerHTML = `
                <div class="popup-close" style="position: absolute; top: 6px; right: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">❌</div>
                <strong style="color:${textColor}">Sponsored</strong><br><br>${message}
            `;
        
            document.body.appendChild(popup);
        
            // 🔧 Attach close handler AFTER appending to DOM
            const closeBtn = popup.querySelector('.popup-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => popup.remove());
            }
        }
        
        
        // Recursive timeout to show new popup every 8–15 seconds
        function scheduleNextPopup() {
            if (!popupsEnabled) return;
            showPopupAd();
            const nextDelay = Math.random() * 3000 + 2000;
            popupTimeout = setTimeout(scheduleNextPopup, nextDelay);
        }
        
        
        scheduleNextPopup();
        
        
        
        function createAdColumn(position) {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style[position] = '0';
            container.style.width = '180px';
            container.style.height = '100vh';
            container.style.overflowY = 'auto';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
        
            const adCount = Math.floor(window.innerHeight / 120);
            for (let i = 0; i < adCount; i++) {
                const ad = document.createElement('div');
                const msgIndex = i % adMessages.length;
                const bg = adBackgrounds[msgIndex];
                const textColor = getContrastingTextColor(bg);
        
                ad.classList.add('stacked-ad');
                ad.style.flex = '0 0 120px';
                ad.style.backgroundColor = bg;
                ad.style.color = textColor;
                ad.style.fontSize = '14px';
                ad.style.padding = '10px';
                ad.style.position = 'relative';
                ad.style.textAlign = 'left';
                ad.style.transition = 'opacity 0.3s ease-in-out';
                ad.style.opacity = '1';
                ad.innerHTML = `
                    <div style="position: absolute; top: 4px; right: 6px; cursor: pointer; font-weight: bold;" class="close-ad">❌</div>
                    <strong style="color:${textColor}">Sponsored</strong><br><br>
                    ${adMessages[msgIndex]}
                `;
        
                // Close functionality
                ad.querySelector('.close-ad').addEventListener('click', () => {
                    ad.remove();
                });
        
           
        
                // Message rotation
                setInterval(() => {
                    const newIndex = Math.floor(Math.random() * adMessages.length);
                    const newBg = adBackgrounds[newIndex];
                    const newTextColor = getContrastingTextColor(newBg);
                    ad.style.backgroundColor = newBg;
                    ad.style.color = newTextColor;
                    ad.innerHTML = `
                        <div style="position: absolute; top: 4px; right: 6px; cursor: pointer; font-weight: bold;" class="close-ad">❌</div>
                        <strong style="color:${newTextColor}">Sponsored</strong><br><br>
                        ${adMessages[newIndex]}
                    `;
                    ad.querySelector('.close-ad').addEventListener('click', () => ad.remove());
                }, 6000 + i * 300);
        
                container.appendChild(ad);
            }
        
            document.body.appendChild(container);
        }
        
        createAdColumn('left');
        createAdColumn('right');
        addClearAdsButton();

        
        
    }

});