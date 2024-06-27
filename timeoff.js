const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
const baseId = 'appMq9W12jZyCJeXe';
const tableId = 'tbl96cVo2fymB6rrd/';

const apiUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?api_key=${apiKey}`;

// Function to fetch user data from Airtable
function fetchUserData() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Assuming data contains records from Airtable
            if (data.records && data.records.length > 0) {
                const record = data.records[0];
                const userEmail = record.fields.user_email;
                const userName = record.fields.name;
                const ptoHours = record.fields.PTOTime;

                // Update the DOM with fetched data
                document.getElementById('user-name').textContent = userName;
                document.getElementById('user-email').textContent = userEmail;
                document.getElementById('pto-hours').textContent = ptoHours;
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Function to hide date inputs
function hideDateInput(inputId) {
    const input = document.getElementById(inputId);
    input.style.display = 'none';
}

// Add event listeners to hide the date inputs when a date is selected
document.getElementById('start-date').addEventListener('change', function() {
    hideDateInput('start-date');
});
document.getElementById('end-date').addEventListener('change', function() {
    hideDateInput('end-date');
});

// Function to submit time-off request
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
        document.getElementById('timeoff-form').reset(); // Reset form after successful submission
    } else {
        alert('Failed to submit time-off request');
    }
}

// Prevent default form submission and handle submission via JavaScript
document.getElementById('timeoff-form').addEventListener('submit', function(event) {
    event.preventDefault();
    submitTimeOffRequest();
});

// Fetch user data and update user info on the page
fetchUserData();
