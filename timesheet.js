document.addEventListener("DOMContentLoaded", function() {
    const baseId = 'appMq9W12jZyCJeXe'; 
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde'; 
    const tableId = 'tbl2b7fgvkU4GL4jI'; // Extracted table ID

    // Function to populate dates when week ending date changes
    function populateWeekDates() {
        const weekEndingDate = new Date(document.getElementById('week-ending').value);
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(weekEndingDate.getDate() - (6 - i)); // Adjust to previous days of the week

            const formattedDate = currentDate.toISOString().split('T')[0]; // Format as yyyy-mm-dd
            document.querySelector(`input[name="${daysOfWeek[i]}"]`).value = formattedDate;
        }
    }

    // Function to fetch remaining PTO hours
    async function fetchPtoHours() {
        const weekEnding = document.getElementById('week-ending').value;
        if (!weekEnding) return;

        const url = `https://api.airtable.com/v0/${baseId}/TimeSheets?filterByFormula={WeekEnding}="${weekEnding}"`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const data = await response.json();

            if (data.records.length > 0) {
                const ptoHours = data.records[0].fields.PTOTime || 0;
                document.getElementById('pto-hours').textContent = `${ptoHours} hours`;
            } else {
                document.getElementById('pto-hours').textContent = '0 hours';
            }
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            document.getElementById('pto-hours').textContent = '0 hours';
        }
    }

    // Function to update dates and times based on Week Ending Date
    function updateDatesAndTimes() {
        const weekEndingDate = document.getElementById('week-ending').value;

        if (weekEndingDate) {
            const weekEnding = new Date(weekEndingDate);
            const daysOfWeek = ['date', 'start_time', 'lunch_start', 'lunch_end', 'end_time'];

            for (let i = 1; i <= 7; i++) {
                const currentDate = new Date(weekEnding);
                currentDate.setDate(weekEnding.getDate() - (7 - i)); // Adjust to previous days of the week

                const formattedDate = currentDate.toISOString().split('T')[0]; // Format as yyyy-mm-dd
                document.querySelector(`input[name="date${i}"]`).value = formattedDate;
            }
        }
    }

    // Event listener for Week Ending Date change
    document.getElementById('week-ending').addEventListener('change', () => {
        populateWeekDates();
        fetchPtoHours();
        updateDatesAndTimes();
    });

    // Function to calculate hours worked for a specific day
    function calculateHoursWorked(dayIndex) {
        const startTime = document.querySelector(`input[name="start_time${dayIndex}"]`).value;
        const lunchStart = document.querySelector(`input[name="lunch_start${dayIndex}"]`).value;
        const lunchEnd = document.querySelector(`input[name="lunch_end${dayIndex}"]`).value;
        const endTime = document.querySelector(`input[name="end_time${dayIndex}"]`).value;

        // Calculate hours worked logic
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

        document.querySelector(`#time-entry-body input[name="hours_worked_today${dayIndex}"]`).value = hoursWorked;
        calculateTotalTimeWorked();
    }

    // Function to calculate total time worked
    function calculateTotalTimeWorked() {
        let totalWorkedHours = 0;
        const timeEntries = document.querySelectorAll('#time-entry-body tr');

        timeEntries.forEach(row => {
            const hoursWorked = parseFloat(row.querySelector('input[name^="hours_worked_today"]').value) || 0;
            totalWorkedHours += hoursWorked;
        });

        document.getElementById('total-time-worked').textContent = totalWorkedHours.toFixed(2);
    }

    // Function to submit timesheet
    async function submitTimesheet() {
        const weekEndingDate = document.getElementById('week-ending').value;
        const timesheetData = {
            records: []
        };

        for (let i = 1; i <= 7; i++) {
            const date = document.querySelector(`input[name="date${i}"]`).value;
            const startTime = document.querySelector(`input[name="start_time${i}"]`).value;
            const lunchStart = document.querySelector(`input[name="lunch_start${i}"]`).value;
            const lunchEnd = document.querySelector(`input[name="lunch_end${i}"]`).value;
            const endTime = document.querySelector(`input[name="end_time${i}"]`).value;
            const hoursWorked = parseFloat(document.querySelector(`#time-entry-body input[name="hours_worked_today${i}"]`).value) || 0;

            timesheetData.records.push({
                fields: {
                    user_email: 'user@example.com', // Replace with actual user email or retrieve from session
                    date,
                    start_time: startTime,
                    lunch_start: lunchStart,
                    lunch_end: lunchEnd,
                    end_time: endTime,
                    hours_worked_today: hoursWorked,
                    WeekEnding: weekEndingDate
                }
            });
        }

        const url = `https://api.airtable.com/v0/${baseId}/TimeSheets`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(timesheetData)
            });
            const data = await response.json();
            console.log('Timesheet submitted successfully:', data);

            // Optional: Show success message or redirect to another page
            alert('Timesheet submitted successfully!');
        } catch (error) {
            console.error('Error submitting timesheet:', error);
            // Optional: Show error message
            alert('Error submitting timesheet. Please try again later.');
        }
    }
});

// Get references to DOM elements
const ptoTimeInput = document.getElementById('pto-time');
const totalTimeWorkedSpan = document.getElementById('total-time-worked');

// Function to calculate and update total time worked
function calculateTotalTimeWorked() {
    // Calculate total time worked excluding PTO
    let totalHoursWorked = 0;

    // Loop through all time entry rows
    for (let i = 1; i <= 7; i++) { // Assuming up to 7 days based on your form structure
        const hoursWorkedTodaySpan = document.getElementById(`hours-worked-today${i}`);
        const hoursWorkedToday = parseFloat(hoursWorkedTodaySpan.textContent);
        totalHoursWorked += hoursWorkedToday;
    }

    // Update total time worked in the UI
    totalTimeWorkedSpan.textContent = totalHoursWorked.toFixed(2); // Round to 2 decimal places
}

// Event listener for PTO time input changes
ptoTimeInput.addEventListener('input', function() {
    calculateTotalTimeWorked();
});