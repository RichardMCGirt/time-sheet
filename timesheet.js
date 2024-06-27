async function submitTimesheet() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const baseId = 'appMq9W12jZyCJeXe'; 
    const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde'; 

    const timesheetData = {
        records: []
    };

    for (let i = 1; i <= 7; i++) {
        const date = document.querySelector(`input[name="date${i}"]`).value;
        const startTime = document.querySelector(`input[name="start_time${i}"]`).value;
        const lunchStart = document.querySelector(`input[name="lunch_start${i}"]`).value;
        const lunchEnd = document.querySelector(`input[name="lunch_end${i}"]`).value;
        const endTime = document.querySelector(`input[name="end_time${i}"]`).value;
        const hoursWorkedToday = document.querySelector(`input[name="hours_worked${i}"]`).value;
        const totalTimeWorked = document.querySelector(`input[name="total_time_worked${i}"]`).value;
        const ptoTime = document.querySelector(`input[name="pto_time${i}"]`).value;

        timesheetData.records.push({
            fields: {
                user_email: user.email,
                date,
                start_time: startTime,
                lunch_start: lunchStart,
                lunch_end: lunchEnd,
                end_time: endTime,
                hours_worked_today: parseFloat(hoursWorkedToday) || 0,
                'Total time worked': parseFloat(totalTimeWorked) || 0,
                'PTO Time': parseFloat(ptoTime) || 0
            }
        });
    }

    try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Timesheets`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(timesheetData)
        });

        if (response.ok) {
            alert('Timesheet submitted successfully');
            
        } else {
            alert('Failed to submit timesheet');
        }
    } catch (error) {
        console.error('Error submitting timesheet:', error);
        alert('An error occurred while submitting timesheet');
    }
}
