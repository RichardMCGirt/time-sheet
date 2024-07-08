document.addEventListener("DOMContentLoaded", async function() {
    console.log('DOM fully loaded and parsed');
    
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
    const baseId = 'appMq9W12jZyCJeXe';
    const tableId = 'tblhTl5q7sEFDv66Z';
    let userEmail = localStorage.getItem('userEmail') || '';
    console.log('User email:', userEmail);

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
    const ptoHoursDisplay = document.getElementById('pto-hours-display');

    let availablePTOHours = 0;
    let debounceTimer;

    // Set initial value to empty string
    ptoHoursDisplay.textContent = 'Loading...';

    // Display user email next to logout button
    if (userEmail) {
        userEmailElement.textContent = `(${userEmail})`;
        console.log('User email set in the UI');
    } else {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
    }

    // Function to hide the PTO hours display
    function hidePtoHoursDisplay() {
        ptoHoursDisplay.style.display = 'none';
    }

    // Add event listener to PTO time input field
    ptoTimeInput.addEventListener('input', hidePtoHoursDisplay);

    // Fetch and display PTO hours
    await fetchPtoHours();

    // Add event listener to show calendar when week-ending input is clicked
    weekEndingInput.addEventListener('focus', () => weekEndingInput.showPicker());

    // Add event listeners to show clock when time input fields are clicked
    const timeInputs = document.querySelectorAll('input[type="time"]');
    timeInputs.forEach(input => {
        input.addEventListener('focus', () => input.showPicker());
    });

    // Adjust week-ending input width
    weekEndingInput.style.width = '150px';

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
        console.log('Endpoint:', endpoint);

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
            console.log('Fetched data:', data);

            if (data.records.length > 0) {
                const userRecord = data.records[0].fields;

                const ptoHours = parseFloat(userRecord['PTO Hours']) || 0;
                availablePTOHours = ptoHours;

                ptoHoursElement.textContent = ptoHours.toFixed(2);
                remainingPtoHoursElement.textContent = ptoHours.toFixed(2);
                ptoHoursDisplay.textContent = `Available PTO Hours: ${ptoHours.toFixed(2)}`;
                console.log('PTO hours:', ptoHours);
            } else {
                throw new Error('No PTO record found for user');
            }
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            ptoHoursElement.textContent = 'Error fetching PTO';
            remainingPtoHoursElement.textContent = 'Error';
            ptoHoursDisplay.textContent = 'Error';
        }
    }

    function handlePtoTimeChange() {
        console.log('Handling PTO time change...');
        
        const ptoTimeUsed = parseFloat(ptoTimeInput.value) || 0;
        const remainingPtoHours = Math.max(0, availablePTOHours - ptoTimeUsed);
        console.log('PTO time used:', ptoTimeUsed);
        console.log('Remaining PTO hours:', remainingPtoHours);

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
        ptoHoursDisplay.textContent = `PTO Hours: ${remainingHours.toFixed(2)}`;
    }

    async function handleWeekEndingChange() {
        console.log('Handling week-ending date change...');
        
        const selectedDate = new Date(weekEndingInput.value);
        adjustToWednesday(selectedDate);
        weekEndingInput.value = selectedDate.toISOString().split('T')[0];
        console.log('Adjusted week-ending date:', selectedDate);

        const date7 = new Date(selectedDate);
        date7.setDate(selectedDate.getDate() + 6);
        timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];

        populateWeekDates(selectedDate);
    }

    function adjustToWednesday(date) {
        let dayOfWeek = date.getDay();
        const offset = dayOfWeek < 2 ? 2 - dayOfWeek : 10 - dayOfWeek;
        date.setDate(date.getDate() + offset);
    }

    function populateWeekDates(weekEndingDate) {
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(weekEndingDate.getDate() - (6 - index));
            const inputField = timeEntryForm.elements[day];
            inputField.value = currentDate.toISOString().split('T')[0];
            inputField.disabled = !isEnabled(currentDate);
            console.log(`Set date for ${day}:`, currentDate);

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
                console.log('Added checkbox for', day);
            }
        });
    }

    function isEnabled(date) {
        return date.getDay() !== 0 && date.getDay() !== 6;
    }

    window.toggleWorkInputs = function(index, didNotWork) {
        console.log(`Toggling work inputs for index ${index}:`, didNotWork);
        
        const startTimeInput = timeEntryForm.elements[`start_time${index + 1}`];
        const lunchStartInput = timeEntryForm.elements[`lunch_start${index + 1}`];
        const lunchEndInput = timeEntryForm.elements[`lunch_end${index + 1}`];
        const endTimeInput = timeEntryForm.elements[`end_time${index + 1}`];
        const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);

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
            startTimeInput.value = startTimeInput.dataset.originalValue || '';
            lunchStartInput.value = lunchStartInput.dataset.originalValue || '';
            lunchEndInput.value = lunchEndInput.dataset.originalValue || '';
            endTimeInput.value = endTimeInput.dataset.originalValue || '';

            delete startTimeInput.dataset.originalValue;
            delete lunchStartInput.dataset.originalValue;
            delete lunchEndInput.dataset.originalValue;
            delete endTimeInput.dataset.originalValue;

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
            hoursWorked = roundToClosestQuarterHour(hoursWorked);
            totalHoursWorked += hoursWorked;
            hoursWorkedSpan.textContent = hoursWorked.toFixed(2);

            const ptoTime = parseFloat(ptoTimeInput.value) || 0;
            totalHoursWithPto = totalHoursWorked + ptoTime;
        });

        totalTimeWorkedSpan.textContent = totalHoursWorked.toFixed(2);
        totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);
        console.log('Total hours worked:', totalHoursWorked);
        console.log('Total hours with PTO:', totalHoursWithPto);

        validatePtoHours(totalHoursWithPto);
    }

    function parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return { hours, minutes };
    }

    function calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(startTime.hours, startTime.minutes);

        const lunchStartDateTime = new Date(startDate);
        lunchStartDateTime.setHours(lunchStart.hours, lunchStart.minutes);

        const lunchEndDateTime = new Date(startDate);
        lunchEndDateTime.setHours(lunchEnd.hours, lunchEnd.minutes);

        const endDateTime = new Date(startDate);
        endDateTime.setHours(endTime.hours, endTime.minutes);

        const totalHoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60);

        const lunchBreakHours = (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60);
        return totalHoursWorked - lunchBreakHours;
    }

    function roundToClosestQuarterHour(hours) {
        const quarterHours = Math.round(hours * 4) / 4;
        return quarterHours;
    }

    function validatePtoHours(totalHoursWithPto) {
        const remainingPTO = Math.max(0, availablePTOHours - parseFloat(ptoTimeInput.value || 0));
        const ptoUsed = totalHoursWithPto - parseFloat(totalTimeWorkedSpan.textContent);
        console.log('PTO used:', ptoUsed);

        if (ptoUsed > availablePTOHours) {
            ptoValidationMessage.textContent = 'PTO time used cannot exceed available PTO hours';
            ptoValidationMessage.style.color = 'red';
        } else if (totalHoursWithPto > 40 && parseFloat(ptoTimeInput.value) > 0) {
            ptoValidationMessage.textContent = 'Total hours including PTO cannot exceed 40 hours';
            ptoValidationMessage.style.color = 'red';
        } else {
            ptoValidationMessage.textContent = '';
        }
    }

    function handleLogout(event) {
        event.preventDefault();
        console.log('Logging out...');
        
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    async function updatePtoHours() {
        console.log('Updating PTO hours...');
        
        // Get the remaining PTO hours value
        const usedPtoHoursValue = parseFloat(ptoTimeInput.value) || 0; // Get the used PTO hours value
        const newPtoHoursValue = availablePTOHours - usedPtoHoursValue; // Calculate new PTO hours

        console.log('Used PTO hours value:', usedPtoHoursValue);
        console.log('New PTO hours value:', newPtoHoursValue);

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        console.log('Endpoint for update:', endpoint);

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
            console.log('Fetched data for update:', data);

            if (data.records.length > 0) {
                const recordId = data.records[0].id;
                console.log('Record ID:', recordId);

                const updateResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fields: {
                            'PTO Hours': newPtoHoursValue // Update PTO Hours field
                        }
                    })
                });

                console.log('Update response status:', updateResponse.status);
                const updateResponseData = await updateResponse.json();
                console.log('Update response data:', updateResponseData);

                if (!updateResponse.ok) {
                    throw new Error(`Failed to update PTO hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
                }

                console.log('PTO hours updated successfully');
                alert('PTO hours updated successfully!');
            } else {
                throw new Error('No record found for user');
            }
        } catch (error) {
            console.error('Error updating PTO hours:', error);
            alert('Failed to update PTO hours. Error: ' + error.message);
        }
    }
    
    document.getElementById('submit-button').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission
        updatePtoHours();
    });

    async function initializeForm() {
        console.log('Initializing form...');
        
        const today = new Date();
        adjustToWednesday(today);
        weekEndingInput.value = today.toISOString().split('T')[0];
        handleWeekEndingChange();
    }

    initializeForm();
});
