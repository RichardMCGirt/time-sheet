document.addEventListener("DOMContentLoaded", async function() {
    console.log('DOM fully loaded and parsed');

    initializeTimeDropdowns();
    initializeKeyboardNavigation();

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
    elements.resetButton.addEventListener('click', resetForm);
    elements.submitButton.addEventListener('click', handleSubmit);

    const timeInputs = document.querySelectorAll('input[type="time"]');
    const numberInputs = document.querySelectorAll('input[type="number"]');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

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

        checkboxes.forEach(input => {
            if (input.checked) {
                showResetButton = true;
            }
        });

        elements.resetButton.style.display = showResetButton ? 'block' : 'none';
    }

    // Add event listeners to all time, number, and checkbox inputs
    timeInputs.forEach(input => {
        input.addEventListener('input', checkInputs);
    });

    numberInputs.forEach(input => {
        input.addEventListener('input', checkInputs);
    });

    checkboxes.forEach(input => {
        input.addEventListener('change', checkInputs);
    });

    // Initial check to set the reset button state correctly on page load
    checkInputs();

    await fetchPtoHours();
    await fetchPersonalTime();
    await fetchPersonalEndDate(); // Fetch the personal end date

    loadFormData();

    function handleHolidayHoursChange() {
        console.log('Handling Holiday hours change...');
        calculateTotalTimeWorked();
        saveFormData();
    }

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
        saveFormData();
    }

    function adjustToWednesday(date) {
        const dayOfWeek = date.getDay();
        const offset = (2 - dayOfWeek + 7) % 7;
        date.setDate(date.getDate() + offset);
    }

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
        saveFormData();
    }


    
    function startCountdown(endDate) {
        const endDateTime = new Date(endDate).getTime();
        const countdownElement = document.getElementById('countdown');
    
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = endDateTime - now;
    
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
            countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
            if (distance < 0) {
                clearInterval(interval);
                countdownElement.innerHTML = "EXPIRED";
            }
        };
    
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000); // Set interval to 1 second
    }

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
                availablePTOHours = record['PTO Hours'] || 0;
                recordId = data.records[0].id; // Save the record ID
                elements.ptoHoursDisplay.textContent = availablePTOHours.toFixed(2);
                elements.remainingPtoHoursElement.textContent = availablePTOHours.toFixed(2); // Set initial remaining PTO hours
                console.log('Available PTO hours:', availablePTOHours);
                saveFormData();
            } else {
                console.log('No PTO hours data found for user');
            }
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            alert('Failed to fetch PTO hours. Error: ' + error.message);
        }
    }

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
                availablePersonalHours = record['Personaltime'] || 0;
                recordId = data.records[0].id; // Save the record ID
                elements.personalTimeDisplay.textContent = availablePersonalHours.toFixed(2);
                elements.remainingPersonalHoursElement.textContent = availablePersonalHours.toFixed(2); // Set initial remaining Personal hours
                console.log('Available Personal hours:', availablePersonalHours);
                saveFormData();
            } else {
                console.log('No Personal hours data found for user');
            }
        } catch (error) {
            console.error('Error fetching Personal hours:', error);
            alert('Failed to fetch Personal hours. Error: ' + error.message);
        }
    }

    function toggleWorkInputs(index, didNotWork) {
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
        saveFormData();
    }

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
        validatePtoHours(totalHoursWorked, ptoTime, personalTime);
        updateTotalPtoAndHolidayHours();
        saveFormData();
    }

    function calculateDailyHoursWorked(dateInput, startTimeInput, lunchStartInput, lunchEndInput, endTimeInput, additionalTimeInInput, additionalTimeOutInput) {
        const startDate = new Date(dateInput.value);
        const times = [startTimeInput, lunchStartInput, lunchEndInput, endTimeInput, additionalTimeInInput, additionalTimeOutInput].map(input => parseTime(input.value));
        const [startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut] = times;
        let hoursWorked = calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut);
        return roundToClosestQuarterHour(hoursWorked);
    }

    function parseTime(timeString) {
        if (!timeString || timeString === "--:--") return null;
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return { hours, minutes };
    }

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

    function roundToClosestQuarterHour(hours) {
        return Math.round(hours * 4) / 4;
    }

    const ptoTimeInput = document.getElementById('pto-time');
    const ptoHoursDisplay = document.getElementById('pto-hours-display');

    // Check if the PTO time input value is greater than the allowed PTO hours
    function validatePtoTimeInput() {
        const ptoTimeValue = parseFloat(ptoTimeInput.textContent) || 0;
        const maxPtoHours = parseFloat(ptoHoursDisplay.textContent) || 0;
        
        if (ptoTimeValue > maxPtoHours) {
            ptoTimeInput.textContent = maxPtoHours.toFixed(2);
            alert(`PTO time cannot exceed ${maxPtoHours.toFixed(2)} hours`);
        }
    }

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

        console.log('Total PTO hours:', totalPtoHours);
        console.log('Total Holiday hours:', totalHolidayHours);
        console.log('Total Personal hours:', totalPersonalHours);

        elements.ptoTimeSpan.textContent = totalPtoHours.toFixed(2);
        elements.holidayTimeSpan.textContent = totalHolidayHours.toFixed(2);
        elements.personalTimeSpan.textContent = totalPersonalHours.toFixed(2);
        document.getElementById('total-personal-time-display').textContent = totalPersonalHours.toFixed(2);

        elements.remainingPtoHoursElement.textContent = Math.max(0, availablePTOHours - totalPtoHours).toFixed(2);
        elements.remainingPersonalHoursElement.textContent = Math.max(0, availablePersonalHours - totalPersonalHours).toFixed(2);
        const totalTimeWithPto = totalPtoHours + totalHolidayHours + totalPersonalHours + parseFloat(elements.totalTimeWorkedSpan.textContent);
        elements.totalTimeWithPtoSpan.textContent = totalTimeWithPto.toFixed(2);
    }

    async function updatePtoHours() {
        console.log('Updating PTO hours...');
        const usedPtoHoursValue = parseFloat(elements.ptoTimeSpan.textContent) || 0;
        const newPtoHoursValue = Math.max(0, availablePTOHours - usedPtoHoursValue);
        console.log('Used PTO hours value:', usedPtoHoursValue);
        console.log('New PTO hours value:', newPtoHoursValue);

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        console.log('Endpoint for update:', endpoint);

        try {
            const updateResponse = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: { 'PTO Time Used': newPtoHoursValue } })
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

    async function handleSubmit(event) {
        event.preventDefault();
        console.log('Submitting form...');
        const totalPtoHours = parseFloat(elements.ptoTimeSpan.textContent) || 0;
        const totalPersonalHours = parseFloat(elements.personalTimeSpan.textContent) || 0;

        if (totalPtoHours > availablePTOHours) {
            alert('PTO time used cannot exceed available PTO hours');
            return;
        }

        if (totalPersonalHours > availablePersonalHours) {
            alert('Personal time used cannot exceed available Personal hours');
            return;
        }

        try {
            await updatePtoHours();
            await updatePersonalHours();
            await sendDataToAirtable();
            alert('Submission successful!');
            clearForm();
        } catch (error) {
            alert(`Submission failed: ${error.message}`);
        }
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

        const data = {
            "date7": date7 || '0',
            "PTO Time Used": parseFloat(totalPtoHours) || 0,
            "Personal Time Used": parseFloat(totalPersonalHours) || 0,
            "Holiday Hours Used": parseFloat(totalHolidayHours) || 0,
            "Total Hours Worked": parseFloat(elements.totalTimeWorkedSpan.textContent) || 0,
            "Total Time with PTO": parseFloat(elements.totalTimeWithPtoSpan.textContent) || 0
        };

        console.log('Data to be sent:', data);

        try {
            const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: data })
            });

            const result = await response.json();

            console.log('Fetch response:', response);
            console.log('Result:', result);

            if (!response.ok) {
                throw new Error(result.error?.message || 'Failed to update Airtable');
            }

            console.log('Success:', result);
        } catch (error) {
            console.error('Error:', error);
            throw new Error(`Error: ${error.message}`);
        }
    }

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
        localStorage.removeItem('formData'); // Clear form data from localStorage
        window.location.reload(); // Refresh the screen
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

    async function initializeForm() {
        console.log('Initializing form...');
        const today = new Date();
        adjustToWednesday(today);
        elements.weekEndingInput.value = today.toISOString().split('T')[0];
        handleWeekEndingChange();
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
    initializeKeyboardNavigation();

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

    function manageBackgroundSound() {
        const soundUrl = '9 to 5 - Dolly Parton'; // Replace 'your-folder/sound-file.mp3' with the actual path
        let audio = new Audio(soundUrl);

        function playSound() {
            audio.loop = true;
            audio.play().catch(error => console.log('Error playing audio:', error));
        }

        if (localStorage.getItem('soundPlaying') === 'true') {
            playSound();
        }

        window.addEventListener('beforeunload', () => {
            if (!audio.paused) {
                localStorage.setItem('soundPlaying', 'true');
            } else {
                localStorage.removeItem('soundPlaying');
            }
        });

        window.addEventListener('DOMContentLoaded', () => {
            if (localStorage.getItem('soundPlaying') === 'true') {
                playSound();
            }
        });
    }

    manageBackgroundSound();

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
        const formData = new FormData(elements.timeEntryForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        localStorage.setItem('formData', JSON.stringify(data));
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
            calculateTotalTimeWorked(); // Recalculate totals after loading data
        }
    }
});