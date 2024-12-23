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

    userEmailElement.textContent = userEmail;

    async function fetchSupervisorName(email) {
        try {
            const supervisorUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            const response = await fetch(supervisorUrl, { headers });
            const data = await response.json();
            if (data.records.length > 0) {
                return data.records[0].fields['Name'];
            } else {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error fetching supervisor name:', error);
            window.location.href = 'index.html';
        }
    }

    async function fetchRequests(supervisorName) {
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
            displayRequests(supervisorRequests);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    }

    async function fetchAvailableHours(employeeName) {
        try {
            const employeeUrl = `https://api.airtable.com/v0/${ptoBaseId}/${ptoTableId}?filterByFormula=${encodeURIComponent(`{Full Name}='${employeeName}'`)}`;
            const response = await fetch(employeeUrl, { headers });
            const data = await response.json();

            if (data.records.length > 0) {
                const employee = data.records[0].fields;
                const availablePTO = employee['PTO Total'] || 0;
                const availablePersonalHours = employee['Personaltime'] || 0;
                return { availablePTO, availablePersonalHours };
            } else {
                return { availablePTO: 0, availablePersonalHours: 0 };
            }
        } catch (error) {
            console.error('Error fetching available hours:', error);
            return { availablePTO: 0, availablePersonalHours: 0 };
        }
    }

    async function displayRequests(records) {
        const container = document.getElementById('requests-container');
        container.innerHTML = '';

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

                const dateFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'America/New_York',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });

                employeeRequests.forEach(record => {
                    for (let i = 1; i <= 10; i++) {
                        const startDateStr = record.fields[`Time off Start Date ${i}`];
                        const endDateStr = record.fields[`Time off End Date ${i}`];
                        const startTimeStr = record.fields[`Time off Start Time ${i}`] || '7:00 AM';
                        const endTimeStr = record.fields[`Time off End Time ${i}`] || '4:00 PM';
                        const approved = record.fields[`Time off Approved ${i}`] || false;

                        if (startDateStr) {
                            let startDate = new Date(`${startDateStr}T00:00:00-05:00`);
                            let endDate = new Date(`${endDateStr}T00:00:00-05:00`);
                            

// Convert to local date strings before passing to `calculateHoursMissed`.
const localStartDateStr = startDate.toISOString().split('T')[0];
const localEndDateStr = endDate.toISOString().split('T')[0];


                            const formattedStartDate = dateFormatter.format(startDate);
                            const formattedEndDate = dateFormatter.format(endDate);

                            const requestDiv = document.createElement('div');
                            requestDiv.className = 'request';

                            const startDateElement = document.createElement('p');
                            startDateElement.textContent = `Start Date: ${formattedStartDate}`;
                            requestDiv.appendChild(startDateElement);

                            const startTime = document.createElement('p');
                            startTime.textContent = `Start Time: ${formatTime(startTimeStr)}`;
                            requestDiv.appendChild(startTime);

                            const endDateElement = document.createElement('p');
                            endDateElement.textContent = `End Date: ${formattedEndDate}`;
                            requestDiv.appendChild(endDateElement);

                            const endTime = document.createElement('p');
                            endTime.textContent = `End Time: ${formatTime(endTimeStr)}`;
                            requestDiv.appendChild(endTime);

                            const hoursMissed = calculateHoursMissed(localStartDateStr, localEndDateStr, startTimeStr, endTimeStr);
                            const missedHours = document.createElement('p');
                            console.log("Hours Missed Calculated:", hoursMissed);
                            missedHours.textContent = `Hours Missed: ${hoursMissed}`;
                                                        requestDiv.appendChild(missedHours);

                            const approvalCheckbox = document.createElement('input');
                            approvalCheckbox.type = 'checkbox';
                            approvalCheckbox.checked = approved;
                            approvalCheckbox.dataset.recordId = record.id;
                            approvalCheckbox.dataset.approvalIndex = i;
                            approvalCheckbox.addEventListener('change', handleApprovalChange);
                            requestDiv.appendChild(approvalCheckbox);

                            requestsRow.appendChild(requestDiv);
                        }
                    }
                });

                employeeDiv.appendChild(requestsRow);
                container.appendChild(employeeDiv);
            }
        }
    }

    function isOverlapping(startDate1, endDate1, startDate2, endDate2) {
        return startDate1 <= endDate2 && startDate2 <= endDate1;
    }

    async function handleApprovalChange(event) {
        const checkbox = event.target;
        const recordId = checkbox.dataset.recordId;
        const approvalIndex = checkbox.dataset.approvalIndex;
        const approved = checkbox.checked;

        console.log(`Updating approval for recordId ${recordId}, index ${approvalIndex}:`, approved);

        const denialReasonSelect = document.querySelector(`select[data-record-id="${recordId}"][data-approval-index="${approvalIndex}"]`);

       
        const updateUrl = `${url}/${recordId}`;
        const data = {
            fields: {
                [`Reason ${approvalIndex}`]: '',
                [`Time off Approved ${approvalIndex}`]: approved
            }
        };

        try {
            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error('Failed to update approval status');
            }
            showNotification('Record saved successfully!');
        } catch (error) {
            console.error('Error updating approval status:', error);
        }
    }

    function formatTime(time, isStartTime = true) {
        if (!time || time.toLowerCase() === 'all day') {
            return 'All Day';
        }

        const timePattern = /^([01]?[0-9]|2[0-3]):?([0-5][0-9])? ?([aApP][mM])?$/;
        const match = time.match(timePattern);

        if (!match) {
            return isStartTime ? '07:00 AM' : '04:00 PM';
        }

        let [, hours, minutes, period] = match;
        hours = hours.padStart(2, '0');
        minutes = minutes ? minutes.padEnd(2, '0') : '00';
        period = period ? period.toUpperCase() : (isStartTime ? 'AM' : 'PM');

        if (!period && hours >= 12) {
            period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
        }

        return `${hours}:${minutes} ${period}`;
    }

    function calculateHoursMissed(startDate, endDate, startTime, endTime) {
        console.log("Calculating hours missed...");
        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);
        console.log("Start Time:", startTime);
        console.log("End Time:", endTime);
    
        const defaultStartTime = "7:00 AM"; // Default work start time
        const defaultEndTime = "4:00 PM"; // Default work end time
    
        // Handle default times if they are 12:00 AM or not provided
        startTime = (startTime === "12:00 AM" || !startTime) ? defaultStartTime : startTime;
        endTime = (endTime === "12:00 AM" || !endTime) ? defaultEndTime : endTime;
    
        console.log("Adjusted Start Time:", startTime);
        console.log("Adjusted End Time:", endTime);
    
        const start = new Date(startDate);
        const end = new Date(endDate);
    
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.log("Invalid date(s). Returning 0 hours missed.");
            return 0;
        }
    
        // Check if the range spans only one workday
        if (startDate === endDate || (startTime === defaultStartTime && endTime === defaultEndTime && end.getTime() - start.getTime() <= 86400000)) {
            console.log("Single workday or one full day across dates. Hours Missed: 8");
            return 8;
        }
    
        let totalHoursMissed = 0;
        let currentDate = new Date(start);
    
        // Handle multi-day ranges
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
            console.log("Day of Week for", currentDate.toDateString(), ":", dayOfWeek);
    
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
                // Add full workday hours (8 hours minus lunch if applicable)
                if (
                    currentDate.toDateString() === start.toDateString() ||
                    currentDate.toDateString() === end.toDateString()
                ) {
                    // Only count one workday if it spans start and end
                    totalHoursMissed += 8;
                    console.log("Added 8 hours for:", currentDate.toDateString());
                    break;
                } else {
                    totalHoursMissed += 8;
                    console.log("Added 8 hours for:", currentDate.toDateString());
                }
            } else {
                console.log("Skipping weekend date:", currentDate.toDateString());
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        console.log("Final Total Hours Missed:", totalHoursMissed);
        return totalHoursMissed;
    }
    
    
    
    
    function calculateDayHours(date, startTime, endTime) {
        const currentDateStr = new Date(date).toDateString();
        const workStart = new Date(`${currentDateStr} ${startTime}`);
        const workEnd = new Date(`${currentDateStr} ${endTime}`);
    
        const lunchStart = new Date(currentDateStr).setHours(12, 0, 0); // 12:00 PM
        const lunchEnd = new Date(currentDateStr).setHours(13, 0, 0); // 1:00 PM
    
        console.log("Work Start:", workStart);
        console.log("Work End:", workEnd);
        console.log("Lunch Start:", new Date(lunchStart));
        console.log("Lunch End:", new Date(lunchEnd));
    
        let hoursMissed = (workEnd - workStart) / (1000 * 60 * 60); // Total hours worked
    
        // Subtract lunch break if it overlaps with working hours
        if (workStart < lunchEnd && workEnd > lunchStart) {
            hoursMissed -= 1; // Subtract 1 hour for lunch
            console.log("Adjusted hours missed (after lunch):", hoursMissed);
        }
    
        return Math.max(0, hoursMissed); // Ensure hours missed is not negative
    }
    
    
    
    
    
    
    

    function showNotification(message) {
        if (notificationElement) {
            notificationElement.textContent = message;
            notificationElement.style.display = 'block';

            setTimeout(() => {
                notificationElement.style.display = 'none';
            }, 3500);
        }
    }

    async function initialize() {
        const supervisorName = await fetchSupervisorName(userEmail);
        if (supervisorName) {
            fetchRequests(supervisorName);
        }
    }

    document.getElementById('refresh-button').addEventListener('click', initialize);
    document.getElementById('logout-button').addEventListener('click', handleLogout);

    function handleLogout() {
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    }

    initialize();
});
