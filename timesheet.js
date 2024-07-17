// main.js

document.addEventListener("DOMContentLoaded", async function () {
    console.log('DOM fully loaded and parsed');




const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'app9gw2qxhGCmtJvW';
const tableId = 'tbljmLpqXScwhiWTt/';



    let userEmail = localStorage.getItem('userEmail') || '';
    console.log('User email:', userEmail);

    // DOM elements
    const ptoHoursElement = document.getElementById('pto-hours');
    const personalHoursInput = document.getElementById('personal-time');
    const holidayHoursInput = document.getElementById('Holiday-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const timeEntryForm = document.getElementById('time-entry-form');
    const ptoTimeInput = document.getElementById('pto-time');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const totalTimeWithPtoSpan = document.getElementById('total-time-with-pto-value');
    const ptoValidationMessage = document.getElementById('pto-validation-message');
    const remainingPtoHoursElement = document.getElementById('remaining-pto-hours');
    const remainingPersonalHoursElement = document.getElementById('remaining-personal-hours');
    const logoutButton = document.getElementById('logout-button');
    const userEmailElement = document.getElementById('user-email');
    const ptoHoursDisplay = document.getElementById('pto-hours-display');
    const personalTimeDisplay = document.getElementById('personal-time-display');
    const resetButton = document.getElementById('reset-button');

    let availablePTOHours = 0;
    let availablePersonalHours = 0;
    let debounceTimer;

    // Set initial value to empty string
    ptoHoursDisplay.textContent = 'Loading...';
    personalTimeDisplay.textContent = 'Loading...';

    // Display user email next to logout button
    if (userEmail) {
        userEmailElement.textContent = userEmail;
        console.log('User email set in the UI');
    } else {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
    }

    // Add event listener to PTO time input field
    ptoTimeInput.addEventListener('input', hidePtoHoursDisplay);
    personalHoursInput.addEventListener('input', hidePtoHoursDisplay);
    holidayHoursInput.addEventListener('input', hidePtoHoursDisplay);

    // Add event listener to update personal time display
    personalHoursInput.addEventListener('input', handlePersonalTimeChange);
    holidayHoursInput.addEventListener('input', handleHolidayHoursChange);

    // Fetch and display PTO hours and Personal hours
    await fetchPtoHours();
    await fetchPersonalTime();

    // Add event listener to show calendar when week-ending input is clicked
    weekEndingInput.addEventListener('focus', () => weekEndingInput.showPicker());

    // Add event listeners to show clock when time input fields are clicked
    const timeInputs = document.querySelectorAll('input[type="time"]');
    timeInputs.forEach(input => {
        input.addEventListener('focus', () => input.showPicker());
        input.addEventListener('keydown', handleArrowKeys); // Add this line
    });

    // Adjust week-ending input width
    weekEndingInput.style.width = '120px';

    // Event listeners
    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });
    ptoTimeInput.addEventListener('input', handlePtoTimeChange);
    personalHoursInput.addEventListener('input', handlePersonalTimeChange);
    holidayHoursInput.addEventListener('input', handleHolidayHoursChange);
    logoutButton.addEventListener('click', handleLogout);
    resetButton.addEventListener('click', resetForm);

    // Initialize form
    await initializeForm();

    // Attach screenshot and patch function to submit button
    document.getElementById('submit-button').addEventListener('click', handleSubmit);

    // Hide PTO hours display
    function hidePtoHoursDisplay() {
        //ptoHoursDisplay.style.display = 'none';
        //personalTimeDisplay.style.display = 'none';
    }

    // Fetch PTO hours
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

    // Fetch Personal hours
    async function fetchPersonalTime() {
        console.log('Fetching Personal hours...');

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

                const personalHours = parseFloat(userRecord['Personaltime']) || 0;
                availablePersonalHours = personalHours;

                personalTimeDisplay.textContent = `Personal Time: ${personalHours.toFixed(2)}`;
                remainingPersonalHoursElement.textContent = personalHours.toFixed(2);
                console.log('Personal hours:', personalHours);
            } else {
                throw new Error('No personal time record found for user');
            }
        } catch (error) {
            console.error('Error fetching personal hours:', error);
            personalHoursInput.value = 'Error fetching personal hours';
            personalTimeDisplay.textContent = 'Error fetching personal time';
            remainingPersonalHoursElement.textContent = 'Error';
        }
    }

    // Handle PTO time change
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
        updatePtoHoursDisplay(remainingPtoHours);
        calculateTotalTimeWorked();
    }

    // Handle Personal time change
    function handlePersonalTimeChange() {
        console.log('Handling Personal time change...');

        const personalTimeUsed = parseFloat(personalHoursInput.value) || 0;
        const remainingPersonalHours = Math.max(0, availablePersonalHours - personalTimeUsed);
        console.log('Personal time used:', personalTimeUsed);
        console.log('Remaining Personal hours:', remainingPersonalHours);

        if (personalTimeUsed > availablePersonalHours) {
            ptoValidationMessage.textContent = 'Personal time used cannot exceed available Personal hours';
            ptoValidationMessage.style.color = 'red';
        } else {
            ptoValidationMessage.textContent = '';
        }

        remainingPersonalHoursElement.textContent = remainingPersonalHours.toFixed(2);
        updatePersonalHoursDisplay(remainingPersonalHours);
        updatePersonalTimeDisplay(personalTimeUsed, remainingPersonalHours);
        calculateTotalTimeWorked();
    }

    // Handle Holiday hours change
    function handleHolidayHoursChange() {
        console.log('Handling Holiday hours change...');
        calculateTotalTimeWorked();
    }

    // Update PTO hours display
    function updatePtoHoursDisplay(remainingHours) {
        ptoHoursDisplay.textContent = `PTO Hours: ${remainingHours.toFixed(2)}`;
    }

    // Update Personal time display
    function updatePersonalTimeDisplay(personalTimeUsed, remainingPersonalHours) {
        personalTimeDisplay.textContent = `Personal Time: ${remainingPersonalHours.toFixed(2)}`;
        remainingPersonalHoursElement.textContent = remainingPersonalHours.toFixed(2);
        totalTimeWithPtoSpan.textContent = (
            parseFloat(totalTimeWorkedSpan.textContent) +
            personalTimeUsed +
            (parseFloat(ptoTimeInput.value) || 0) +
            (parseFloat(holidayHoursInput.value) || 0)
        ).toFixed(2);
    }

    // Handle week-ending date change
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

    // Adjust date to the nearest Wednesday
    function adjustToWednesday(date) {
        const dayOfWeek = date.getDay();
        const offset = (2 - dayOfWeek + 7) % 7; // 3 is Wednesday (0=Sunday, 1=Monday, ..., 6=Saturday)
        date.setDate(date.getDate() + offset);
    }

    // Populate dates for the week
    function populateWeekDates(weekEndingDate) {
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(currentDate.getDate() - (6 - index)); // Adjusting to the correct day in the week

            const inputField = timeEntryForm.elements[day];
            inputField.value = currentDate.toISOString().split('T')[0];

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

    // Toggle work inputs
    window.toggleWorkInputs = function (index, didNotWork) {
        console.log(`Toggling work inputs for index ${index}:`, didNotWork);

        const startTimeInput = timeEntryForm.elements[`start_time${index + 1}`];
        const lunchStartInput = timeEntryForm.elements[`lunch_start${index + 1}`];
        const lunchEndInput = timeEntryForm.elements[`lunch_end${index + 1}`];
        const endTimeInput = timeEntryForm.elements[`end_time${index + 1}`];
        const additionalTimeInInput = timeEntryForm.elements[`Additional_Time_In${index + 1}`];
        const additionalTimeOutInput = timeEntryForm.elements[`Additional_Time_Out${index + 1}`];
        const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);

        if (didNotWork && !startTimeInput.dataset.originalValue) {
            startTimeInput.dataset.originalValue = startTimeInput.value;
            lunchStartInput.dataset.originalValue = lunchStartInput.value;
            lunchEndInput.dataset.originalValue = lunchEndInput.value;
            endTimeInput.dataset.originalValue = endTimeInput.value;
            additionalTimeInInput.dataset.originalValue = additionalTimeInInput.value;
            additionalTimeOutInput.dataset.originalValue = additionalTimeOutInput.value;
        }

        startTimeInput.disabled = didNotWork;
        lunchStartInput.disabled = didNotWork;
        lunchEndInput.disabled = didNotWork;
        endTimeInput.disabled = didNotWork;
        additionalTimeInInput.disabled = didNotWork;
        additionalTimeOutInput.disabled = didNotWork;

        if (didNotWork) {
            startTimeInput.value = '';
            lunchStartInput.value = '';
            lunchEndInput.value = '';
            endTimeInput.value = '';
            additionalTimeInInput.value = '';
            additionalTimeOutInput.value = '';
            hoursWorkedSpan.textContent = '0.00';
        } else {
            startTimeInput.value = startTimeInput.dataset.originalValue || '';
            lunchStartInput.value = lunchStartInput.dataset.originalValue || '';
            lunchEndInput.value = lunchEndInput.dataset.originalValue || '';
            endTimeInput.value = endTimeInput.dataset.originalValue || '';
            additionalTimeInInput.value = additionalTimeInInput.dataset.originalValue || '';
            additionalTimeOutInput.value = additionalTimeOutInput.dataset.originalValue || '';

            delete startTimeInput.dataset.originalValue;
            delete lunchStartInput.dataset.originalValue;
            delete lunchEndInput.dataset.originalValue;
            delete endTimeInput.dataset.originalValue;
            delete additionalTimeInInput.dataset.originalValue;
            delete additionalTimeOutInput.dataset.originalValue;

            calculateTotalTimeWorked();
            updateLunchOptions(index);
        }
    }

    // Update lunch options
    function updateLunchOptions(index) {
        const startTimeInput = timeEntryForm.elements[`start_time${index + 1}`];
        const endTimeInput = timeEntryForm.elements[`end_time${index + 1}`];
        const lunchStartInput = timeEntryForm.elements[`lunch_start${index + 1}`];
        const lunchEndInput = timeEntryForm.elements[`lunch_end${index + 1}`];

        const startTime = parseTime(startTimeInput.value);
        const endTime = parseTime(endTimeInput.value);

        if (startTime && endTime) {
            const lunchStartOptions = generateTimeOptions(startTime, endTime);
            const lunchEndOptions = generateTimeOptions(startTime, endTime);

            updateDropdownOptions(lunchStartInput, lunchStartOptions);
            updateDropdownOptions(lunchEndInput, lunchEndOptions);
        }
    }

    // Generate time options
    function generateTimeOptions(startTime, endTime) {
        const options = [];
        let currentTime = new Date();
        currentTime.setHours(startTime.hours, startTime.minutes, 0, 0);
        const endDateTime = new Date();
        endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);

        while (currentTime < endDateTime) {
            options.push(formatTime(currentTime));
            currentTime.setMinutes(currentTime.getMinutes() + 15);
        }

        return options;
    }

    // Update dropdown options
    function updateDropdownOptions(dropdown, options) {
        dropdown.innerHTML = '';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            dropdown.appendChild(opt);
        });
    }

    // Format time as HH:MM
    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Calculate total time worked
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
            const additionalTimeInInput = timeEntryForm.elements[`Additional_Time_In${index + 1}`];
            const additionalTimeOutInput = timeEntryForm.elements[`Additional_Time_Out${index + 1}`];
            const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);

            const startDate = new Date(dateInput.value);
            const startTime = parseTime(startTimeInput.value);
            const lunchStart = parseTime(lunchStartInput.value);
            const lunchEnd = parseTime(lunchEndInput.value);
            const endTime = parseTime(endTimeInput.value);
            const additionalTimeIn = parseTime(additionalTimeInInput.value);
            const additionalTimeOut = parseTime(additionalTimeOutInput.value);

            let hoursWorked = calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut);
            hoursWorked = roundToClosestQuarterHour(hoursWorked);

            if (!isNaN(hoursWorked)) {
                if (hoursWorked > 24) {
                    alert(`Total hours worked on ${dateInput.value} cannot exceed 24 hours.`);
                    hoursWorkedSpan.textContent = '0.00';
                } else {
                    totalHoursWorked += hoursWorked;
                    hoursWorkedSpan.textContent = hoursWorked.toFixed(2);
                }
            } else {
                hoursWorkedSpan.textContent = '0.00';
            }
        });

        const ptoTime = parseFloat(ptoTimeInput.value) || 0;
        const personalTime = parseFloat(personalHoursInput.value) || 0;
        const holidayHours = parseFloat(holidayHoursInput.value) || 0;

        totalHoursWithPto = totalHoursWorked + ptoTime + personalTime + holidayHours;

        totalTimeWorkedSpan.textContent = totalHoursWorked.toFixed(2);
        totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);
        console.log('Total hours worked:', totalHoursWorked);
        console.log('Total hours with PTO:', totalHoursWithPto);

        validatePtoHours(totalHoursWithPto);
        validatePersonalHours(totalHoursWithPto); // Added this line
    }

    // Parse time string
    function parseTime(timeString) {
        if (!timeString) {
            return null;
        }
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return { hours, minutes };
    }

    // Calculate hours worked
    function calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut) {
        if (!startTime || !endTime) {
            return NaN; // Return NaN if start time or end time is missing
        }

        const startDateTime = new Date(startDate);
        startDateTime.setHours(startTime.hours, startTime.minutes);

        const endDateTime = new Date(startDate);
        endDateTime.setHours(endTime.hours, endTime.minutes);

        let totalHoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60); // Total hours between start and end time

        if (lunchStart && lunchEnd) {
            const lunchStartDateTime = new Date(startDate);
            lunchStartDateTime.setHours(lunchStart.hours, lunchStart.minutes);

            const lunchEndDateTime = new Date(startDate);
            lunchEndDateTime.setHours(lunchEnd.hours, lunchEnd.minutes);

            const lunchBreakHours = (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60);
            totalHoursWorked -= lunchBreakHours;
        }

        if (additionalTimeIn && additionalTimeOut) {
            const additionalTimeInDateTime = new Date(startDate);
            additionalTimeInDateTime.setHours(additionalTimeIn.hours, additionalTimeIn.minutes);

            const additionalTimeOutDateTime = new Date(startDate);
            additionalTimeOutDateTime.setHours(additionalTimeOut.hours, additionalTimeOut.minutes);

            const additionalTimeWorked = (additionalTimeOutDateTime - additionalTimeInDateTime) / (1000 * 60 * 60);
            totalHoursWorked += additionalTimeWorked;
        }

        return Math.max(0, totalHoursWorked); // Ensure hours worked is not negative
    }

    // Round to the closest quarter hour
    function roundToClosestQuarterHour(hours) {
        const quarterHours = Math.round(hours * 4) / 4;
        return quarterHours;
    }

    // Validate PTO hours
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

  

    // Handle logout
    function handleLogout(event) {
        event.preventDefault();
        console.log('Logging out...');

        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    // Update PTO hours
    async function updatePtoHours() {
        console.log('Updating PTO hours...');

        const usedPtoHoursValue = parseFloat(ptoTimeInput.value) || 0;
        const newPtoHoursValue = availablePTOHours - usedPtoHoursValue;

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
                            'PTO Hours': newPtoHoursValue
                        }
                    })
                });

                const updateResponseData = await updateResponse.json();
                console.log('Update response data:', updateResponseData);

                if (!updateResponse.ok) {
                    throw new Error(`Failed to update PTO hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
                }

                console.log('PTO hours updated successfully');
                alert('PTO hours updated successfully!');
                clearForm();
            } else {
                throw new Error('No record found for user');
            }
        } catch (error) {
            console.error('Error updating PTO hours:', error);
            alert('Failed to update PTO hours. Error: ' + error.message);
            clearForm();
        }
    }

    // Update Personal hours
    async function updatePersonalHours() {
        console.log('Updating Personal hours...');

        const usedPersonalHoursValue = parseFloat(personalHoursInput.value) || 0;
        const newPersonalHoursValue = availablePersonalHours - usedPersonalHoursValue;

        console.log('Used Personal hours value:', usedPersonalHoursValue);
        console.log('New Personal hours value:', newPersonalHoursValue);

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
                            'Personaltime': newPersonalHoursValue
                        }
                    })
                });

                const updateResponseData = await updateResponse.json();
                console.log('Update response data:', updateResponseData);

                if (!updateResponse.ok) {
                    throw new Error(`Failed to update Personal hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
                }

                console.log('Personal hours updated successfully');
                alert('Personal hours updated successfully!');
                clearForm();
            } else {
                throw new Error('No record found for user');
            }
        } catch (error) {
            console.error('Error updating Personal hours:', error);
            alert('Failed to update Personal hours. Error: ' + error.message);
            clearForm();
        }
    }

    // Clear form
    function clearForm() {
        console.log('Clearing form...');
        timeEntryForm.reset();
        ptoTimeInput.value = 0;
        personalHoursInput.value = 0;
        holidayHoursInput.value = 0;
        totalTimeWorkedSpan.textContent = '0.00';
        totalTimeWithPtoSpan.textContent = '0.00';
        remainingPtoHoursElement.textContent = '0.00';
        remainingPersonalHoursElement.textContent = '0.00';
    }

    // Reset form
    function resetForm(event) {
        event.preventDefault();
        console.log('Resetting form...');
        clearForm();
    }

    // Handle form submission
    function handleSubmit(event) {
        event.preventDefault(); // Prevent form submission

        const totalTimeWithPto = parseFloat(totalTimeWithPtoSpan.textContent);
        const ptoTimeUsed = parseFloat(ptoTimeInput.value) || 0;
        const personalTimeUsed = parseFloat(personalHoursInput.value) || 0;
        const holidayHoursUsed = parseFloat(holidayHoursInput.value) || 0;

        if (ptoTimeUsed === 0 && personalTimeUsed === 0 && holidayHoursUsed === 0) {
            alert('Nothing to change');
            return;
        }

        if (totalTimeWithPto > 40 && (ptoTimeUsed > 0 || personalTimeUsed > 0 || holidayHoursUsed > 0)) {
            alert('Total hours including PTO, Personal time, or Holiday time cannot exceed 40 hours.');
            return;
        }

        updatePtoHours();
        updatePersonalHours();
        captureScreenshotAndPatch(userEmail);
    }

    // Initialize form
    async function initializeForm() {
        console.log('Initializing form...');

        const today = new Date();
        adjustToWednesday(today);
        weekEndingInput.value = today.toISOString().split('T')[0];
        handleWeekEndingChange();
    }

  

    // Get record ID by email
    async function getRecordIdByEmail(email) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={Email}='${email}'`;
        console.log('Fetching record ID for email:', email);
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch record: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.records.length > 0) {
                const recordId = data.records[0].id;
                console.log('Record ID:', recordId);
                return recordId;
            } else {
                throw new Error('No record found for the provided email.');
            }
        } catch (error) {
            console.error('Error fetching record ID:', error);
            throw error;
        }
    }


    // Handle arrow key navigation
    function handleArrowKeys(event) {
        const key = event.key;
        const currentInput = event.target;
        const inputs = Array.from(document.querySelectorAll('input[type="time"]'));

        let index = inputs.indexOf(currentInput);

        if (key === 'ArrowRight') {
            index = (index + 1) % inputs.length;
        } else if (key === 'ArrowLeft') {
            index = (index - 1 + inputs.length) % inputs.length;
        } else if (key === 'ArrowDown') {
            index = (index + 6) % inputs.length; // Assuming 7 time fields per row
        } else if (key === 'ArrowUp') {
            index = (index - 6 + inputs.length) % inputs.length; // Assuming 7 time fields per row
        }

        inputs[index].focus();
    }
});
