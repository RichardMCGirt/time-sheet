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

    let debounceTimer;

    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });
    ptoTimeInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });

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
        const offset = dayOfWeek < 2 ? 2 - dayOfWeek : 7 - dayOfWeek + 2;
        date.setDate(date.getDate() + offset);
    }

    function populateWeekDates(weekEndingDate) {
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const currentDate = new Date(weekEndingDate);
            currentDate.setDate(weekEndingDate.getDate() - (6 - index));
            timeEntryForm.elements[day].value = currentDate.toISOString().split('T')[0];
        });
    }

    async function fetchPtoHours(weekEndingDate) {
        const weekEnding = weekEndingDate.toISOString().split('T')[0];
        if (!weekEnding) return;

        const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={WeekEnding}="${weekEnding}"`;

        try {
            const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error('Failed to fetch PTO hours');

            const data = await response.json();
            const ptoHours = data.records.length > 0 ? data.records[0].fields['PTO Time'] || 0 : 0;
            ptoHoursElement.textContent = `${ptoHours} hours`;
            ptoTimeInput.value = ptoHours;
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            ptoHoursElement.textContent = '0 hours';
            ptoTimeInput.value = 0;
        }
    }

    function calculateHoursWorked(row) {
        const startTime = timeEntryForm.elements[`start_time${row}`].value;
        const endTime = timeEntryForm.elements[`end_time${row}`].value;
        const lunchStart = timeEntryForm.elements[`lunch_start${row}`].value;
        const lunchEnd = timeEntryForm.elements[`lunch_end${row}`].value;

        if (!startTime || !endTime) return 0;

        const start = new Date(`1970-01-01T${startTime}Z`);
        const end = new Date(`1970-01-01T${endTime}Z`);
        let workedHours = (end - start) / (1000 * 60 * 60);

        if (lunchStart && lunchEnd) {
            const lunchStartObj = new Date(`1970-01-01T${lunchStart}Z`);
            const lunchEndObj = new Date(`1970-01-01T${lunchEnd}Z`);
            workedHours -= (lunchEndObj - lunchStartObj) / (1000 * 60 * 60);
        }

        return Math.max(workedHours, 0).toFixed(2);
    }

    function calculateTotalTimeWorked() {
        let totalWorkedHours = 0;

        for (let i = 1; i <= 7; i++) {
            const hoursWorked = parseFloat(calculateHoursWorked(i)) || 0;
            document.getElementById(`hours-worked-today${i}`).textContent = hoursWorked.toFixed(2);
            totalWorkedHours += hoursWorked;
        }

        totalTimeWorkedSpan.textContent = totalWorkedHours.toFixed(2);
        calculateTotalTimeWithPto(totalWorkedHours);
    }

    function calculateTotalTimeWithPto(totalWorkedHours) {
        const ptoHours = parseFloat(ptoTimeInput.value) || 0;
        const totalTimeWithPto = totalWorkedHours + ptoHours;
        totalTimeWithPtoSpan.textContent = totalTimeWithPto.toFixed(2);
    }

    function addRow() {
        const tbody = timeEntryBody;
        const rowCount = tbody.rows.length + 1;

        if (rowCount <= 7) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="date" name="date${rowCount}" onchange="calculateTotalTimeWorked()"></td>
                <td><input type="time" name="start_time${rowCount}" step="1800" onchange="calculateTotalTimeWorked()"></td>
                <td><input type="time" name="lunch_start${rowCount}" step="1800" onchange="calculateTotalTimeWorked()"></td>
                <td><input type="time" name="lunch_end${rowCount}" step="1800" onchange="calculateTotalTimeWorked()"></td>
                <td><input type="time" name="end_time${rowCount}" step="1800" onchange="calculateTotalTimeWorked()"></td>
                <td id="hours-worked-today${rowCount}">0.00</td>
                <td><button type="button" onclick="deleteRow(this)">Delete</button></td>
            `;
            tbody.appendChild(newRow);
        }
    }

    function deleteRow(button) {
        const row = button.closest('tr');
        row.remove();
        calculateTotalTimeWorked();
    }

    async function submitRemainingPtoHours() {
        const remainingPtoHours = parseFloat(ptoTimeInput.value) - parseFloat(totalTimeWithPtoSpan.textContent);
        const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    records: [
                        {
                            id: data.records[0].id,
                            fields: { 'PTO Time': remainingPtoHours }
                        }
                    ]
                })
            });

            if (!response.ok) throw new Error('Failed to update PTO hours');

            console.log('PTO hours updated successfully:', remainingPtoHours);
            alert('Remaining PTO hours submitted successfully!');
        } catch (error) {
            console.error('Error updating PTO hours:', error);
            alert('Failed to update remaining PTO hours');
        }
    }

    async function submitTimesheet() {
        const formData = new FormData(timeEntryForm);
        const records = [];

        for (let i = 1; i <= 7; i++) {
            const date = formData.get(`date${i}`);
            const startTime = formData.get(`start_time${i}`);
            const lunchStart = formData.get(`lunch_start${i}`);
            const lunchEnd = formData.get(`lunch_end${i}`);
            const endTime = formData.get(`end_time${i}`);
            const hoursWorked = calculateHoursWorked(i);

            if (date && startTime && endTime) {
                records.push({
                    fields: {
                        Date: date,
                        StartTime: startTime,
                        LunchStart: lunchStart,
                        LunchEnd: lunchEnd,
                        EndTime: endTime,
                        HoursWorked: parseFloat(hoursWorked)
                    }
                });
            }
        }

        const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ records })
            });

            if (!response.ok) throw new Error('Failed to submit timesheet');

            alert('Timesheet submitted successfully!');
            timeEntryForm.reset();
            timeEntryBody.innerHTML = '';
            fetchPtoHours();

            submitRemainingPtoHours();
        } catch (error) {
            console.error('Error submitting timesheet:', error);
            alert('Failed to submit timesheet. Please try again later.');
        }
    }

    function init() {
        handleWeekEndingChange();
    }

    init();
});
