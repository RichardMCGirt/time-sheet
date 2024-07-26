document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    const requestsContainer = document.getElementById('requests-container');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (!supervisorEmail) {
        window.location.href = 'index.html';
        return;
    }

    if (userEmailElement) {
        userEmailElement.textContent = supervisorEmail;
    }

    async function fetchSupervisorName(email) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${email}')`;
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch supervisor name: ${response.statusText}`);
            const data = await response.json();
            return data.records.length > 0 ? data.records[0].fields['Full Name'] : null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async function fetchEmployeeRequests(supervisorName) {
        const filterFormula = `AND({Supervisor}='${supervisorName}', {Employee Name}!=BLANK(), {Reason}!=BLANK())`;

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${filterFormula}&sort[0][field]=CreatedTime&sort[0][direction]=asc`;

        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch time-off requests: ${response.statusText}`);
            const data = await response.json();
            await populateRequests(data.records);
        } catch (error) {
            console.error(error);
        }
    }

    async function populateRequests(records) {
        requestsContainer.innerHTML = ''; // Clear any existing rows

        if (records.length > 0) {
            for (const record of records) {
                const fields = record.fields;
                const employeeName = fields['Employee Name'];

                if (!employeeName) continue; // Skip records without Employee Name

                const requestElement = document.createElement('div');
                requestElement.classList.add('request');

                const dateRangeElements = JSON.parse(fields["Date Ranges"]).map((range, index) => {
                    if (range["Start Date"] && range["End Date"]) {
                        return `
                            <p>
                                <label>Start Date:</label>
                                <input type="date" value="${range["Start Date"]}" data-record-id="${record.id}" data-range-index="${index}" data-field="Start Date" />
                                <label>End Date:</label>
                                <input type="date" value="${range["End Date"]}" data-record-id="${record.id}" data-range-index="${index}" data-field="End Date" />
                            </p>`;
                    } else {
                        return `
                            <p>
                                <label>Single Date:</label>
                                <input type="date" value="${range["Single Date"]}" data-record-id="${record.id}" data-range-index="${index}" data-field="Single Date" />
                            </p>`;
                    }
                }).join("");

                requestElement.innerHTML = `
                    <h3>${employeeName}</h3>
                    <div>
                        ${dateRangeElements}
                        <p>
                            <label>Reason:</label>
                            <input type="text" value="${fields["Reason"]}" data-record-id="${record.id}" data-field="Reason" />
                        </p>
                    </div>
                    <div>
                        <label for="approve-${record.id}">Approve:</label>
                        <input type="checkbox" id="approve-${record.id}" name="approve-${record.id}" ${fields["Time Off Approved"] ? 'checked' : ''} onchange="updateApprovalStatus('${record.id}', this.checked)">
                        <button onclick="updateRequest('${record.id}')">Update</button>
                    </div>
                `;

                requestsContainer.appendChild(requestElement);
            }
        } else {
            const noRecordsRow = document.createElement('div');
            noRecordsRow.classList.add('name-container');
            noRecordsRow.textContent = `No records found for the supervisor: ${supervisorEmail}`;
            requestsContainer.appendChild(noRecordsRow);
        }
    }

   

    async function refreshData() {
        const supervisorName = await fetchSupervisorName(supervisorEmail);
        if (supervisorName) {
            await fetchEmployeeRequests(supervisorName);
        } else {
            console.error('No supervisor found with email:', supervisorEmail);
        }
    }

    // Initial fetch
    await refreshData();

    // Logout function
    document.getElementById('logout-button').addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    });

    // Refresh data every 60 seconds
    setInterval(refreshData, 120000);
});
