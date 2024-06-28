document.addEventListener("DOMContentLoaded", function () {
    const baseId = 'appMq9W12jZyCJeXe';
    const tableId = 'tbl2b7fgvkU4GL4jI';
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
    const ptoHoursElement = document.getElementById('pto-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const timeEntryForm = document.getElementById('time-entry-form');
    const ptoTimeInput = document.getElementById('pto-time');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const totalTimeWithPtoSpan = document.getElementById('total-time-with-pto-value');
    const ptoValidationMessage = document.getElementById('pto-validation-message');
    const timeEntryBody = document.getElementById('time-entry-body');

    // Event listeners
    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('input', calculateTotalTimeWorked);
    ptoTimeInput.addEventListener('input', calculateTotalTimeWorked);
    timeEntryForm.addEventListener('submit', handleSubmit);

    // Handle week ending date change
    function handleWeekEndingChange() {
        const selectedDate = new Date(weekEndingInput.value);
        const dayOfWeek = selectedDate.getDay(); // 0 (Sunday) to 6 (Saturday), 2 is Wednesday

        if (dayOfWeek !== 2) {
            alert('Please select a Wednesday for Week Ending.');
            weekEndingInput.value = ''; // Reset the value
        } else {
            populateWeekDates();
            fetchPtoHours();
        }
    }

    // Populate week dates based on selected week ending date
    function populateWeekDates() {
        const weekEndingDate = new Date(weekEndingInput.value);
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5'];

        daysOfWeek.forEach((day, index) => {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(weekEndingDate.getDate() - (6 - index));
            const formattedDate = currentDate.toISOString().split('T')[0];
            timeEntryForm.elements[day].value = formattedDate;
        });
    }

    // Fetch remaining PTO hours from API
    async function fetchPtoHours() {
        const weekEnding = weekEndingInput.value;
        if (!weekEnding) return;

        const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={WeekEnding}="${weekEnding}"`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch PTO hours');
            }

            const data = await response.json();
            const ptoHours = data.records.length > 0 ? data.records[0].fields['PTO Time'] || 0 : 0; // Adjusted to access 'PTO Time' field
            ptoHoursElement.textContent = `${ptoHours} hours`;
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            ptoHoursElement.textContent = '0 hours';
        }
    }

    // Calculate hours worked for a specific day
    function calculateHoursWorked(dayIndex) {
        const startTime = timeEntryForm.elements[`start_time${dayIndex}`].value;
        const endTime = timeEntryForm.elements[`end_time${dayIndex}`].value;
        const lunchStart = timeEntryForm.elements[`lunch_start${dayIndex}`].value;
        const lunchEnd = timeEntryForm.elements[`lunch_end${dayIndex}`].value;

        let hoursWorked = 0;

        if (startTime && endTime) {
            const start = new Date(`1970-01-01T${startTime}Z`);
            const end = new Date(`1970-01-01T${endTime}Z`);
            let workedHours = (end - start) / (1000 * 60 * 60); // Difference in hours

            if (lunchStart && lunchEnd) {
                const lunchStartObj = new Date(`1970-01-01T${lunchStart}Z`);
                const lunchEndObj = new Date(`1970-01-01T${lunchEnd}Z`);
                const lunchHours = (lunchEndObj - lunchStartObj) / (1000 * 60 * 60); // Lunch break hours
                workedHours -= lunchHours; // Subtract lunch break hours
            }

            hoursWorked = workedHours.toFixed(2); // Round to 2 decimal places
        }

        return hoursWorked;
    }

    // Calculate total time worked and update UI
    function calculateTotalTimeWorked() {
        let totalWorkedHours = 0;

        for (let i = 1; i <= 7; i++) {
            const hoursWorked = parseFloat(calculateHoursWorked(i)) || 0;
            document.getElementById(`hours-worked-today${i}`).textContent = hoursWorked.toFixed(2);
            totalWorkedHours += hoursWorked;
        }

        document.getElementById('total-time-worked').textContent = totalWorkedHours.toFixed(2);
        calculateTotalTimeWithPto(totalWorkedHours);
    }

    // Calculate total time with PTO and update UI
    function calculateTotalTimeWithPto(totalWorkedHours) {
        const ptoHours = parseFloat(ptoTimeInput.value) || 0;
        const totalTimeWithPto = totalWorkedHours + ptoHours;
        totalTimeWithPtoSpan.textContent = totalTimeWithPto.toFixed(2);
    }

    function addRow() {
        const tbody = document.getElementById('time-entry-body');
        const rowCount = tbody.rows.length + 1; // Calculate the next index for new row
    
        if (rowCount <= 7) { // Limit to adding up to 7 rows
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="date" name="date${rowCount}" onchange="calculateHoursWorked(${rowCount}); calculateTotalTimeWorked()"></td>
                <td><input type="time" name="start_time${rowCount}" step="1800" onchange="calculateHoursWorked(${rowCount}); calculateTotalTimeWorked()"></td>
                <td><input type="time" name="lunch_start${rowCount}" step="1800" onchange="calculateHoursWorked(${rowCount}); calculateTotalTimeWorked()"></td>
                <td><input type="time" name="lunch_end${rowCount}" step="1800" onchange="calculateHoursWorked(${rowCount}); calculateTotalTimeWorked()"></td>
                <td><input type="time" name="end_time${rowCount}" step="1800" onchange="calculateHoursWorked(${rowCount}); calculateTotalTimeWorked()"></td>
                <td><span id="hours-worked-today${rowCount}">0</span></td>
                <td><button type="button" class="delete-button" onclick="deleteRow(this)">Delete</button></td>
            `;
            tbody.appendChild(newRow);
        } else {
            alert('Maximum limit of rows reached (7 rows).');
        }
    }
    
    
    function deleteRow(button) {
        const row = button.parentNode.parentNode;
        const tbody = row.parentNode;
        tbody.removeChild(row);
    
        calculateTotalTimeWorked();
    }
    
    // Example function to calculate hours worked and total time worked
function calculateHoursWorked(rowNumber) {
    // Logic to calculate hours worked for a specific row
}

function calculateTotalTimeWorked() {
    // Logic to calculate total time worked across all rows
}

    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        await submitTimesheet();
    }

    // Submit timesheet data to Airtable
    async function submitTimesheet() {
        const formData = new FormData(timeEntryForm);
        const records = [];

        // Loop through each row (assuming up to 7 rows based on your HTML)
        for (let i = 1; i <= 7; i++) {
            const date = formData.get(`date${i}`);
            const startTime = formData.get(`start_time${i}`);
            const lunchStart = formData.get(`lunch_start${i}`);
            const lunchEnd = formData.get(`lunch_end${i}`);
            const endTime = formData.get(`end_time${i}`);
            const hoursWorked = document.getElementById(`hours-worked-today${i}`).textContent; // Get hours worked from span

            // Create record object for Airtable
            const record = {
                "Week Ending": formData.get('week_ending'), // Assuming week_ending is an input field in the form
                "Date": date,
                "Start Time": startTime,
                "Lunch Start": lunchStart,
                "Lunch End": lunchEnd,
                "End Time": endTime,
                "Hours Worked": hoursWorked,
                "PTO Time Used": ptoTimeInput.value // New field for PTO Time Used
            };

            records.push(record);
        }

        try {
            const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ records })
            });

            if (!response.ok) {
                throw new Error('Failed to submit timesheet data');
            }

            const data = await response.json();
            console.log('Timesheet submitted successfully:', data);

            // Clear form and update UI
            clearForm();
        } catch (error) {
            console.error('Error submitting timesheet data:', error);
            alert('Failed to submit timesheet data. Please try again.');
        }
    }

    // Clear the form after submission
    function clearForm() {
        timeEntryForm.reset();
        totalTimeWorkedSpan.textContent = '0.00';
        totalTimeWithPtoSpan.textContent = '0.00';
        ptoTimeInput.value = '0';
        ptoValidationMessage.style.display = 'none';

        // Clear hours worked spans
        for (let i = 1; i <= 7; i++) {
            document.getElementById(`hours-worked-today${i}`).textContent = '0';
        }
    }

    // Initialize on page load
    async function initialize() {
        try {
            await fetchPtoHours();
        } catch (error) {
            console.error('Error initializing:', error);
            alert('Failed to initialize. Please refresh the page.');
        }
    }

    initialize();
});
