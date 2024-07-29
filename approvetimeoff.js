document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbl3PB88KkGdPlT5x';
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    const userEmail = localStorage.getItem('userEmail');
    const userEmailElement = document.getElementById('user-email');

    if (!userEmail) {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }

    // Display the user email in the span element
    userEmailElement.textContent = userEmail;

    // Fetch supervisor's full name using their email
    async function fetchSupervisorName(email) {
        try {
            const supervisorUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            const response = await fetch(supervisorUrl, { headers });
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

    // Fetch all time-off requests with pagination handling
    async function fetchRequests(supervisorName) {
        console.log("Fetching requests...");
        let allRecords = [];
        let offset = '';

        try {
            do {
                const fetchUrl = offset ? `${url}?offset=${offset}` : url;
                const response = await fetch(fetchUrl, { headers });
                const data = await response.json();
                allRecords = allRecords.concat(data.records);
                offset = data.offset;
            } while (offset);

            const supervisorRequests = allRecords.filter(record => record.fields.Supervisor === supervisorName);
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

        const groupedByEmployee = records.reduce((acc, record) => {
            const employeeName = record.fields.Name;
            if (!acc[employeeName]) {
                acc[employeeName] = [];
            }
            acc[employeeName].push(record);
            return acc;
        }, {});

        Object.keys(groupedByEmployee).forEach(employeeName => {
            const employeeRequests = groupedByEmployee[employeeName];
            if (employeeRequests.some(record => record.fields[`Time off Start Date 1`] !== undefined)) {
                const employeeDiv = document.createElement('div');
                employeeDiv.className = 'employee';

                const name = document.createElement('h3');
                name.textContent = employeeName;
                employeeDiv.appendChild(name);

                const requestsRow = document.createElement('div');
                requestsRow.className = 'requests-row';
                employeeRequests.forEach(record => {
                    for (let i = 1; i <= 10; i++) {
                        if (record.fields[`Time off Start Date ${i}`]) {
                            const requestDiv = document.createElement('div');
                            requestDiv.className = 'request';

                            const startDate = document.createElement('p');
                            startDate.textContent = `Start Date: ${record.fields[`Time off Start Date ${i}`]}`;
                            requestDiv.appendChild(startDate);

                            const startTime = document.createElement('p');
                            startTime.textContent = `Start Time: ${record.fields[`Time off Start Time ${i}`]}`;
                            requestDiv.appendChild(startTime);

                            const endDate = document.createElement('p');
                            endDate.textContent = `End Date: ${record.fields[`Time off End Date ${i}`]}`;
                            requestDiv.appendChild(endDate);

                            const endTime = document.createElement('p');
                            endTime.textContent = `End Time: ${record.fields[`Time off End Time ${i}`]}`;
                            requestDiv.appendChild(endTime);

                            const businessDaysMissed = calculateBusinessDays(record.fields[`Time off Start Date ${i}`], record.fields[`Time off End Date ${i}`]);
                            const businessDays = document.createElement('p');
                            businessDays.textContent = `Business Days Missed: ${businessDaysMissed}`;
                            requestDiv.appendChild(businessDays);

                            const approvedCheckbox = document.createElement('input');
                            approvedCheckbox.type = 'checkbox';
                            approvedCheckbox.checked = record.fields[`Time off Approved ${i}`] || false;
                            approvedCheckbox.dataset.recordId = record.id;
                            approvedCheckbox.dataset.approvalIndex = i;
                            approvedCheckbox.addEventListener('change', handleApprovalChange);
                            requestDiv.appendChild(approvedCheckbox);

                            requestsRow.appendChild(requestDiv);
                        }
                    }
                });

                employeeDiv.appendChild(requestsRow);
                container.appendChild(employeeDiv);
            }
        });
    }

    // Handle checkbox change event to update Airtable
    async function handleApprovalChange(event) {
        const checkbox = event.target;
        const recordId = checkbox.dataset.recordId;
        const approvalIndex = checkbox.dataset.approvalIndex;
        const approved = checkbox.checked;

        const updateUrl = `${url}/${recordId}`;
        const data = {
            fields: {
                [`Time off Approved ${approvalIndex}`]: approved
            }
        };

        try {
            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error('Failed to update approval status');
            }
            console.log(`Updated approval status for record ${recordId}, index ${approvalIndex}: ${approved}`);
        } catch (error) {
            console.error('Error updating approval status:', error);
        }
    }

    // Handle logout
    function handleLogout() {
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    }

    function refreshPage() {
        location.reload();
    }

    function calculateBusinessDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let count = 0;
        let currentDate = start;

        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return count;
    }

    // Initialize on page load
    async function initialize() {
        const supervisorName = await fetchSupervisorName(userEmail);
        if (supervisorName) {
            fetchRequests(supervisorName);
        }
    }

    // Add event listeners
    document.getElementById('refresh-button').addEventListener('click', initialize);
    document.getElementById('logout-button').addEventListener('click', handleLogout);

    // Run initialization
    initialize();
});
