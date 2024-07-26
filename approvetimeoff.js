document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    const requestsContainer = document.getElementById('requests-container');
    const loadingIndicator = document.getElementById('loading-indicator');

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
        const filterFormula = `AND({Supervisor}='${supervisorName}', {Employee Name}!=BLANK())`;

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

                const nameContainer = document.createElement('div');
                nameContainer.classList.add('name-container');
                nameContainer.textContent = employeeName;
                requestsContainer.appendChild(nameContainer);

                const requestElement = document.createElement('div');
                requestElement.classList.add('request');

                const dateRangeElements = JSON.parse(fields["Date Ranges"]).map(range => {
                    if (range["Start Date"] && range["End Date"]) {
                        return `<p>Start Date: ${range["Start Date"]} - End Date: ${range["End Date"]}</p>`;
                    } else {
                        return `<p>Single Date: ${range["Single Date"]}</p>`;
                    }
                }).join("");

                requestElement.innerHTML = `
                    <div>
                        <p><strong>Employee:</strong> ${fields["Employee Name"]}</p>
                        ${dateRangeElements}
                        <p><strong>Reason:</strong> ${fields["Reason"]}</p>
                    </div>
                    <div>
                        <label for="approve-${record.id}">Approve:</label>
                        <input type="checkbox" id="approve-${record.id}" name="approve-${record.id}" ${fields["Approved"] ? 'checked' : ''} onchange="updateApprovalStatus('${record.id}', this.checked)">
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

    async function updateApprovalStatus(recordId, isApproved) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        const body = JSON.stringify({
            fields: {
                Approved: isApproved
            }
        });

        try {
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body
            });
            if (!response.ok) throw new Error(`Failed to update approval status: ${response.statusText}`);
            const data = await response.json();
            console.log('Approval status updated:', data);
        } catch (error) {
            console.error('Error updating approval status:', error);
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

    document.getElementById('logout-button').addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    });

    // Refresh data every 60 seconds
    setInterval(refreshData, 120000);
});
