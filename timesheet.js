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
                availablePTOHours = parseFloat(record['PTO Total']) || 0;
                recordId = data.records[0].id;
                elements.ptoHoursDisplay.textContent = availablePTOHours.toFixed(2);
                elements.remainingPtoHoursElement.textContent = availablePTOHours.toFixed(2);
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
                availablePersonalHours = parseFloat(record['Personaltime']) || 0;
                recordId = data.records[0].id;
                elements.personalTimeDisplay.textContent = availablePersonalHours.toFixed(2);
                elements.remainingPersonalHoursElement.textContent = availablePersonalHours.toFixed(2);
                console.log('Available Personal hours:', availablePersonalHours);
            } else {
                console.log('No Personal hours data found for user');
            }

            updateLoadingBar('Personal hours have been downloaded.');
        } catch (error) {
        }
    }

    // Fetch Personal End Date
    async function fetchPersonalEndDate() {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch Personal END Date: ${response.statusText}`);
            const data = await response.json();
            if (data.records.length > 0) {
                const personalEndDate = data.records[0].fields['Personal END Date'];
                startCountdown(personalEndDate);
            } else {
                console.log('No Personal END Date found for user');
            }

            updateLoadingBar('Previous entries have been downloaded.');
        } catch (error) {
            console.error('Error fetching Personal END Date:', error);
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
        
        // Get the next Tuesday based on the selected date in New York timezone
        const nextTuesday = getNextTuesday(selectedDate); 
        elements.weekEndingInput.value = nextTuesday.toISOString().split('T')[0];
        console.log('Adjusted week-ending date:', nextTuesday);
    
        // Set date7 (which is 6 days after nextTuesday)
        const date7 = new Date(nextTuesday);
        date7.setDate(nextTuesday.getDate() + 6);
        elements.timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];
    
        // Populate other week dates based on next Tuesday
        populateWeekDates(nextTuesday);
        
        // Save form data
        saveFormData();
    }
    
    // Get next Tuesday based on the New York timezone
    function getNextTuesday(referenceDate = new Date()) {
        // Create a new Date object for the New York timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',  // Ensure two digits for month
            day: '2-digit',    // Ensure two digits for day
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Format the reference date to match New York's date
        const formattedDate = formatter.formatToParts(referenceDate);
        const year = formattedDate.find(part => part.type === 'year').value;
        const month = formattedDate.find(part => part.type === 'month').value;
        const day = formattedDate.find(part => part.type === 'day').value;
        
        // Create a Date object from the formatted New York date
        const newYorkDate = new Date(`${year}-${month}-${day}`);
    
        // Get the day of the week (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
        const dayOfWeek = newYorkDate.getDay();
    
        // Calculate the number of days until the next Tuesday
        let daysUntilTuesday;
        if (dayOfWeek === 1) { // If today is Tuesday, return today
            return newYorkDate;
        } else if (dayOfWeek < 2) {
            daysUntilTuesday = 1 - dayOfWeek;
        } else {
            daysUntilTuesday = 7 - (dayOfWeek - 2);
        }
    
        // Create a new date object for the next Tuesday
        const nextTuesday = new Date(newYorkDate);
        nextTuesday.setDate(newYorkDate.getDate() + daysUntilTuesday);
    
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
    holidays["January 2nd"] = new Date(year, 0, 1); // January 2nd
    holidays["July 4th"] = new Date(year, 6, 4); // July 4th
    holidays["July 5th"] = new Date(year, 6, 5); // July 5th
    holidays["Labor Day"] = getLaborDay(year); // First Monday of September
    holidays["Thanksgiving"] = getThanksgiving(year); // Fourth Thursday of November
    holidays["Black Friday"] = getBlackFriday(year); // Day after Thanksgiving
    holidays["Christmas Day"] = new Date(year, 11, 24); // December 25th
    holidays["December 26th"] = new Date(year, 11, 25); // December 26th
    holidays["Good Friday"] = getGoodFriday(year); // Good Friday date calculation
    holidays["Easter"] = getEaster(year); // Easter date calculation

    
    return holidays;
}

// Helper functions to calculate holidays, moved back one day
// Helper functions to calculate holidays, moved back one day
function getLaborDay(year) {
    const firstDayOfSeptember = new Date(year, 8, 1);
    const dayOfWeek = firstDayOfSeptember.getDay();
    const laborDay = new Date(year, 8, 0 + (dayOfWeek === 0 ? 1 : (8 - dayOfWeek))); // First Monday in September
    return laborDay;
}

function getThanksgiving(year) {
    const firstDayOfNovember = new Date(year, 10, 1);
    const dayOfWeek = firstDayOfNovember.getDay();
    const thanksgiving = new Date(year, 10, 1 + (dayOfWeek === 4 ? 21 : 28 + (3 - dayOfWeek))); // Fourth Thursday in November
    return thanksgiving;
}

function getBlackFriday(year) {
    const thanksgiving = getThanksgiving(year);
    const blackFriday = new Date(thanksgiving);
    blackFriday.setDate(blackFriday.getDate() + 1); // Black Friday is still the day after Thanksgiving
    return blackFriday;
}

// Helper functions to calculate holidays, moved back one day
function getLaborDay(year) {
    const firstDayOfSeptember = new Date(year, 8, 1);
    const dayOfWeek = firstDayOfSeptember.getDay();
    const laborDay = new Date(year, 8, 1 + (dayOfWeek === 0 ? 1 : (8 - dayOfWeek))); // First Monday in September
    laborDay.setDate(laborDay.getDate() - 1); // Move back one day
    return laborDay;
}

function getThanksgiving(year) {
    const firstDayOfNovember = new Date(year, 10, 1);
    const dayOfWeek = firstDayOfNovember.getDay();
    const thanksgiving = new Date(year, 10, 1 + (dayOfWeek === 4 ? 21 : 28 + (4 - dayOfWeek))); // Fourth Thursday in November
    thanksgiving.setDate(thanksgiving.getDate() - 1); // Move back one day
    return thanksgiving;
}

function getBlackFriday(year) {
    const thanksgiving = getThanksgiving(year);
    const blackFriday = new Date(thanksgiving);
    blackFriday.setDate(blackFriday.getDate() + 1); // Black Friday is still the day after Thanksgiving
    return blackFriday;
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
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = 1 + (h + l - 7 * m + 114) % 31;

    const easter = new Date(year, month - 1, day);
    easter.setDate(easter.getDate() - 1); // Move back one day
    return easter;
}


function getGoodFriday(year) {
    const easter = getEaster(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2); // Good Friday is still two days before Easter, but Easter is already moved back a day
    return goodFriday;
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
    // Set the target date and time to December 31, 2024, at midnight (00:00:00)
    const targetDate = new Date('2024-12-31T00:00:00');
    const endDateTime = targetDate.getTime(); // Get the timestamp for the target date
    const countdownElement = document.getElementById('countdown');

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endDateTime - now;

        if (distance < 0) {
            countdownElement.innerHTML = "EXPIRED";
            return; // Stop if the countdown is over
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Calculate the exact remaining milliseconds until the next full second
        const nextUpdateInMs = 1000 - (now % 1000);

        // Schedule the next update accurately for the next full second
        setTimeout(updateCountdown, nextUpdateInMs);
    }

    // Start the countdown immediately
    updateCountdown();
}

// Call the function to start the countdown
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
        
        // Calculate daily hours worked without rounding
        let hoursWorked = calculateDailyHoursWorked(dateInput, ...timeFields);
        
        totalHoursWorked += hoursWorked; // Add daily hours to total, no rounding for daily hours
        hoursWorkedSpan.textContent = hoursWorked.toFixed(2); // Display unrounded hours worked for the day
    });
    
    // Round the total weekly hours to the nearest quarter hour
    const roundedTotalHoursWorked = roundToNearestQuarterHour(totalHoursWorked);
    
    const ptoTime = roundToNearestQuarterHour(parseFloat(elements.ptoTimeSpan.textContent) || 0);
    const personalTime = roundToNearestQuarterHour(parseFloat(elements.personalTimeSpan.textContent) || 0);
    const holidayHours = roundToNearestQuarterHour(parseFloat(elements.holidayTimeSpan.textContent) || 0);
    
    const totalHoursWithPto = roundToNearestQuarterHour(roundedTotalHoursWorked + ptoTime + personalTime + holidayHours);
    
    // Update the total weekly hours and total with PTO in the UI
    elements.totalTimeWorkedSpan.textContent = roundedTotalHoursWorked.toFixed(2);
    elements.totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);
    
    console.log('Total hours worked (rounded):', roundedTotalHoursWorked);
    console.log('Total hours with PTO (rounded):', totalHoursWithPto);
    
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
    

    function roundToClosestQuarterHour(hours) {
        return Math.round(hours * 4) / 4;
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
        elements.ptoTimeSpan.textContent = totalPtoHours.toFixed(2);
        elements.holidayTimeSpan.textContent = totalHolidayHours.toFixed(2);
        elements.personalTimeSpan.textContent = totalPersonalHours.toFixed(2);
    
        elements.remainingPtoHoursElement.textContent = Math.max(0, availablePTOHours - totalPtoHours).toFixed(2);
        elements.remainingPersonalHoursElement.textContent = Math.max(0, availablePersonalHours - totalPersonalHours).toFixed(2);
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
    
            // Refresh the page after a delay
            setTimeout(() => {
                window.location.reload();
            }, 30000); // Reduce delay to 3 seconds for better user experience
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
    
        // Check if the user is heath.kornegay@vanirinstalledsales.com
        if (userEmail === 'heath.kornegay@vanirinstalledsales.com') {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                // Update the modal content for Heath and add a custom close button
                modalContent.innerHTML = `
                    <h2>A HK Production</h2>
                    <p>By Jason Smith</p>
                    <button id="heathCloseButton" class="close-button">Close</button>
                `;
            } else {
                console.error('Modal content element not found');
            }
    
            // Automatically close the modal after 3 seconds for Heath
            setTimeout(() => {
                modal.style.display = 'none';
                console.log('Modal closed after 3 seconds for Heath.');
    
                // Simulate pressing the Shift key three times
                for (let i = 0; i < 3; i++) {
                    simulateShiftKeyPress();
                }
            }, 3000); // 3000 milliseconds = 3 seconds
    
            // Add functionality to manually close the modal with the close button
            const heathCloseButton = document.getElementById('heathCloseButton');
            if (heathCloseButton) {
                heathCloseButton.onclick = function() {
                    modal.style.display = 'none';
                    console.log('Modal manually closed by Heath.');
    
                    // Simulate pressing the Shift key three times when manually closed
                    for (let i = 0; i < 3; i++) {
                        simulateShiftKeyPress();
                    }
                };
            } else {
                console.error('Heath-specific close button not found.');
            }
        }
    
        // Add event listener for the default close button if it's present
        const closeButton = modal.querySelector('.close-button');
        if (closeButton) {
            closeButton.onclick = function() {
                modal.style.display = 'none';
            };
        } else {
            console.error('Default close button not found.');
        }
    
        // Close the modal when the user clicks anywhere outside of it
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    // Function to simulate pressing the Shift key
    function simulateShiftKeyPress() {
        const event = new KeyboardEvent('keydown', {
            key: 'Shift',
            code: 'ShiftLeft',
            keyCode: 16, // Shift key
            which: 16,   // Shift key
            bubbles: true
        });
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
        elements.remainingPtoHoursElement.textContent = '0.00';
        elements.remainingPersonalHoursElement.textContent = '0.00';
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

        const rows = [];
        const employeeEmailRow = [userEmail];
        rows.push(employeeEmailRow);

        const headerRow = ['Date', 'Start Time', 'Lunch Start', 'Lunch End', 'End Time', 'Additional Time In', 'Additional Time Out', 'Hours Worked', 'PTO Hours', 'Personal Hours', 'Holiday Hours'];
        rows.push(headerRow);

        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const row = [];
            row.push(elements.timeEntryForm.elements[day].value);
            const timeFields = ['start_time', 'lunch_start', 'lunch_end', 'end_time', 'Additional_Time_In', 'Additional_Time_Out'].map(field => elements.timeEntryForm.elements[`${field}${index + 1}`].value);
            row.push(...timeFields);
            row.push(document.getElementById(`hours-worked-today${index + 1}`).textContent);
            row.push(elements.timeEntryForm.elements[`PTO_hours${index + 1}`]?.value || '');
            row.push(elements.timeEntryForm.elements[`Personal_hours${index + 1}`]?.value || '');
            row.push(elements.timeEntryForm.elements[`Holiday_hours${index + 1}`]?.value || '');
            rows.push(row);
        });

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "time_entries.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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