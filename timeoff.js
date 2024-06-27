const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
const baseId = 'appMq9W12jZyCJeXe';
const tableId = 'tbl96cVo2fymB6rrd/';

const apiUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?api_key=${apiKey}`;

// Making a GET request to Airtable API
fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    // Assuming data contains records from Airtable
    if (data.records && data.records.length > 0) {
      const record = data.records[0]; // Assuming we are fetching the first record
      const userEmail = record.fields.user_email;
      const userName = record.fields.name;

      // Update the DOM with fetched data
      document.getElementById('name').textContent = userName;
      document.getElementById('user_email').textContent = userEmail;
    }
  })
  .catch(error => console.error('Error fetching data:', error)); 

async function submitTimeOffRequest() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const hoursPerDay = document.getElementById('hours-per-day').value;
    const reason = document.getElementById('reason').value;

    const timeOffRequestData = {
        records: [{
            fields: {
                user_email: user.email,
                start_date: startDate,
                end_date: endDate,
                hours_per_day: hoursPerDay,
                reason,
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
