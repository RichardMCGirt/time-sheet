document.addEventListener("DOMContentLoaded", async function() {
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
    const baseId = 'appMq9W12jZyCJeXe'; // Extracted base ID
    const tableId = 'tblhTl5q7sEFDv66Z'; // Extracted table ID
    let userEmail = localStorage.getItem('userEmail') || ''; // Fetch userEmail from localStorage

    // DOM elements
    const ptoHoursElement = document.getElementById('pto-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const timeEntryForm = document.getElementById('time-entry-form');
    const ptoTimeInput = document.getElementById('pto-time');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const totalTimeWithPtoSpan = document.getElementById('total-time-with-pto-value');
    const ptoValidationMessage = document.getElementById('pto-validation-message');
    const remainingPtoHoursElement = document.getElementById('remaining-pto-hours');
    const logoutButton = document.getElementById('logout-button');
    const userEmailElement = document.getElementById('user-email');
    const ptoHoursDisplay = document.getElementById('pto-hours-display'); // New div for displaying PTO hours

    let availablePTOHours = 0;
    let debounceTimer;

    // Set initial value to empty string
    ptoHoursDisplay.textContent = 'Loading...';

    // Display user email next to logout button
    if (userEmail) {
        userEmailElement.textContent = `(${userEmail})`;
    } else {
        window.location.href = 'index.html'; // Redirect to login page if no user email found
    }

    // Function to hide the PTO hours display
    function hidePtoHoursDisplay() {
        ptoHoursDisplay.style.display = 'none';
    }

    // Add event listener to PTO time input field
    ptoTimeInput.addEventListener('input', hidePtoHoursDisplay);

    // Fetch and display PTO hours
    await fetchPtoHours();

    // Event listeners
    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });
    ptoTimeInput.addEventListener('input', handlePtoTimeChange);
    logoutButton.addEventListener('click', handleLogout);

    async function fetchPtoHours() {
        console.log('Fetching PTO hours...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Data fetched from Airtable:', data);

            if (data.records.length > 0) {
                const userRecord = data.records[0].fields;
                const ptoHours = parseFloat(userRecord['PTO Hours']) || 0;
                availablePTOHours = ptoHours; // Only using PTO Hours field

                // Display PTO hours in HTML
                ptoHoursElement.textContent = ptoHours.toFixed(2);
                remainingPtoHoursElement.textContent = ptoHours.toFixed(2);
                ptoHoursDisplay.textContent = `Available PTO Hours: ${ptoHours.toFixed(2)}`;

                console.log('PTO Hours:', ptoHours);
            } else {
                throw new Error('No PTO record found for user');
            }
        } catch (error) {
            console.error('Error fetching remaining PTO:', error);
            ptoHoursElement.textContent = 'Error fetching PTO';
            remainingPtoHoursElement.textContent = 'Error';
            ptoHoursDisplay.textContent = 'Error';
        }
    }

    function handlePtoTimeChange() {
        console.log('Handling PTO time change...');
        const ptoTimeUsed = parseFloat(ptoTimeInput.value) || 0;
        const remainingPtoHours = Math.max(0, availablePTOHours - ptoTimeUsed);

        if (ptoTimeUsed > availablePTOHours) {
            ptoValidationMessage.textContent = 'PTO time used cannot exceed available PTO hours';
            ptoValidationMessage.style.color = 'red';
        } else {
            ptoValidationMessage.textContent = '';
        }

        remainingPtoHoursElement.textContent = remainingPtoHours.toFixed(2);
        updatePtoHoursDisplay(availablePTOHours - ptoTimeUsed);
        calculateTotalTimeWorked();
    }

    function updatePtoHoursDisplay(remainingHours) {
        console.log('Updating PTO hours display...');
        ptoHoursDisplay.textContent = `PTO Hours: ${remainingHours.toFixed(2)}`;
    }

    async function handleWeekEndingChange() {
        console.log('Handling week ending change...');
        const selectedDate = new Date(weekEndingInput.value);

        // Check if the selected date is a Wednesday
        if (selectedDate.getDay() !== 3) {
           
            weekEndingInput.value = ''; // Reset the input field
            return;
        }

        weekEndingInput.value = selectedDate.toISOString().split('T')[0];

        const date7 = new Date(selectedDate);
        date7.setDate(selectedDate.getDate() + 6);
        timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];

        populateWeekDates(selectedDate);
    }

    function populateWeekDates(weekEndingDate) {
        console.log('Populating week dates...');
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(weekEndingDate.getDate() - (6 - index));
            const inputField = timeEntryForm.elements[day];
            inputField.value = currentDate.toISOString().split('T')[0];

            // Apply or remove disabled class based on isEnabled function
            if (!isEnabled(currentDate)) {
                inputField.classList.add('disabled-date');
                inputField.setAttribute('readonly', true);
            } else {
                inputField.classList.remove('disabled-date');
                inputField.removeAttribute('readonly');
            }

            // Add 'Did not work' checkbox if not already present
            const checkboxId = `did-not-work-${index + 1}`;
            let checkbox = document.getElementById(checkboxId);
            if (!checkbox) {
                checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = checkboxId;
                checkbox.name = `did_not_work${index + 1}`;
                checkbox.addEventListener('change', (event) => {
                    toggleWorkInputs(index, event.target.checked);
                });

                const cell = document.createElement('td');
                cell.appendChild(checkbox);
                inputField.parentElement.parentElement.appendChild(cell);
            }
        });
    }

    // Function to check if a date should be enabled in form
    function isEnabled(date) {
        return date.getDay() !== 0 && date.getDay() !== 6; // Enable all weekdays
    }

    // Function to toggle work inputs based on 'Did not work' checkbox
    window.toggleWorkInputs = function(index, didNotWork) {
        console.log('Toggling work inputs...');
        const startTimeInput = timeEntryForm.elements[`start_time${index + 1}`];
        const lunchStartInput = timeEntryForm.elements[`lunch_start${index + 1}`];
        const lunchEndInput = timeEntryForm.elements[`lunch_end${index + 1}`];
        const endTimeInput = timeEntryForm.elements[`end_time${index + 1}`];
        const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);

        // Store original values if 'Did not work' is checked for the first time
        if (didNotWork && !startTimeInput.dataset.originalValue) {
            startTimeInput.dataset.originalValue = startTimeInput.value;
            lunchStartInput.dataset.originalValue = lunchStartInput.value;
            lunchEndInput.dataset.originalValue = lunchEndInput.value;
            endTimeInput.dataset.originalValue = endTimeInput.value;
        }

        startTimeInput.disabled = didNotWork;
        lunchStartInput.disabled = didNotWork;
        lunchEndInput.disabled = didNotWork;
        endTimeInput.disabled = didNotWork;

        if (didNotWork) {
            startTimeInput.value = '00:00';
            lunchStartInput.value = '00:00';
            lunchEndInput.value = '00:00';
            endTimeInput.value = '00:00';
            hoursWorkedSpan.textContent = '0.00';
        } else {
            // Restore original values when 'Did not work' is unchecked
            startTimeInput.value = startTimeInput.dataset.originalValue || '';
            lunchStartInput.value = lunchStartInput.dataset.originalValue || '';
            lunchEndInput.value = lunchEndInput.dataset.originalValue || '';
            endTimeInput.value = endTimeInput.dataset.originalValue || '';

            // Clear stored original values
            delete startTimeInput.dataset.originalValue;
            delete lunchStartInput.dataset.originalValue;
            delete lunchEndInput.dataset.originalValue;
            delete endTimeInput.dataset.originalValue;

            // Recalculate total time worked after restoring values
            calculateTotalTimeWorked();
        }
    }

    function calculateTotalTimeWorked() {
        console.log('Calculating total time worked...');
        let totalHoursWorked = 0;
        let totalHoursWithPto = 0;

        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];

        daysOfWeek.forEach((day, index) => {
            const dateInput = timeEntryForm.elements[day];
            const startTimeInput = timeEntryForm.elements[`start_time${index + 1}`];
            const lunchStartInput = timeEntryForm.elements[`lunch_start${index + 1}`];
            const lunchEndInput = timeEntryForm.elements[`lunch_end${index + 1}`];
            const endTimeInput = timeEntryForm.elements[`end_time${index + 1}`];
            const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);

            const startDate = new Date(dateInput.value);
            const startTime = parseTime(startTimeInput.value);
            const lunchStart = parseTime(lunchStartInput.value);
            const lunchEnd = parseTime(lunchEndInput.value);
            const endTime = parseTime(endTimeInput.value);

            let hoursWorked = calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime);
            hoursWorked = hoursWorked.toFixed(2); // Round to 2 decimal places
            totalHoursWorked += parseFloat(hoursWorked);
            hoursWorkedSpan.textContent = hoursWorked;

            // Calculate total hours with PTO
            const ptoTime = parseFloat(ptoTimeInput.value) || 0;
            totalHoursWithPto = totalHoursWorked + ptoTime;
        });

        // Update total time worked spans
        totalTimeWorkedSpan.textContent = totalHoursWorked.toFixed(2);
        totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);

        // Validate PTO hours
        validatePtoHours(totalHoursWithPto);
    }

    function parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return { hours, minutes };
    }

    function calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime) {
        console.log('Calculating hours worked...');
        const startDateTime = new Date(startDate);
        startDateTime.setHours(startTime.hours, startTime.minutes);

        const lunchStartDateTime = new Date(startDate);
        lunchStartDateTime.setHours(lunchStart.hours, lunchStart.minutes);

        const lunchEndDateTime = new Date(startDate);
        lunchEndDateTime.setHours(lunchEnd.hours, lunchEnd.minutes);

        const endDateTime = new Date(startDate);
        endDateTime.setHours(endTime.hours, endTime.minutes);

        const totalHoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60);

        // Subtract lunch break
        const lunchBreakHours = (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60);
        return totalHoursWorked - lunchBreakHours;
    }

    function validatePtoHours(totalHoursWithPto) {
        console.log('Validating PTO hours...');
        const remainingPTO = Math.max(0, availablePTOHours - parseFloat(ptoTimeInput.value || 0));
        const ptoUsed = totalHoursWithPto - parseFloat(totalTimeWorkedSpan.textContent);

        if (ptoUsed > availablePTOHours) {
            ptoValidationMessage.textContent = '';
            ptoValidationMessage.style.color = 'red';
        } else if (totalHoursWithPto > 40 && parseFloat(ptoTimeInput.value) > 0) {
            ptoValidationMessage.textContent = 'Total hours including PTO cannot exceed 40 hours';
            ptoValidationMessage.style.color = 'red';
        } else {
            ptoValidationMessage.textContent = '';
        }
    }

    // Function to handle logout
    function handleLogout(event) {
        console.log('Handling logout...');
        event.preventDefault();
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html'; // Redirect to login page
    }

    async function submitTimesheet() {
        console.log('Submitting timesheet...');
        const ptoHoursDisplay = document.getElementById('pto-hours-display');
        const ptoHoursValue = parseFloat(ptoHoursDisplay.textContent.replace('Available PTO Hours: ', ''));

        if (ptoHoursValue === 0) {
            alert('No need to post, no PTO hours used.');
            return;
        }

        if (ptoHoursValue === 40) {
            alert('You are taking the whole week off.');
            // Proceed with posting the new value if necessary
        }

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.records.length > 0) {
                const recordId = data.records[0].id;

                const updateResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fields: {
                            'PTO Available': ptoHoursValue
                        }
                    })
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update PTO hours');
                }

                console.log('PTO hours updated successfully');
                alert('PTO hours updated successfully!');
            } else {
                throw new Error('No record found for user');
            }
        } catch (error) {
            console.error('Error updating PTO hours:', error);
            alert('Failed to update PTO hours.');
        }
    }

    document.getElementById('submit-button').addEventListener('click', submitTimesheet);

    // Initialize the form on page load
    async function initializeForm() {
        console.log('Initializing form...');
        const today = new Date();
        adjustToWednesday(today);
        weekEndingInput.value = today.toISOString().split('T')[0];
        handleWeekEndingChange(); // Trigger initial population based on today's date
    }

    initializeForm();
});
