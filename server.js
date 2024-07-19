document.addEventListener("DOMContentLoaded", async function() {
    console.log('DOM fully loaded and parsed');

    // Constants for API keys and Airtable information
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';

    // Retrieve user email from local storage
    let userEmail = localStorage.getItem('userEmail') || '';
    console.log('User email:', userEmail);

    // Elements object to store references to DOM elements
    const elements = {
        ptoHoursElement: document.getElementById('pto-hours'),
        personalHoursInput: document.getElementById('personal-time-input'),
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
    };

    let availablePTOHours = 0;
    let availablePersonalHours = 0;

    // Set initial loading text
    elements.ptoHoursDisplay.textContent = 'Loading...';
    elements.personalTimeDisplay.textContent = 'Loading...';

    // Check if user email is available, if not redirect to login
    if (userEmail) {
        elements.userEmailElement.textContent = userEmail;
        console.log('User email set in the UI');
    } else {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
    }

    // Event listeners for input fields
    elements.holidayHoursInput.addEventListener('input', hidePtoHoursDisplay);
    elements.holidayHoursInput.addEventListener('input', handleHolidayHoursChange);
    elements.weekEndingInput.addEventListener('focus', () => elements.weekEndingInput.showPicker());
    elements.weekEndingInput.addEventListener('change', handleWeekEndingChange);
    elements.timeEntryForm.addEventListener('input', debounce(calculateTotalTimeWorked, 300));
    elements.logoutButton.addEventListener('click', handleLogout);
    elements.resetButton.addEventListener('click', resetForm);

    const timeInputs = document.querySelectorAll('select.time-dropdown');
    timeInputs.forEach(input => {
        input.addEventListener('focus', () => input.showPicker());
        input.addEventListener('keydown', handleArrowKeys);
    });

    // Fetch PTO hours and personal time from Airtable
    await fetchPtoHours();
    await fetchPersonalTime();

    // Fetches PTO hours from Airtable
    async function fetchPtoHours() {
        console.log('Fetching PTO hours...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        console.log('Endpoint:', endpoint);

        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
            
            const data = await response.json();
            console.log('Fetched data:', data);

            if (data.records.length > 0) {
                const userRecord = data.records[0].fields;
                const ptoHours = parseFloat(userRecord['PTO Hours']) || 0;
                availablePTOHours = ptoHours;

                elements.ptoHoursElement.textContent = ptoHours.toFixed(2);
                elements.remainingPtoHoursElement.textContent = ptoHours.toFixed(2);
                elements.ptoHoursDisplay.textContent = `Available PTO Hours: ${ptoHours.toFixed(2)}`;
                console.log('PTO hours:', ptoHours);
            } else {
                throw new Error('No PTO record found for user');
            }
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            elements.ptoHoursElement.textContent = 'Error fetching PTO';
            elements.remainingPtoHoursElement.textContent = 'Error';
            elements.ptoHoursDisplay.textContent = 'Error';
        }
    }

    // Fetches personal time from Airtable
    async function fetchPersonalTime() {
        console.log('Fetching Personal hours...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        console.log('Endpoint:', endpoint);

        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

            const data = await response.json();
            console.log('Fetched data:', data);

            if (data.records.length > 0) {
                const userRecord = data.records[0].fields;
                const personalHours = parseFloat(userRecord['Personaltime']) || 0;
                availablePersonalHours = personalHours;

                elements.personalTimeDisplay.textContent = `Personal Time: ${personalHours.toFixed(2)}`;
                elements.remainingPersonalHoursElement.textContent = personalHours.toFixed(2);
                console.log('Personal hours:', personalHours);
            } else {
                throw new Error('No personal time record found for user');
            }
        } catch (error) {
            console.error('Error fetching personal hours:', error);
            elements.personalHoursInput.value = 'Error fetching personal hours';
            elements.personalTimeDisplay.textContent = 'Error fetching personal time';
            elements.remainingPersonalHoursElement.textContent = 'Error';
        }
    }

    // Handle holiday hours change
    function handleHolidayHoursChange() {
        console.log('Handling Holiday hours change...');
        calculateTotalTimeWorked();
    }

    // Handle week ending date change
    async function handleWeekEndingChange() {
        console.log('Handling week-ending date change...');
        const selectedDate = new Date(elements.weekEndingInput.value);
        adjustToWednesday(selectedDate);
        elements.weekEndingInput.value = selectedDate.toISOString().split('T')[0];
        console.log('Adjusted week-ending date:', selectedDate);

        const date7 = new Date(selectedDate);
        date7.setDate(selectedDate.getDate() + 6);
        elements.timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];
        populateWeekDates(selectedDate);
    }

    // Adjust the date to the nearest Wednesday
    function adjustToWednesday(date) {
        const dayOfWeek = date.getDay();
        const offset = (2 - dayOfWeek + 7) % 7;
        date.setDate(date.getDate() + offset);
    }

    // Populate week dates based on week ending date
    function populateWeekDates(weekEndingDate) {
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(currentDate.getDate() - (6 - index));
            const inputField = elements.timeEntryForm.elements[day];
            inputField.value = currentDate.toISOString().split('T')[0];
            console.log(`Set date for ${day}:`, currentDate);
            const checkboxId = `did-not-work-${index + 1}`;
            let checkbox = document.getElementById(checkboxId);
            if (!checkbox) {
                checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = checkboxId;
                checkbox.name = `did_not_work${index + 1}`;
                checkbox.addEventListener('change', (event) => toggleWorkInputs(index, event.target.checked));
                const cell = document.createElement('td');
                cell.appendChild(checkbox);
                inputField.parentElement.parentElement.appendChild(cell);
                console.log('Added checkbox for', day);
            }
        });
    }

    // Toggle work inputs based on checkbox status
    window.toggleWorkInputs = function(index, didNotWork) {
        console.log(`Toggling work inputs for index ${index}:`, didNotWork);
        const timeFields = ['start_time', 'lunch_start', 'lunch_end', 'end_time', 'Additional_Time_In', 'Additional_Time_Out'];
        timeFields.forEach(field => {
            const input = elements.timeEntryForm.elements[`${field}${index + 1}`];
            if (didNotWork && !input.dataset.originalValue) {
                input.dataset.originalValue = input.value;
            }
            input.disabled = didNotWork;
            input.value = didNotWork ? '--:--' : input.dataset.originalValue || '';
            if (!didNotWork) {
                delete input.dataset.originalValue;
            }
        });
        document.getElementById(`hours-worked-today${index + 1}`).textContent = didNotWork ? '0.00' : document.getElementById(`hours-worked-today${index + 1}`).textContent;
        if (!didNotWork) {
            calculateTotalTimeWorked();
        }
    };

    // Calculate total time worked
    function calculateTotalTimeWorked() {
        console.log('Calculating total time worked...');
        let totalHoursWorked = 0;
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const dateInput = elements.timeEntryForm.elements[day];
            const timeFields = ['start_time', 'lunch_start', 'lunch_end', 'end_time', 'Additional_Time_In', 'Additional_Time_Out'].map(field => elements.timeEntryForm.elements[`${field}${index + 1}`]);
            const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);
            const hoursWorked = calculateDailyHoursWorked(dateInput, ...timeFields);
            totalHoursWorked += hoursWorked;
            hoursWorkedSpan.textContent = hoursWorked.toFixed(2);
        });
        const ptoTime = parseFloat(elements.ptoTimeSpan.textContent) || 0;
        const personalTime = parseFloat(elements.personalTimeSpan.textContent) || 0;
        const holidayHours = parseFloat(elements.holidayTimeSpan.textContent) || 0;
        const totalHoursWithPto = totalHoursWorked + ptoTime + personalTime + holidayHours;
        elements.totalTimeWorkedSpan.textContent = totalHoursWorked.toFixed(2);
        elements.totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);
        console.log('Total hours worked:', totalHoursWorked);
        console.log('Total hours with PTO:', totalHoursWithPto);
        validatePtoHours(totalHoursWithPto);
        validatePersonalHours(totalHoursWithPto);
        updateTotalPtoAndHolidayHours();
    }

    // Calculate daily hours worked
    function calculateDailyHoursWorked(dateInput, startTimeInput, lunchStartInput, lunchEndInput, endTimeInput, additionalTimeInInput, additionalTimeOutInput) {
        const startDate = new Date(dateInput.value);
        const times = [startTimeInput, lunchStartInput, lunchEndInput, endTimeInput, additionalTimeInInput, additionalTimeOutInput].map(input => parseTime(input.value));
        const [startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut] = times;
        let hoursWorked = calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut);
        return roundToClosestQuarterHour(hoursWorked);
    }

    // Parse time from input value
    function parseTime(timeString) {
        if (!timeString || timeString === "--:--") return null;
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return { hours, minutes };
    }

    // Calculate hours worked based on start and end times
    function calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut) {
        if (!startTime || !endTime) return 0;
        const startDateTime = new Date(startDate);
        startDateTime.setHours(startTime.hours, startTime.minutes);
        const endDateTime = new Date(startDate);
        endDateTime.setHours(endTime.hours, endTime.minutes);
        let totalHoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60);
        if (lunchStart && lunchEnd) {
            const lunchStartDateTime = new Date(startDate);
            lunchStartDateTime.setHours(lunchStart.hours, lunchStart.minutes);
            const lunchEndDateTime = new Date(startDate);
            lunchEndDateTime.setHours(lunchEnd.hours, lunchEnd.minutes);
            totalHoursWorked -= (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60);
        }
        if (additionalTimeIn && additionalTimeOut) {
            const additionalTimeInDateTime = new Date(startDate);
            additionalTimeInDateTime.setHours(additionalTimeIn.hours, additionalTimeIn.minutes);
            const additionalTimeOutDateTime = new Date(startDate);
            additionalTimeOutDateTime.setHours(additionalTimeOut.hours, additionalTimeOut.minutes);
            totalHoursWorked += (additionalTimeOutDateTime - additionalTimeInDateTime) / (1000 * 60 * 60);
        }
        return Math.max(0, totalHoursWorked);
    }

    // Round hours to the closest quarter hour
    function roundToClosestQuarterHour(hours) {
        return Math.round(hours * 4) / 4;
    }

    // Validate PTO hours
    function validatePtoHours(totalHoursWithPto) {
        const remainingPTO = Math.max(0, availablePTOHours - parseFloat(elements.ptoTimeSpan.textContent || 0));
        const ptoUsed = totalHoursWithPto - parseFloat(elements.totalTimeWorkedSpan.textContent);
        console.log('PTO used:', ptoUsed);

        if (ptoUsed > availablePTOHours) {
            elements.ptoValidationMessage.textContent = 'PTO time used cannot exceed available PTO hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else if (totalHoursWithPto > 40 && parseFloat(elements.ptoTimeSpan.textContent) > 0) {
            elements.ptoValidationMessage.textContent = 'Total hours including PTO cannot exceed 40 hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else {
            elements.ptoValidationMessage.textContent = '';
        }
    }

    // Validate personal hours
    function validatePersonalHours(totalHoursWithPto) {
        const remainingPersonal = Math.max(0, availablePersonalHours - parseFloat(elements.personalTimeSpan.textContent || 0));
        const personalUsed = totalHoursWithPto - parseFloat(elements.totalTimeWorkedSpan.textContent);
        console.log('Personal used:', personalUsed);

        if (personalUsed > availablePersonalHours) {
            elements.ptoValidationMessage.textContent = 'Personal time used cannot exceed available Personal hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else if (totalHoursWithPto > 40 && parseFloat(elements.personalTimeSpan.textContent) > 0) {
            elements.ptoValidationMessage.textContent = 'Total hours including Personal time cannot exceed 40 hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else {
            elements.ptoValidationMessage.textContent = '';
        }
    }

    // Debounce function to limit the rate of execution
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Scroll to the focused element smoothly
    function scrollToElement(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Event listeners for time input fields
    timeInputs.forEach(input => {
        input.addEventListener('focus', () => scrollToElement(input));
    });

    // Handle logout action
    function handleLogout(event) {
        event.preventDefault();
        console.log('Logging out...');
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    // Update PTO hours in Airtable
    async function updatePtoHours() {
        console.log('Updating PTO hours...');
        const usedPtoHoursValue = parseFloat(elements.ptoTimeSpan.textContent) || 0;
        const newPtoHoursValue = Math.max(0, availablePTOHours - usedPtoHoursValue);
        console.log('Used PTO hours value:', usedPtoHoursValue);
        console.log('New PTO hours value:', newPtoHoursValue);

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        console.log('Endpoint for update:', endpoint);

        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
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
                    body: JSON.stringify({ fields: { 'PTO Hours': newPtoHoursValue } })
                });

                const updateResponseData = await updateResponse.json();
                console.log('Update response data:', updateResponseData);

                if (!updateResponse.ok) throw new Error(`Failed to update PTO hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
                console.log('PTO hours updated successfully');
                alert('PTO hours updated successfully!');
                clearForm();

                const remainingPtoHours = parseFloat(newPtoHoursValue.toFixed(2));
                console.log('Remaining PTO Hours:', remainingPtoHours);
            } else {
                throw new Error('No record found for user');
            }
        } catch (error) {
            console.error('Error updating PTO hours:', error);
            alert('Failed to update PTO hours. Error: ' + error.message);
            clearForm();
        }
    }

    // Update personal hours in Airtable
    async function updatePersonalHours() {
        console.log('Updating Personal hours...');
        const usedPersonalHoursValue = parseFloat(elements.personalTimeSpan.textContent) || 0;
        const newPersonalHoursValue = Math.max(0, availablePersonalHours - usedPersonalHoursValue);
        console.log('Used Personal hours value:', usedPersonalHoursValue);
        console.log('New Personal hours value:', newPersonalHoursValue);

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        console.log('Endpoint for update:', endpoint);

        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
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
                    body: JSON.stringify({ fields: { 'Personaltime': newPersonalHoursValue } })
                });

                const updateResponseData = await updateResponse.json();
                console.log('Update response data:', updateResponseData);

                if (!updateResponse.ok) throw new Error(`Failed to update Personal hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
                console.log('Personal hours updated successfully');
                alert('Personal hours updated successfully!');
                clearForm();

                const remainingPersonalHours = parseFloat(newPersonalHoursValue.toFixed(2));
                console.log('Remaining Personal Hours:', remainingPersonalHours);
            } else {
                throw new Error('No record found for user');
            }
        } catch (error) {
            console.error('Error updating Personal hours:', error);
            alert('Failed to update Personal hours. Error: ' + error.message);
            clearForm();
        }
    }

    // Clear form inputs and reset values
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
    }

    // Reset form event handler
    function resetForm(event) {
        event.preventDefault();
        console.log('Resetting form...');
        clearForm();
    }

    // Submit button event handler
    elements.submitButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const totalTimeWithPto = parseFloat(elements.totalTimeWithPtoSpan.textContent);
        const ptoTimeUsed = parseFloat(elements.ptoTimeSpan.textContent) || 0;
        const personalTimeUsed = parseFloat(elements.personalTimeSpan.textContent) || 0;
        const holidayHoursUsed = parseFloat(elements.holidayTimeSpan.textContent) || 0;

        if (ptoTimeUsed === 0 && personalTimeUsed === 0 && holidayHoursUsed === 0) {
            alert('Nothing to change');
            return;
        }

        if (totalTimeWithPto > 40 && (ptoTimeUsed > 0 || personalTimeUsed > 0 || holidayHoursUsed > 0)) {
            alert('Total hours including PTO, Personal time, or Holiday time cannot exceed 40 hours.');
            return;
        }

        try {
            await updatePtoHours();
            await updatePersonalHours();
            alert('Updates successful! The page will now refresh.');
            location.reload();
        } catch (error) {
            alert('Failed to update data. ' + error.message);
        }
    });

    // Initialize form with today's date
    async function initializeForm() {
        console.log('Initializing form...');
        const today = new Date();
        adjustToWednesday(today);
        elements.weekEndingInput.value = today.toISOString().split('T')[0];
        handleWeekEndingChange();
    }

    initializeForm();

    // Capture screenshot and patch to Airtable
    async function captureScreenshotAndPatch() {
        console.log('Capturing screenshot and patching to Airtable...');
        html2canvas(document.getElementById('time-entry-form')).then(canvas => {
            canvas.toBlob(async blob => {
                const fileUrl = URL.createObjectURL(blob);
                console.log('File URL:', fileUrl);

                const formData = new FormData();
                formData.append('file', blob, 'screenshot.png');

                const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}`;
                console.log('Endpoint for patch:', endpoint);

                try {
                    const response = await fetch(endpoint, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            records: [{
                                id: 'recYourRecordId', // Replace with the actual record ID you want to update
                                fields: {
                                    "Screenshot": [
                                        { "url": fileUrl }
                                    ]
                                }
                            }]
                        })
                    });

                    if (!response.ok) throw new Error(`Failed to patch data: ${response.statusText}`);
                    const data = await response.json();
                    console.log('Success:', data);
                    alert('Screenshot patched to Airtable successfully!');
                } catch (error) {
                    console.error('Error patching screenshot to Airtable:', error);
                    alert('Error patching screenshot to Airtable.');
                }
            });
        });
    }

    elements.submitButton.addEventListener('click', (event) => {
        event.preventDefault();
        captureScreenshotAndPatch();
    });

    // Handle arrow keys navigation in time inputs
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

    // Update total PTO and holiday hours
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

        console.log('Total PTO hours:', totalPtoHours);
        console.log('Total Holiday hours:', totalHolidayHours);
        console.log('Total Personal hours:', totalPersonalHours);

        elements.ptoTimeSpan.textContent = totalPtoHours.toFixed(2);
        elements.holidayTimeSpan.textContent = totalHolidayHours.toFixed(2);
        elements.personalTimeSpan.textContent = totalPersonalHours.toFixed(2);
        document.getElementById('total-personal-time-display').textContent = ` ${totalPersonalHours.toFixed(2)} `;

        elements.remainingPtoHoursElement.textContent = (availablePTOHours - totalPtoHours).toFixed(2);
        elements.remainingPersonalHoursElement.textContent = (availablePersonalHours - totalPersonalHours).toFixed(2);
    }

    // Hide PTO hours display and personal time display if input is provided
    function hidePtoHoursDisplay() {
        elements.ptoHoursDisplay.style.display = 'none';
        elements.personalTimeDisplay.style.display = 'none';
    }

    // Toggle display based on input in number fields
    function toggleDisplay() {
        console.log('Toggling display based on input values...');
        const ptoInputs = document.querySelectorAll('input[name^="PTO_hours"]');
        const personalInputs = document.querySelectorAll('input[name^="Personal_hours"]');

        let ptoValue = 0;
        ptoInputs.forEach(input => ptoValue += parseFloat(input.value) || 0);
        let personalValue = 0;
        personalInputs.forEach(input => personalValue += parseFloat(input.value) || 0);

        if (ptoValue > 0) {
            elements.ptoHoursDisplay.style.display = 'none';
        } else {
            elements.ptoHoursDisplay.style.display = 'block';
        }

        if (personalValue > 0) {
            elements.personalTimeDisplay.style.display = 'none';
        } else {
            elements.personalTimeDisplay.style.display = 'block';
        }
    }

    // Attach input event listeners to number fields in the table
    const ptoNumberInputs = document.querySelectorAll('input[name^="PTO_hours"]');
    ptoNumberInputs.forEach(input => input.addEventListener('input', toggleDisplay));

    const personalNumberInputs = document.querySelectorAll('input[name^="Personal_hours"]');
    personalNumberInputs.forEach(input => input.addEventListener('input', toggleDisplay));

    // Initialize display based on current input values
    toggleDisplay();

    // Initialize time dropdowns
    function initializeTimeDropdowns() {
        const timeDropdowns = document.querySelectorAll('select.time-dropdown');
        timeDropdowns.forEach(dropdown => {
            for (let hour = 0; hour < 24; hour++) {
                ['00', '15', '30', '45'].forEach(minute => {
                    const option = document.createElement('option');
                    option.value = `${String(hour).padStart(2, '0')}:${minute}`;
                    option.text = `${String(hour).padStart(2, '0')}:${minute}`;
                    dropdown.appendChild(option);
                });
            }
        });
    }

    // Initialize keyboard navigation
    function initializeKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            if (!event.shiftKey) return;

            const { key } = event;
            const activeElement = document.activeElement;

            if (activeElement.tagName.toLowerCase() === 'select' || activeElement.tagName.toLowerCase() === 'input') {
                const inputs = Array.from(document.querySelectorAll('select.time-dropdown, input[type="number"], input[type="checkbox"]'));
                let currentIndex = inputs.indexOf(activeElement);

                if (key === 'ArrowRight') {
                    currentIndex = (currentIndex + 1) % inputs.length;
                } else if (key === 'ArrowLeft') {
                    currentIndex = (currentIndex - 1 + inputs.length) % inputs.length;
                } else if (key === 'ArrowDown') {
                    currentIndex = (currentIndex + 6) % inputs.length;
                } else if (key === 'ArrowUp') {
                    currentIndex = (currentIndex - 6 + inputs.length) % inputs.length;
                }

                inputs[currentIndex].focus();
                event.preventDefault();
            }
        });
    }
});
