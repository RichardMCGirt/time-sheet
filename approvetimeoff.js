document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tblDUlMq88nxT7M4I';
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
    const notificationElement = document.getElementById('notification');

    console.log("User email:", userEmail);

    if (!userEmail) {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }

    // Display the user email in the span element
    userEmailElement.textContent = userEmail;

    // Fetch supervisor's full name using their email
    async function fetchSupervisorName(email) {
        console.log("Fetching supervisor name for email:", email);
        try {
            const supervisorUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            console.log("Supervisor URL:", supervisorUrl);
            const response = await fetch(supervisorUrl, { headers });
            const data = await response.json();
            console.log("Supervisor data:", data);
            if (data.records.length > 0) {
                return data.records[0].fields['Name'];
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
        console.log("Fetching requests for supervisor:", supervisorName);
        let allRecords = [];
        let offset = '';

        try {
            do {
                const fetchUrl = offset ? `${url}?offset=${offset}` : url;
                console.log("Fetch URL:", fetchUrl);
                const response = await fetch(fetchUrl, { headers });
                const data = await response.json();
                console.log("Fetched data:", data);
                allRecords = allRecords.concat(data.records);
                offset = data.offset;
            } while (offset);

            const supervisorRequests = allRecords.filter(record => record.fields.Supervisor === supervisorName);
            console.log("Supervisor requests:", supervisorRequests);
            displayRequests(supervisorRequests);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    }

    // Fetch PTO and Personal hours for an employee
    async function fetchAvailableHours(employeeName) {
        console.log("Fetching available hours for employee:", employeeName);
        try {
            const employeeUrl = `https://api.airtable.com/v0/${ptoBaseId}/${ptoTableId}?filterByFormula=${encodeURIComponent(`{Full Name}='${employeeName}'`)}`;
            console.log("Employee URL:", employeeUrl);
            const response = await fetch(employeeUrl, { headers });
            const data = await response.json();
            console.log("Available hours data:", data);

            if (data.records.length > 0) {
                const employee = data.records[0].fields;
                const availablePTO = employee['PTO Total'] || 0;
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
    
        console.log("Grouped by employee:", groupedByEmployee);
    
        for (const employeeName in groupedByEmployee) {
            const employeeRequests = groupedByEmployee[employeeName];
            console.log("Processing requests for employee:", employeeName, employeeRequests);
            if (employeeRequests.some(record => record.fields[`Time off Start Date 1`] !== undefined)) {
                const employeeDiv = document.createElement('div');
                employeeDiv.className = 'employee';
    
                const name = document.createElement('h3');
                name.textContent = employeeName;
                employeeDiv.appendChild(name);
    
                // Fetch available hours and display them
                const availableHours = await fetchAvailableHours(employeeName);
                console.log("Available hours for", employeeName, availableHours);
    
                const availablePto = document.createElement('p');
                availablePto.textContent = `Available PTO: ${availableHours.availablePTO}`;
                employeeDiv.appendChild(availablePto);
    
                const availablePersonalHours = document.createElement('p');
                availablePersonalHours.textContent = `Available Personal Hours: ${availableHours.availablePersonalHours}`;
                employeeDiv.appendChild(availablePersonalHours);
    
                // Display requests in a row
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
    
                            const approvalParagraph = document.createElement('p');
                            approvalParagraph.textContent = 'Check to approve ';
    
                            const approvedCheckbox = document.createElement('input');
                            approvedCheckbox.type = 'checkbox';
                            approvedCheckbox.checked = record.fields[`Time off Approved ${i}`] || false;
                            approvedCheckbox.dataset.recordId = record.id;
                            approvedCheckbox.dataset.approvalIndex = i;
                            approvedCheckbox.addEventListener('change', handleApprovalChange);
                            approvalParagraph.appendChild(approvedCheckbox);
    
                            requestDiv.appendChild(approvalParagraph);
    
                            const denialReasonSelect = document.createElement('select');
                            denialReasonSelect.dataset.recordId = record.id;
                            denialReasonSelect.dataset.approvalIndex = i;
                            denialReasonSelect.innerHTML = `
                            <option value="Other">Other</option>

                                <option value="">Select Denial Reason</option>
                                <option value="Insufficient PTO">Insufficient PTO</option>
                                <option value="Project Deadline">Project Deadline</option>
                                <option value="Team Shortage">Team Shortage</option>
                            `;
                            denialReasonSelect.addEventListener('change', handleReasonChange);
                            requestDiv.appendChild(denialReasonSelect);
    
                            requestElements.push({ requestDiv, startDate, endDate, denialReasonSelect });
                            requestsRow.appendChild(requestDiv);
    
                            if (approvedCheckbox.checked) {
                                denialReasonSelect.style.display = 'none';
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

        console.log(`Updating approval for recordId ${recordId}, index ${approvalIndex}:`, approved);

        const denialReasonSelect = document.querySelector(`select[data-record-id="${recordId}"][data-approval-index="${approvalIndex}"]`);

        if (approved) {
            denialReasonSelect.style.display = 'none';
        } else {
            denialReasonSelect.style.display = 'block';
        }

        const updateUrl = `${url}/${recordId}`;
        const data = {
            fields: {
                [`Reason ${approvalIndex}`]: '',
                [`Time off Approved ${approvalIndex}`]: approved
            }
        };

        try {
            console.log("Sending PATCH request to:", updateUrl, "with data:", data);
            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            console.log("Airtable response:", responseData);
            if (!response.ok) {
                throw new Error('Failed to update approval status');
            }
            console.log(`Updated approval status for record ${recordId}, index ${approvalIndex}: ${approved}`);
            showNotification('Record saved successfully!');
        } catch (error) {
            console.error('Error updating approval status:', error);
        }
    }
// Function to format time
function formatTime(time, isStartTime = true) {
    // Check for 'all day' time
    if (time.toLowerCase() === 'all day') {
        return 'All Day';
    }

    // Check if time is missing or in an invalid format
    const timePattern = /^([0-9]{1,2})(:[0-9]{2})?( ?[aApP][mM])?$/;
    if (!timePattern.test(time)) {
        // If time is invalid, return default 8:00 AM for start and 4:00 PM for end
        return isStartTime ? '8:00 AM' : '4:00 PM';
    }

    // Handle valid time formats
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes || 0);  // If minutes are missing, assume 0

    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleTimeString([], options);
}




    // Initialize on page load
    async function initialize() {
        const supervisorName = await fetchSupervisorName(userEmail);
        console.log("Supervisor name:", supervisorName);
        if (supervisorName) {
            fetchRequests(supervisorName);
        }
    }

    // Function to handle reason dropdown change event
function handleReasonChange(event) {
    const select = event.target;
    const recordId = select.dataset.recordId;
    const approvalIndex = select.dataset.approvalIndex;
    const reason = select.value;

    if (reason === 'Other') {
        // Replace the dropdown with an input field for custom reason
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter reason';
        input.dataset.recordId = recordId;
        input.dataset.approvalIndex = approvalIndex;
        input.className = 'denial-reason-input';
        input.addEventListener('blur', handleReasonInputBlur);
        select.parentNode.replaceChild(input, select);
        input.focus();
    } else {
        updateReason(recordId, approvalIndex, reason);
    }
}

// Handle reason input blur event
async function handleReasonInputBlur(event) {
    const input = event.target;
    const recordId = input.dataset.recordId;
    const approvalIndex = input.dataset.approvalIndex;
    const reason = input.value;

    // Replace the input field back with the dropdown
    const select = document.createElement('select');
    select.dataset.recordId = recordId;
    select.dataset.approvalIndex = approvalIndex;
    select.innerHTML = `
        <option value="">Select Denial Reason</option>
        <option value="Insufficient PTO">Insufficient PTO</option>
        <option value="Project Deadline">Project Deadline</option>
        <option value="Team Shortage">Team Shortage</option>
        <option value="Other">Other</option>
    `;
    select.value = reason === '' ? '' : 'Other';
    select.addEventListener('change', handleReasonChange);
    input.parentNode.replaceChild(select, input);

    if (reason !== '') {
        updateReason(recordId, approvalIndex, reason);
    }
}

// Function to update the reason in Airtable
async function updateReason(recordId, approvalIndex, reason) {
    const updateUrl = `${url}/${recordId}`;
    const data = {
        fields: {
            [`Reason ${approvalIndex}`]: reason
        }
    };

    try {
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(data)
        });
        const responseData = await response.json();
        console.log(`Updated reason for record ${recordId}, index ${approvalIndex}: ${reason}`);
        showNotification('Record saved successfully!');
    } catch (error) {
        console.error('Error updating reason:', error);
    }
}

// Function to display notifications to the user
function showNotification(message) {
    const notificationElement = document.getElementById('notification');
    if (notificationElement) {
        notificationElement.textContent = message;
        notificationElement.style.display = 'block';

        // Hide the notification after 3.5 seconds
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 3500);
    } else {
        console.warn('Notification element not found!');
    }
}


    // Function to format time
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

// Function to calculate the total hours missed based on time off
function calculateHoursMissed(startDate, endDate, startTime, endTime) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const dailyWorkHours = 8; // Assuming 8 hours workday
    const allDayHours = 8;    // Full day absence
    const workStartHour = 7;  // Work starts at 7 AM
    const workEndHour = 16;   // Work ends at 4 PM (16:00)
    const lunchStartHour = 12;
    const lunchEndHour = 13;

    let totalHours = 0;
    let currentDate = start;

    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
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
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }
    return totalHours;
}



    // Define handleLogout function
function handleLogout() {
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
}

    // Add event listeners
    document.getElementById('refresh-button').addEventListener('click', initialize);
    document.getElementById('logout-button').addEventListener('click', handleLogout);

    // Run initialization
    initialize();
});
