document.addEventListener("DOMContentLoaded", async function() {
    const baseId = 'appMq9W12jZyCJeXe';
    const tableId = 'tblhTl5q7sEFDv66Z';
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
    const userEmail = localStorage.getItem('userEmail') || '';

    // DOM elements
    const ptoHoursElement = document.getElementById('pto-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const timeEntryForm = document.getElementById('time-entry-form');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const userEmailElement = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');

    let debounceTimer;

    // Display user email next to logout button
    userEmailElement.textContent = `(${userEmail})`;

    // Event listeners
    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });
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
                const ptoHours = data.records[0].fields['PTO Hours'] || 0;
                ptoHoursElement.textContent = ptoHours.toFixed(2);
            } else {
                throw new Error('No PTO record found for user');
            }
        } catch (error) {
            console.error('Error fetching remaining PTO:', error);
            ptoHoursElement.textContent = 'Error fetching PTO';
        }
    }

    // Function to handle week ending change
    async function handleWeekEndingChange() {
        const selectedDate = new Date(weekEndingInput.value);
        adjustToWeekEnding(selectedDate);
        weekEndingInput.value = selectedDate.toISOString().split('T')[0];

        const date7 = new Date(selectedDate);
        date7.setDate(selectedDate.getDate() + 6);
        timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];

        populateWeekDates(selectedDate);
    }

    // Function to adjust selected date to the nearest week ending date
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

    // Function to populate week dates in the time entry form
    function populateWeekDates(weekEndingDate) {
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(weekEndingDate.getDate() - (6 - index));
            const inputField = timeEntryForm.elements[day];
            inputField.value = currentDate.toISOString().split('T')[0];
            inputField.disabled = !isEnabled(currentDate);
            inputField.setAttribute('readonly', true);
        });
    }

    // Function to check if a date should be enabled in form (replace with your business logic)
    function isEnabled(date) {
        return date.getDay() !== 0 && date.getDay() !== 6; // Enable all weekdays
    }

    // Function to calculate total time worked and update display
    function calculateTotalTimeWorked() {
        let totalHoursWorked = 0;
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
            hoursWorked = hoursWorked.toFixed(2);
            totalHoursWorked += parseFloat(hoursWorked);
            hoursWorkedSpan.textContent = hoursWorked;
        });

        // Round total hours worked to the nearest 15-minute interval
        totalHoursWorked = roundToNearestQuarterHour(totalHoursWorked);

        // Display total hours worked
        totalTimeWorkedSpan.textContent = totalHoursWorked.toFixed(2);
    }

    // Function to round a number to the nearest 15-minute interval
    function roundToNearestQuarterHour(hours) {
        return Math.round(hours * 4) / 4;
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

        let hoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60);

        // Subtract lunch break if applicable
        if (lunchStart < lunchEnd) {
            const lunchBreak = (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60);
            hoursWorked -= lunchBreak;
        }

        return hoursWorked;
    }

    // Initializations
    if (userEmail) {
        fetchPtoHours(); // Fetch initial PTO hours
        handleWeekEndingChange(); // Initialize week ending date and populate dates
    } else {
        window.location.href = 'index.html'; // Redirect to login page if no user email found
    }
});

window.submitTimesheet = async function() {
    const formData = new FormData(document.getElementById('time-entry-form'));
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
            if (timeEntries.length > 0) {
                timeEntries[timeEntries.length - 1][key] = value;
            }
        }
    });

    try {
        // Convert timeEntries to JSON string
        const timeEntriesJson = JSON.stringify(timeEntries);

        console.log('Form data submitted:', timeEntriesJson);
        alert('Form data submitted successfully!');
    } catch (error) {
        console.error('Error submitting form data:', error);
        alert('Failed to submit form data.');
    }
};
