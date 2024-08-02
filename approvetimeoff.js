document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbl3PB88KkGdPlT5x';
    const ptoBaseId = 'app9gw2qxhGCmtJvW';
    const ptoTableId = 'tbljmLpqXScwhiWTt';
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    const ptoUrl = `https://api.airtable.com/v0/${ptoBaseId}/${ptoTableId}`;
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

    // Fetch PTO and Personal hours for an employee
    async function fetchAvailableHours(employeeName) {
        try {
            const employeeUrl = `https://api.airtable.com/v0/${ptoBaseId}/${ptoTableId}?filterByFormula=${encodeURIComponent(`{Full Name}='${employeeName}'`)}`;
            const response = await fetch(employeeUrl, { headers });
            const data = await response.json();

            if (data.records.length > 0) {
                const employee = data.records[0].fields;
                const availablePTO = employee['PTO Hours'] || 0;
                const availablePersonalHours = employee['Personaltime'] || 0;
                return { availablePTO, availablePersonalHours };
            } else {
                console.error('No employee found with the given name.');
                return { availablePTO: 0, availablePersonalHours: 0 };
            }
        } catch (error) {
            console.error('Error fetching available hours:', error);
            return { availablePTO: 0, availablePersonalHours: 0 };
        }
    }

    // Check if two time-off periods overlap
    function isOverlapping(startDate1, endDate1, startDate2, endDate2) {
        return (startDate1 <= endDate2) && (startDate2 <= endDate1);
    }

    // Display time-off requests
    async function displayRequests(records) {
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

        for (const employeeName in groupedByEmployee) {
            const employeeRequests = groupedByEmployee[employeeName];
            if (employeeRequests.some(record => record.fields[`Time off Start Date 1`] !== undefined)) {
                const employeeDiv = document.createElement('div');
                employeeDiv.className = 'employee';

                const name = document.createElement('h3');
                name.textContent = employeeName;
                employeeDiv.appendChild(name);

                const availableHours = await fetchAvailableHours(employeeName);
                const availablePto = document.createElement('p');
                availablePto.textContent = `Available PTO: ${availableHours.availablePTO}`;
                employeeDiv.appendChild(availablePto);

                const availablePersonalHours = document.createElement('p');
                availablePersonalHours.textContent = `Available Personal Hours: ${availableHours.availablePersonalHours}`;
                employeeDiv.appendChild(availablePersonalHours);

                const requestsRow = document.createElement('div');
                requestsRow.className = 'requests-row';

                const requestElements = [];
                employeeRequests.forEach(record => {
                    for (let i = 1; i <= 10; i++) {
                        if (record.fields[`Time off Start Date ${i}`]) {
                            const startDate = new Date(record.fields[`Time off Start Date ${i}`]);
                            const endDate = new Date(record.fields[`Time off End Date ${i}`]);

                            const requestDiv = document.createElement('div');
                            requestDiv.className = 'request';

                            const startDateElement = document.createElement('p');
                            startDateElement.textContent = `Start Date: ${record.fields[`Time off Start Date ${i}`]}`;
                            requestDiv.appendChild(startDateElement);

                            const startTime = document.createElement('p');
                            startTime.textContent = `Start Time: ${formatTime(record.fields[`Time off Start Time ${i}`])}`;
                            requestDiv.appendChild(startTime);

                            const endDateElement = document.createElement('p');
                            endDateElement.textContent = `End Date: ${record.fields[`Time off End Date ${i}`]}`;
                            requestDiv.appendChild(endDateElement);

                            const endTime = document.createElement('p');
                            endTime.textContent = `End Time: ${formatTime(record.fields[`Time off End Time ${i}`])}`;
                            requestDiv.appendChild(endTime);

                            const hoursMissed = calculateHoursMissed(record.fields[`Time off Start Date ${i}`], record.fields[`Time off End Date ${i}`], record.fields[`Time off Start Time ${i}`], record.fields[`Time off End Time ${i}`]);
                            const missedHours = document.createElement('p');
                            missedHours.textContent = `Hours Missed: ${hoursMissed}`;
                            requestDiv.appendChild(missedHours);

                            const approvedCheckbox = document.createElement('input');
                            approvedCheckbox.type = 'checkbox';
                            approvedCheckbox.checked = record.fields[`Time off Approval Checkbox ${i}`] || false;
                            approvedCheckbox.dataset.recordId = record.id;
                            approvedCheckbox.dataset.approvalIndex = i;
                            approvedCheckbox.addEventListener('change', handleApprovalChange);
                            requestDiv.appendChild(approvedCheckbox);

                            const denialReason = document.createElement('select');
                            denialReason.dataset.recordId = record.id;
                            denialReason.dataset.approvalIndex = i;
                            denialReason.innerHTML = `
                                <option value="">Select Denial Reason</option>
                                <option value="Insufficient PTO">Insufficient PTO</option>
                                <option value="Project Deadline">Project Deadline</option>
                                <option value="Team Shortage">Team Shortage</option>
                            `;
                            requestDiv.appendChild(denialReason);

                            requestElements.push({ requestDiv, startDate, endDate, denialReason });
                            requestsRow.appendChild(requestDiv);

                            if (approvedCheckbox.checked) {
                                denialReason.style.display = 'none';
                            }
                        }
                    }
                });

                // Check for overlapping requests and style them in red
                requestElements.forEach((request1, index1) => {
                    requestElements.forEach((request2, index2) => {
                        if (index1 !== index2 && isOverlapping(request1.startDate, request1.endDate, request2.startDate, request2.endDate)) {
                            request1.requestDiv.style.color = 'red';
                            request2.requestDiv.style.color = 'red';
                        }
                    });
                });

                employeeDiv.appendChild(requestsRow);
                container.appendChild(employeeDiv);
            }
        }
    }

    // Handle checkbox change event to update Airtable and hide/show denial reason dropdown
    async function handleApprovalChange(event) {
        const checkbox = event.target;
        const recordId = checkbox.dataset.recordId;
        const approvalIndex = checkbox.dataset.approvalIndex;
        const approved = checkbox.checked;

        const denialReasonSelect = document.querySelector(`select[data-record-id="${recordId}"][data-approval-index="${approvalIndex}"]`);
        const denialReason = denialReasonSelect ? denialReasonSelect.value : '';

        if (approved) {
            denialReasonSelect.style.display = 'none';
        } else {
            denialReasonSelect.style.display = 'block';
        }

        const updateUrl = `${url}/${recordId}`;
        const data = {
            fields: {
                [`Request Approve ${approvalIndex}`]: denialReason,
                [`Time off Approval Checkbox ${approvalIndex}`]: approved
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

    function calculateHoursMissed(startDate, endDate, startTime, endTime) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dailyWorkHours = 8;
        const allDayHours = 8;
        const workStartHour = 7;
        const workEndHour = 16;
        const lunchStartHour = 12;
        const lunchEndHour = 13;

        let totalHours = 0;
        let currentDate = start;

        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                if (startTime.toLowerCase() === 'all day') {
                    totalHours += allDayHours;
                } else {
                    const workStart = new Date(currentDate);
                    workStart.setHours(workStartHour, 0, 0);
                    const workEnd = new Date(currentDate);
                    workEnd.setHours(workEndHour, 0, 0);

                    const lunchStart = new Date(currentDate);
                    lunchStart.setHours(lunchStartHour, 0, 0);
                    const lunchEnd = new Date(currentDate);
                    lunchEnd.setHours(lunchEndHour, 0, 0);

                    let actualStart = new Date(`${currentDate.toDateString()} ${startTime}`);
                    let actualEnd = endTime.toLowerCase() === 'all day' ? new Date(`${currentDate.toDateString()} 16:00`) : new Date(`${currentDate.toDateString()} ${endTime}`);

                    if (actualStart < workStart) actualStart = workStart;
                    if (actualEnd > workEnd) actualEnd = workEnd;

                    let dailyHours = (actualEnd - actualStart) / (1000 * 60 * 60);
                    if (actualStart < lunchEnd && actualEnd > lunchStart) {
                        dailyHours -= 1; // Subtract lunch hour
                    }

                    totalHours += dailyHours;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return totalHours;
    }

    function formatTime(time) {
        if (time.toLowerCase() === 'all day') {
            return 'All Day';
        }

        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleTimeString([], options);
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
