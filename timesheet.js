document.addEventListener("DOMContentLoaded", async function() {
    const baseId = 'appMq9W12jZyCJeXe';
    const tableId = 'tblhTl5q7sEFDv66Z';
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
    const userEmail = localStorage.getItem('userEmail') || ''; // Fetch userEmail from localStorage

    // DOM elements
    const ptoHoursElement = document.getElementById('pto-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const timeEntryForm = document.getElementById('time-entry-form');
    const ptoTimeInput = document.getElementById('pto-time');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const totalTimeWithPtoSpan = document.getElementById('total-time-with-pto-value');
    const ptoValidationMessage = document.getElementById('pto-validation-message');
    const timeEntryBody = document.getElementById('time-entry-body');
    const userEmailElement = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');

    const ptoTimeUsedElement = document.getElementById('pto-time'); // Update to use the span element
    const remainingPtoCalculationDiv = document.getElementById('remaining-pto-calculation'); // New div for calculation
    const remainingPtoHoursSpan = document.getElementById('remaining-pto-hours'); // New span for remaining PTO hours

    let debounceTimer;

    // Display user email next to logout button
    userEmailElement.textContent = `(${userEmail})`;

    // Event listeners
    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });
    ptoTimeInput.addEventListener('input', validatePtoTimeInput);
    ptoTimeInput.addEventListener('change', validatePtoTimeInput);
    logoutButton.addEventListener('click', handleLogout);

    // Function to handle logout
    function handleLogout(event) {
        event.preventDefault();
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html'; // Redirect to login page
    }

    // Function to fetch remaining PTO hours from Airtable
    async function fetchPtoHours() {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({email}='${userEmail}')`;
        console.log(`Fetching PTO hours from: ${endpoint}`); // Log the endpoint

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
            console.log('Data fetched from Airtable:', data); // Log the fetched data

            if (data.records.length > 0) {
                const remainingPTO = data.records[0].fields['PTO Available'];
                const ptoHours = data.records[0].fields['PTO Hours'] || 0;
                ptoHoursElement.textContent = remainingPTO;
                ptoTimeUsedElement.textContent = ptoHours.toFixed(2); // Update the span with PTO Hours

                // Update remaining PTO hours span
                remainingPtoHoursSpan.textContent = remainingPTO;

                // Calculate and update remaining PTO calculation
                const remainingPtoCalculation = remainingPTO - ptoHours;
                remainingPtoCalculationDiv.textContent = remainingPtoCalculation.toFixed(2);
            } else {
                throw new Error('No PTO record found for user');
            }
        } catch (error) {
            console.error('Error fetching remaining PTO:', error);
            ptoHoursElement.textContent = 'Error fetching PTO';
            ptoTimeUsedElement.textContent = 'Error fetching PTO'; // Handle error case for PTO time used span

            // Update remaining PTO calculation in case of error
            remainingPtoHoursSpan.textContent = 'Error fetching PTO';
            remainingPtoCalculationDiv.textContent = 'Error fetching PTO';
        }
    }

    async function handleWeekEndingChange() {
        const selectedDate = new Date(weekEndingInput.value);
        adjustToWeekEnding(selectedDate);
        weekEndingInput.value = selectedDate.toISOString().split('T')[0];

        const date7 = new Date(selectedDate);
        date7.setDate(selectedDate.getDate() + 6);
        timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];

        populateWeekDates(selectedDate);
    }

    function adjustToWeekEnding(date) {
        let dayOfWeek = date.getDay();
        if (dayOfWeek >= 0 && dayOfWeek <= 2) { // Sunday to Wednesday
            const offset = 2 - dayOfWeek;
            date.setDate(date.getDate() + offset);
        } else { // Thursday to Saturday
            const offset = dayOfWeek - 3;
            date.setDate(date.getDate() - offset);
        }
    }

    function populateWeekDates(weekEndingDate) {
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(weekEndingDate.getDate() - (6 - index));
            const inputField = timeEntryForm.elements[day];
            inputField.value = currentDate.toISOString().split('T')[0];
            inputField.disabled = !isEnabled(currentDate); // Disable based on isEnabled function
            inputField.setAttribute('readonly', true); // Make input readonly
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

    // Function to validate PTO time input
    function validatePtoTimeInput() {
        const ptoTime = parseFloat(ptoTimeInput.textContent); // Use textContent for span

        if (isNaN(ptoTime) || ptoTime < 0 || ptoTime > 40 || !Number.isInteger(ptoTime)) {
            ptoValidationMessage.textContent = 'PTO hours used must be a positive whole number not greater than 40';
            ptoValidationMessage.style.color = 'red';
            ptoTimeInput.textContent = '0'; // Reset to default value if invalid
        } else {
            ptoValidationMessage.textContent = '';
            ptoTimeInput.textContent = ptoTime.toFixed(0); // Round to whole number
            calculateTotalTimeWorked();
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
    
            // Calculate total hours worked with PTO
            let hoursWithPto = hoursWorked - parseFloat(ptoTimeInput.textContent); // Use textContent for span
            hoursWithPto = Math.max(hoursWithPto, 0); // Ensure it's not negative
            totalHoursWithPto += parseFloat(hoursWithPto.toFixed(2));
        });
    
        // Round total hours worked to the nearest 15-minute interval
        totalHoursWorked = roundToNearestQuarterHour(totalHoursWorked);
    
        // Display total hours worked
        totalTimeWorkedSpan.textContent = totalHoursWorked.toFixed(2);
        totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);
    }
    
    // Function to round a number to the nearest 15-minute interval
    function roundToNearestQuarterHour(hours) {
        const quarter = 0.25;
        return Math.round(hours / quarter) * quarter;
    }
    
    // Helper function to parse time string to decimal hours
    function parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    }
    
    // Helper function to calculate hours worked in a day
    function calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(Math.floor(startTime), (startTime % 1) * 60, 0, 0);
    
        const lunchStartDateTime = new Date(startDate);
        lunchStartDateTime.setHours(Math.floor(lunchStart), (lunchStart % 1) * 60, 0, 0);
    
        const lunchEndDateTime = new Date(startDate);
        lunchEndDateTime.setHours(Math.floor(lunchEnd), (lunchEnd % 1) * 60, 0, 0);
    
        const endDateTime = new Date(startDate);
        endDateTime.setHours(Math.floor(endTime), (endTime % 1) * 60, 0, 0);
    
        let hoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60); // Convert milliseconds to hours
        const lunchBreak = (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60); // Convert milliseconds to hours
    
        // Deduct lunch break time from total hours worked
        hoursWorked -= lunchBreak;
    
        return hoursWorked;
    }

    // Initial setup
    fetchPtoHours();
    const currentWeekEnding = new Date();
    adjustToWeekEnding(currentWeekEnding);
    weekEndingInput.value = currentWeekEnding.toISOString().split('T')[0];
    populateWeekDates(currentWeekEnding);
    calculateTotalTimeWorked();
});
