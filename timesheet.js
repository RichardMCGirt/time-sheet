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

    const apiKey = 'patdCNFzzxpHXs14G.892585ccb188d17d06078c040fedb939583a082a9f7c84ca3063eae2024a998b';
    const baseId = 'appzys5CNiZIV1ihx';
    const tableId = 'tblKBCKzmHgoPClac'; 

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

    // Fetch Approval Status
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
                    approvalStatusElement.textContent = 'Time sheet approved';
                    approvalStatusElement.style.color = 'green';
                    approvalStatusElement.style.fontSize = '30px';
                    approvalStatusElement.style.fontWeight = 'bold';
                    approvalStatusElement.style.textDecoration = 'underline';
                }
                hideApprovalOnEdit(isApproved);
            } else {
                console.log('No approval status data found for user');
            }

            updateLoadingBar('Approval status has been downloaded.');
        } catch (error) {
            console.error('Error fetching approval status:', error);
            alert('Failed to fetch approval status. Error: ' + error.message);
        }
    }

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
        const offset = (1 - dayOfWeek + 7) % 7;
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
                const cell = document.createElement('td');
                cell.appendChild(checkbox);
                inputField.parentElement.parentElement.appendChild(cell);
                console.log('Added checkbox for', day);
            }
        });
        saveFormData();
    }

    function hideApprovalOnEdit(isApproved) {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const approvalStatusElement = document.getElementById('approval-status');
                if (approvalStatusElement.style.color !== 'green') {
                    approvalStatusElement.style.display = 'none';
                }
            });
        });
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
        const interval = setInterval(updateCountdown, 1000);
    }

    function calculateTotalTimeWorked() {
        console.log('Calculating total time worked...');
        let totalHoursWorked = 0;
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const dateInput = elements.timeEntryForm.elements[day];
            const timeFields = ['start_time', 'lunch_start', 'lunch_end', 'end_time', 'Additional_Time_In', 'Additional_Time_Out'].map(field => elements.timeEntryForm.elements[`${field}${index + 1}`]);
            const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);
            let hoursWorked = calculateDailyHoursWorked(dateInput, ...timeFields);
            hoursWorked = roundToClosestQuarterHour(hoursWorked);
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
    
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        console.log('Endpoint for update:', endpoint);
    
        try {
            // Fetch the current PTO value
            const fetchResponse = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!fetchResponse.ok) throw new Error(`Failed to fetch current PTO hours: ${fetchResponse.statusText}`);
    
            const fetchData = await fetchResponse.json();
            const currentPtoHours = parseFloat(fetchData.fields['PTO']) || 0;
    
            // Calculate new PTO value by adding the used PTO hours
            const newPtoHoursValue = currentPtoHours + usedPtoHoursValue;
            console.log('Current PTO hours:', currentPtoHours);
            console.log('Used PTO hours value:', usedPtoHoursValue);
            console.log('New PTO hours value:', newPtoHoursValue);
    
            // Update the PTO field with the new value
            const updateResponse = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: { 'PTO': newPtoHoursValue } })
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
        console.log('User clicked submit. Throwing confetti!');
        
        // Trigger confetti immediately when the user clicks submit
        throwConfetti();
        
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
            showModal(); // Show the success modal after successful submission
        } catch (error) {
            alert(`Submission failed: ${error.message}`);
        }
    }
    
    function throwConfetti() {
        confetti({
            particleCount: 1400,
            spread: 180,
            origin: { y: 0.6 }
        });
    }
    
    function showModal() {
        const modal = document.getElementById('successModal');
        const closeButton = modal.querySelector('.close-button');
        
        // Ensure there is only one countdown element
        let countdownElement = modal.querySelector('.countdown');
        if (!countdownElement) {
            countdownElement = document.createElement('p');
            countdownElement.className = 'countdown';
            modal.querySelector('.modal-content').appendChild(countdownElement);
        }
        
        let countdown = 25;
        
        // Display the modal
        modal.style.display = 'block';
        
        // Start the countdown
        const countdownInterval = setInterval(() => {
            countdown -= 1;
            countdownElement.textContent = `Close in ${countdown} seconds.`;
        
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                modal.style.display = 'none'; // Automatically close the modal
            }
        }, 1000);
        
        // Close the modal when the user clicks the close button
        closeButton.onclick = function() {
            clearInterval(countdownInterval); // Stop the countdown
            modal.style.display = 'none';
        };
        
        // Close the modal when the user clicks anywhere outside of it
        window.onclick = function(event) {
            if (event.target === modal) {
                clearInterval(countdownInterval); // Stop the countdown
                modal.style.display = 'none';
            }
        };
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
                        "PTO": parseFloat(totalPtoHours) || 0,
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

    function shouldPlayMusic() {
        const userEmailElement = document.getElementById('user-email');
        const email = userEmailElement ? userEmailElement.textContent.trim() : '';
        const excludedEmails = [
            'jason.smith@vanirinstalledsales.com',
            'richard.mcgirt@vanirinstalledsales.com',
            'hunter@vanirinstalledsales.com',
            'katy@vanirinstalledsales.com',
            'diana.smith@vanirinstalledsales.com',
            'brittany.godwin@vanirinstalledsales.com',
            'martha.favilabeltran@vanirinstalledsales.com'

        ];
        return !excludedEmails.includes(email);
    }

    const backgroundMusic = document.getElementById('backgroundMusic');
    const playPauseButton = document.getElementById('playPauseButton');

    function updateButtonText() {
        if (backgroundMusic.paused) {
            playPauseButton.textContent = 'Play';
        } else {
            playPauseButton.textContent = 'Pause';
        }
    }

    if (backgroundMusic && playPauseButton && shouldPlayMusic()) {
        backgroundMusic.currentTime = 9;
        backgroundMusic.play();
        updateButtonText();

        playPauseButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (backgroundMusic.paused) {
                backgroundMusic.play();
                updateButtonText();
            } else {
                backgroundMusic.pause();
                updateButtonText();
            }
        });

        backgroundMusic.onplay = function() {
            sessionStorage.setItem('isMusicPlaying', 'true');
        };

        backgroundMusic.onpause = function() {
            sessionStorage.setItem('isMusicPlaying', 'false');
            updateButtonText();
        };
    } else {
        if (playPauseButton) {
            playPauseButton.style.display = 'none';
        }
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
        const formData = new FormData(elements.timeEntryForm);
        const data = {};
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
