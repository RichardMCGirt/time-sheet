document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbl3PB88KkGdPlT5x';
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    const headers = {
        Authorization: `Bearer ${apiKey}`
    };

    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }

    // Fetch supervisor's full name using their email
    async function fetchSupervisorName(email) {
        try {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            const response = await fetch(url, { headers });
            const data = await response.json();
            if (data.records.length > 0) {
                return data.records[0].fields['Full Name'];
            } else {
                console.error('No supervisor found with the given email.');
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error fetching supervisor name:', error);
            window.location.href = 'index.html';
        }
    }

    // Fetch time-off requests for the supervisor
    async function fetchRequests(supervisorName) {
        console.log("Fetching requests...");
        try {
            const response = await fetch(url, { headers });
            const data = await response.json();
            const supervisorRequests = data.records.filter(record => record.fields.Supervisor === supervisorName);
            console.log("Fetched requests:", supervisorRequests);
            displayRequests(supervisorRequests);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    }

    // Display time-off requests
    function displayRequests(records) {
        console.log("Displaying requests...");
        const container = document.getElementById('requests-container');
        container.innerHTML = ''; // Clear existing content

        records.forEach(record => {
            const requestDiv = document.createElement('div');
            requestDiv.className = 'request';

            const name = document.createElement('p');
            name.textContent = `${record.fields.Name}`;
            requestDiv.appendChild(name);

            for (let i = 1; i <= 10; i++) {
                if (record.fields[`Time off Start Date ${i}`]) {
                    const startDate = document.createElement('p');
                    startDate.textContent = `Start Date ${i}: ${record.fields[`Time off Start Date ${i}`]}`;
                    requestDiv.appendChild(startDate);

                    const startTime = document.createElement('p');
                    startTime.textContent = `Start Time ${i}: ${record.fields[`Time off Start Time ${i}`]}`;
                    requestDiv.appendChild(startTime);

                    const endDate = document.createElement('p');
                    endDate.textContent = `End Date ${i}: ${record.fields[`Time off End Date ${i}`]}`;
                    requestDiv.appendChild(endDate);

                    const endTime = document.createElement('p');
                    endTime.textContent = `End Time ${i}: ${record.fields[`Time off End Time ${i}`]}`;
                    requestDiv.appendChild(endTime);

                    const reason = document.createElement('p');
                    reason.textContent = `Reason ${i}: ${record.fields[`Reason ${i}`]}`;
                    requestDiv.appendChild(reason);

                    if (record.fields[`Time off Approved ${i}`] !== undefined) {
                        const approval = document.createElement('p');
                        approval.textContent = `Approval ${i}: ${record.fields[`Time off Approved ${i}`]}`;
                        requestDiv.appendChild(approval);
                    }
                }
            }

            container.appendChild(requestDiv);
        });
    }

    // Check if user is a supervisor and fetch requests if they are
    async function initialize() {
        const supervisorName = await fetchSupervisorName(userEmail);
        if (supervisorName) {
            fetchRequests(supervisorName);
        }
    }

    // Initialize on page load
    initialize();

    // Add event listener to refresh button
    document.getElementById('refresh-button').addEventListener('click', initialize);
});
