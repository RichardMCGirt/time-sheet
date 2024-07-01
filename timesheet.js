document.addEventListener("DOMContentLoaded", async function() {
    const baseId = 'appMq9W12jZyCJeXe';
    const tableId = 'tblhTl5q7sEFDv66Z';
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
    let userEmail = localStorage.getItem('userEmail') || ''; // Fetch userEmail from localStorage

    // DOM elements
    const ptoHoursElement = document.getElementById('pto-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const timeEntryForm = document.getElementById('time-entry-form');
    const ptoTimeInput = document.getElementById('pto-time');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const totalTimeWithPtoSpan = document.getElementById('total-time-with-pto-value');
    const ptoValidationMessage = document.getElementById('pto-validation-message');
    const timeEntryBody = document.getElementById('time-entry-body');

    let debounceTimer;

    // Event listeners
    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });
    ptoTimeInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });

    // Fetch user's email from Airtable and update logout link
    await fetchUserEmailFromAirtable();

    async function fetchUserEmailFromAirtable() {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({email}='${userEmail}')`;

        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data from Airtable');
            }

            const data = await response.json();
            if (data.records.length > 0) {
                const userRecord = data.records[0].fields;
                userEmail = userRecord['email']; // Update userEmail with fetched email
                updateLogoutLink(userEmail);
                document.getElementById('pto-hours').textContent = userRecord['PTO Available'];
                ptoTimeInput.value = userRecord['PTO Hours'] || 0; // Fetch and set PTO Hours
            } else {
                throw new Error('No user record found');
            }
        } catch (error) {
            console.error('Error fetching user email:', error);
            userEmail = 'user@example.com'; // Fallback email
            updateLogoutLink(userEmail);
            ptoHoursElement.textContent = 'Error fetching PTO';
        }
    }

    function updateLogoutLink(email) {
        const logoutLink = document.getElementById('logout-link');
        logoutLink.textContent = `Logout ${email}`;
        logoutLink.href = "#";
        logoutLink.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('userEmail');
            sessionStorage.removeItem('user');
            window.location.href = 'index.html'; // Redirect to the login page
        });
    }

    async function handleWeekEndingChange() {
        const selectedDate = new Date(weekEndingInput.value);
        adjustToWednesday(selectedDate);
        weekEndingInput.value = selectedDate.toISOString().split('T')[0];

        const date7 = new Date(selectedDate);
        date7.setDate(selectedDate.getDate() + 6);
        timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];

        populateWeekDates(selectedDate);
        await fetchPtoHours(selectedDate);
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
            inputField.disabled = !isEnabled(currentDate); // Disable based on isEnabled function

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
        // Implement logic to check if the date is a valid working day
        // For example, weekends or holidays might be disabled
        // Replace with your business logic
        return date.getDay() !== 0 && date.getDay() !== 6; // Enable all weekdays
    }

    // Function to toggle work inputs based on 'Did not work' checkbox
    window.toggleWorkInputs = function(index, didNotWork) {
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

    // Function to fetch remaining PTO hours from Airtable
    async function fetchPtoHours(weekEndingDate) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({email}='${userEmail}')`;
        
        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            if (data.records.length > 0) {
                const remainingPTO = data.records[0].fields['PTO Available'];
                const ptoHours = data.records[0].fields['PTO Hours'] || 0;
                document.getElementById('pto-hours').textContent = remainingPTO;
                ptoTimeInput.value = ptoHours; // Set PTO Hours in the form
            } else {
                throw new Error('No PTO record found for user');
            }
        } catch (error) {
            console.error('Error fetching remaining PTO:', error);
            document.getElementById('pto-hours').textContent = 'Error fetching PTO';
        }
    }

    // Function to update remaining PTO hours and PTO Hours in Airtable
    async function updatePtoHours(remainingPTO, ptoHours) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}`;

        try {
            const records = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const recordId = records.records[0].id;

            const response = await fetch(`${endpoint}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        'PTO Available': remainingPTO,
                        'PTO Hours': ptoHours
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update PTO hours');
            }

            console.log('PTO hours updated successfully');
        } catch (error) {
            console.error('Error updating PTO hours:', error);
        }
    }

    function calculateTotalTimeWorked() {
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
        // Calculate total hours worked for a given day
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
        // Implement validation logic for PTO hours
        const remainingPTO = parseFloat(ptoHoursElement.textContent);
        const ptoUsed = totalHoursWithPto - parseFloat(totalTimeWorkedSpan.textContent);

        if (ptoUsed > remainingPTO) {
            ptoValidationMessage.textContent = 'PTO hours exceed available balance';
            ptoValidationMessage.style.color = 'red';
        } else {
            ptoValidationMessage.textContent = '';
        }
    }

    // Submit form data
    window.submitTimesheet = async function() {
        const formData = new FormData(timeEntryForm);

        const entries = Array.from(formData.entries());
        const timeEntries = [];
        let weekEndingDate = null;

        entries.forEach(entry => {
            const [key, value] = entry;
            if (key.startsWith('date')) {
                if (!weekEndingDate) {
                    weekEndingDate = new Date(value);
                }
                timeEntries.push({ [key]: value });
            } else {
                timeEntries[timeEntries.length - 1][key] = value;
            }
        });

        const ptoTime = parseFloat(ptoTimeInput.value) || 0;

        const totalHoursWithPto = parseFloat(totalTimeWithPtoSpan.textContent);

        if (ptoTime > totalHoursWithPto) {
            alert('PTO hours cannot exceed total hours worked with PTO');
            return;
        }

        try {
            // Call function to update PTO hours in Airtable
            await updatePtoHours(ptoHoursElement.textContent, ptoTime);

            // You can handle form submission here, e.g., sending data to server or Airtable
            console.log('Form data submitted:', timeEntries);
            alert('Form data submitted successfully!');
        } catch (error) {
            console.error('Error submitting form data:', error);
            alert('Failed to submit form data.');
        }
    };

    // Initialize the form on page load
    async function initializeForm() {
        const today = new Date();
        adjustToWednesday(today);
        weekEndingInput.value = today.toISOString().split('T')[0];
        handleWeekEndingChange(); // Trigger initial population based on today's date
    }

    initializeForm();
});
