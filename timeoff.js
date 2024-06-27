// Import baseId and apiKey from a central configuration file (e.g., config.js)
import { baseId, apiKey } from './config.js';

async function submitTimeOffRequest() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const hoursPerDay = document.getElementById('hours-per-day').value; // Assuming you have an input for hours per day
    const reason = document.getElementById('reason').value;
    const ptoTime = parseFloat(document.getElementById('pto-time').textContent); // Assuming PTO time is displayed somewhere

    const timeOffRequestData = {
        records: [{
            fields: {
                user_email: user.email,
                start_date: startDate,
                end_date: endDate,
                hours_per_day: hoursPerDay,
                reason,
                'PTO Time': ptoTime, // Adjust field name to match Airtable
                status: 'Pending'
            }
        }]
    };

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/TimeOffRequests`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(timeOffRequestData)
    });

    if (response.ok) {
        alert('Time-off request submitted successfully');
    } else {
        alert('Failed to submit time-off request');
    }
}

// Export the function if needed for usage in other modules
export { submitTimeOffRequest };
