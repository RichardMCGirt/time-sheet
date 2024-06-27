document.addEventListener("DOMContentLoaded", function () {
    const baseId = 'appMq9W12jZyCJeXe';
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
    const tableId = 'tbl2b7fgvkU4GL4jI';

    const ptoHoursElement = document.getElementById('pto-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const timeEntryForm = document.getElementById('time-entry-form');
    const ptoTimeInput = document.getElementById('pto-time');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const ptoValidationMessage = document.getElementById('pto-validation-message');
    const totalTimeWithPtoSpan = document.getElementById('total-time-with-pto-value');
    const timesheetTableBody = document.getElementById('timesheet-table-body');

    // Initialize the form
    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('change', handleFormChange);
    timeEntryForm.addEventListener('input', handlePtoInput);

    // Function to handle week ending date change
    async function handleWeekEndingChange() {
        populateWeekDates();
        await fetchPtoHours();
    }

    // Function to populate week dates
    function populateWeekDates() {
        const weekEndingDate = new Date(weekEndingInput.value);
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];

        for (let i = 0; i < daysOfWeek.length; i++) {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(weekEndingDate.getDate() - (6 - i));

            const formattedDate = currentDate.toISOString().split('T')[0];
            timeEntryForm.elements[daysOfWeek[i]].value = formattedDate;
        }
    }

    // Function to fetch remaining PTO hours
    async function fetchPtoHours() {
        const weekEnding = weekEndingInput.value;
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
                ptoHoursElement.textContent = `${ptoHours} hours`;
            } else {
                ptoHoursElement.textContent = '0 hours';
            }
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            ptoHoursElement.textContent = '0 hours';
        }
    }

    // Function to handle form input change
    function handleFormChange(event) {
        const target = event.target;
        if (target.tagName === 'INPUT') {
            const name = target.name;
            if (name.startsWith('date') || name.startsWith('start_time') || name.startsWith('lunch_start') || name.startsWith('lunch_end') || name.startsWith('end_time')) {
                const dayIndex = name.replace(/[^\d]/g, '');
                calculateHoursWorked(dayIndex);
                calculateTotalTimeWorked();
                updateTimesheetTable();
            }
        }
    }

    // Function to handle PTO input change
    function handlePtoInput() {
        calculateTotalTimeWorked();
    }

    // Function to calculate hours worked for a specific day
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

        timeEntryForm.elements[`hours_worked_today${dayIndex}`].value = hoursWorked;
    }

    // Function to calculate total time worked
    function calculateTotalTimeWorked() {
        let totalWorkedHours = 0;
        const timeEntries = timeEntryForm.querySelectorAll('tbody tr');

        timeEntries.forEach(row => {
            const hoursWorked = parseFloat(row.querySelector('input[name^="hours_worked_today"]').value) || 0;
            totalWorkedHours += hoursWorked;
        });

        totalTimeWorkedSpan.textContent = totalWorkedHours.toFixed(2);
        calculateTotalTimeWithPto(totalWorkedHours);
    }

    // Function to calculate total time worked with PTO
    function calculateTotalTimeWithPto(totalWorkedHours) {
        const ptoHours = parseFloat(ptoTimeInput.value) || 0;
        const totalTimeWithPto = totalWorkedHours + ptoHours;
        totalTimeWithPtoSpan.textContent = totalTimeWithPto.toFixed(2);
    }

    // Function to update timesheet table with calculated hours
    function updateTimesheetTable() {
        const rows = timesheetTableBody.querySelectorAll('tr');

        rows.forEach((row, index) => {
            const dayIndex = index + 1;
            const hoursWorked = timeEntryForm.elements[`hours_worked_today${dayIndex}`].value;
            row.querySelector('.hours-worked').textContent = hoursWorked || '0';
        });
    }

    // Function to validate PTO input
    ptoTimeInput.addEventListener('input', function () {
        const ptoValue = parseFloat(ptoTimeInput.value);
        if (ptoValue > 40) {
            ptoValidationMessage.style.display = 'block';
            ptoTimeInput.value = 40;
        } else {
            ptoValidationMessage.style.display = 'none';
        }

        calculateTotalTimeWorked();
    });

    // Function to submit timesheet
    timeEntryForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        await submitTimesheet();
    });

    async function submitTimesheet() {
        const weekEndingDate = weekEndingInput.value;
        const timesheetData = { records: [] };

        for (let i = 1; i <= 7; i++) {
            const date = timeEntryForm.elements[`date${i}`].value;
            const startTime = timeEntryForm.elements[`start_time${i}`].value;
            const lunchStart = timeEntryForm.elements[`lunch_start${i}`].value;
            const lunchEnd = timeEntryForm.elements[`lunch_end${i}`].value;
            const endTime = timeEntryForm.elements[`end_time${i}`].value;
            const hoursWorked = parseFloat(timeEntryForm.elements[`hours_worked_today${i}`].value) || 0;

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

            if (!response.ok) {
                throw new Error('Failed to submit timesheet');
            }

            const responseData = await response.json();
            console.log('Timesheet submitted successfully:', responseData);
            alert('Timesheet submitted successfully!');
        } catch (error) {
            console.error('Error submitting timesheet:', error);
            alert('Error submitting timesheet. Please try again later.');
        }
    }

    // Function to handle week ending date change
    weekEndingInput.addEventListener('change', handleWeekEndingChange);

    // Function to handle initial setup
    handleWeekEndingChange();

    function handleWeekEndingChange() {
        const selectedDate = new Date(weekEndingInput.value);
        const dayOfWeek = selectedDate.getDay(); // 0 (Sunday) to 6 (Saturday), 3 is Wednesday

        // Check if selected date is not Wednesday, disable the input
        if (dayOfWeek !== 2) {
            alert('Please select a Wednesday for Week Ending.');
            weekEndingInput.value = ''; // Reset the value
        }
    }
});
