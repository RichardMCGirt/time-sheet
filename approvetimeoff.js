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

    function parseDate(dateStr) {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
            console.error(`Invalid date format: ${dateStr}`);
            return null; // Return null for invalid dates
        }
        return parsedDate;
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

    function calculateWorkDayHoursMissed(startDateTimeStr, endDateTimeStr, workStartTime = "7:00 AM", workEndTime = "4:00 PM") {
        // Parse the start and end datetime strings into Date objects
        const startDateTime = new Date(startDateTimeStr);
        const endDateTime = new Date(endDateTimeStr);
    
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            console.error("Invalid start or end datetime:", { startDateTimeStr, endDateTimeStr });
            return 0;
        }
    
        // Define the start and end of the workday
        const workStart = new Date(startDateTime);
        const workEnd = new Date(startDateTime);
    
        const [workStartHour, workStartMinutes, workStartPeriod] = parseTime(workStartTime);
        const [workEndHour, workEndMinutes, workEndPeriod] = parseTime(workEndTime);
    
        workStart.setHours(convertTo24Hour(workStartHour, workStartPeriod));
        workStart.setMinutes(workStartMinutes);
        workEnd.setHours(convertTo24Hour(workEndHour, workEndPeriod));
        workEnd.setMinutes(workEndMinutes);
    
        // Calculate the overlap between the workday and the time off
        const missedStart = Math.max(workStart.getTime(), startDateTime.getTime());
        const missedEnd = Math.min(workEnd.getTime(), endDateTime.getTime());
    
        // Calculate the total hours missed
        const missedHours = (missedEnd - missedStart) / (1000 * 60 * 60); // Convert milliseconds to hours
        return Math.max(0, missedHours); // Ensure non-negative hours
    }
    

    function validateTimeInput(time) {
        const timePattern = /^([01]?[0-9]|2[0-3]):?([0-5][0-9])? ?([aApP][mM])?$/;
        const match = time.match(timePattern);
        if (!match) {
            console.warn("Invalid time format. Using default:", time);
            return null;
        }
        return time; // Return the original time if valid
    }
    

    async function displayRequests(records) {
        const container = document.getElementById('requests-container');
        container.innerHTML = '';
    
        // Group records by employee name
        const groupedByEmployee = records.reduce((acc, record) => {
            const employeeName = record.fields.Name;
            if (!acc[employeeName]) acc[employeeName] = [];
            acc[employeeName].push(record);
            return acc;
        }, {});
    
        // Format date utility
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    
        // Iterate over employees
        for (const [employeeName, employeeRequests] of Object.entries(groupedByEmployee)) {
            const employeeDiv = document.createElement('div');
            employeeDiv.className = 'employee';
    
            // Filter out records that don't contain time off
            const validRequests = employeeRequests.filter(record => {
                for (let i = 1; i <= 10; i++) {
                    if (record.fields[`Time off Start Date ${i}`] && record.fields[`Time off End Date ${i}`]) {
                        return true;
                    }
                }
                return false;
            });
    
            if (validRequests.length === 0) continue; // Skip employees without valid time off records
    
            // Add employee name
            const name = document.createElement('h3');
            name.textContent = employeeName;
            employeeDiv.appendChild(name);
    
            // Fetch and display available hours
            const availableHours = await fetchAvailableHours(employeeName);
            const availablePto = document.createElement('p');
            availablePto.textContent = `Available PTO: ${availableHours.availablePTO}`;
            employeeDiv.appendChild(availablePto);
    
            const availablePersonalHours = document.createElement('p');
            availablePersonalHours.textContent = `Available Personal Hours: ${availableHours.availablePersonalHours}`;
            employeeDiv.appendChild(availablePersonalHours);
    
            const requestsRow = document.createElement('div');
            requestsRow.className = 'requests-row';
    
            // Process each valid request for the employee
            validRequests.forEach((record, recordIndex) => {
                for (let i = 1; i <= 10; i++) {
                    const startDateStr = record.fields[`Time off Start Date ${i}`];
                    const endDateStr = record.fields[`Time off End Date ${i}`];
                    const startTimeStr = record.fields[`Time off Start Time ${i}`] || '7:00 AM';
                    const endTimeStr = record.fields[`Time off End Time ${i}`] || '4:00 PM';
    
                    // Skip if dates are invalid
                    if (!startDateStr || !endDateStr) continue;
    
                    const startDate = new Date(startDateStr);
                    const endDate = new Date(endDateStr);
    
                    let currentDate = new Date(startDate);
    
                    while (currentDate <= endDate) {
                        // Format date and time for the current day
                        const formattedCurrentDate = dateFormatter.format(currentDate);
                        const formattedStartTime = currentDate.toDateString() === startDate.toDateString() ? formatTime(startTimeStr) : '7:00 AM';
                        const formattedEndTime = currentDate.toDateString() === endDate.toDateString() ? formatTime(endTimeStr) : '4:00 PM';
    
                        const formattedStartDateTime = `${formattedCurrentDate} ${formattedStartTime}`;
                        const formattedEndDateTime = `${formattedCurrentDate} ${formattedEndTime}`;
    
                        // Calculate workday hours missed and factor in lunch break (12 PM - 1 PM)
                        let hoursMissed = calculateWorkDayHoursMissed(formattedStartDateTime, formattedEndDateTime);
    
                        const startHour = new Date(formattedStartDateTime).getHours();
                        const endHour = new Date(formattedEndDateTime).getHours();
    
                        // Subtract 1 hour for lunch if the time range includes 12 PM - 1 PM
                        if (startHour < 13 && endHour > 12) {
                            hoursMissed = Math.max(0, hoursMissed - 1);
                        }
    
                        // Compare consecutive days for the same employee
                        const isConsecutive = validRequests.some((compareRecord, compareIndex) => {
                            if (recordIndex === compareIndex) return false;
                            const compareStartDateStr = compareRecord.fields[`Time off Start Date 1`];
                            const compareEndDateStr = compareRecord.fields[`Time off End Date 1`];
    
                            if (!compareStartDateStr || !compareEndDateStr) return false;
    
                            const compareStartDate = new Date(compareStartDateStr);
                            const compareEndDate = new Date(compareEndDateStr);
    
                            return (
                                (startDate.getTime() === compareEndDate.getTime() + 86400000) ||
                                (endDate.getTime() + 86400000 === compareStartDate.getTime())
                            );
                        });
    
                        // Create and populate request div
                        const requestDiv = document.createElement('div');
                        requestDiv.className = 'request';
    
                        const startDateTimeElement = document.createElement('p');
                        startDateTimeElement.textContent = `Start: ${formattedStartDateTime}`;
                        requestDiv.appendChild(startDateTimeElement);
    
                        const endDateTimeElement = document.createElement('p');
                        endDateTimeElement.textContent = `End: ${formattedEndDateTime}`;
                        requestDiv.appendChild(endDateTimeElement);
    
                        const missedHoursElement = document.createElement('p');
                        missedHoursElement.textContent = `Workday Hours Missed: ${hoursMissed.toFixed(2)}`;
                        requestDiv.appendChild(missedHoursElement);

                        const approvalCheckbox = document.createElement('input');
                        approvalCheckbox.type = 'checkbox';
                        approvalCheckbox.checked = record.fields[`Time off Approved ${i}`] || false; // Use the correct field or default to false
                        approvalCheckbox.dataset.recordId = record.id;
                        approvalCheckbox.dataset.approvalIndex = i;
                        approvalCheckbox.addEventListener('change', handleApprovalChange);
                        requestDiv.appendChild(approvalCheckbox);
                        
    
                        if (isConsecutive) {
                            const consecutiveElement = document.createElement('p');
                            consecutiveElement.textContent = 'Consecutive Day Request';
                            consecutiveElement.style.color = 'blue';
                            requestDiv.appendChild(consecutiveElement);
                        }
    
                        // Highlight overlapping requests in red
                        const hasOverlap = validRequests.some((compareRecord, compareIndex) => {
                            if (compareRecord === record) return false;
    
                            for (let j = 1; j <= 10; j++) {
                                const compareStartDateStr = compareRecord.fields[`Time off Start Date ${j}`];
                                const compareEndDateStr = compareRecord.fields[`Time off End Date ${j}`];
    
                                if (!compareStartDateStr || !compareEndDateStr) continue;
    
                                const compareStartDate = new Date(compareStartDateStr);
                                const compareEndDate = new Date(compareEndDateStr);
    
                                if (isOverlapping(new Date(currentDate), new Date(currentDate), compareStartDate, compareEndDate)) {
                                    return true;
                                }
                            }
                            return false;
                        });
    
                        if (hasOverlap) requestDiv.style.color = 'red';
    
                        requestsRow.appendChild(requestDiv);
    
                        // Move to the next day
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            });
    
            employeeDiv.appendChild(requestsRow);
            container.appendChild(employeeDiv);
        }
    }
    
    function isOverlapping(startDate1, endDate1, startDate2, endDate2) {
        return startDate1 <= endDate2 && startDate2 <= startDate1;
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
            return null; // Return null if invalid
        }
    
        const timePattern = /^([01]?[0-9]|2[0-3]):?([0-5][0-9])? ?([aApP][mM])?$/;
        const match = time.match(timePattern);
    
        if (!match) {
            console.warn("Invalid time format:", time);
            return null;
        }
    
        let [, hours, minutes, period] = match;
        hours = hours.padStart(2, '0');
        minutes = minutes || '00';
        period = period ? period.toUpperCase() : 'AM';
    
        return `${hours}:${minutes} ${period}`;
    }
    
    function parseTime(time) {
        const timePattern = /^([01]?[0-9]|2[0-3]):?([0-5][0-9])? ?([aApP][mM])?$/;
        const match = time.match(timePattern);
    
        if (!match) {
            console.error("Invalid time format:", time);
            return [null, null, null];
        }
    
        const hours = parseInt(match[1], 10);
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const period = match[3] ? match[3].toUpperCase() : null;
    
        return [hours, minutes, period];
    }
    
    function convertTo24Hour(hours, period) {
        if (period === "AM" && hours === 12) return 0;
        if (period === "PM" && hours < 12) return hours + 12;
        return hours;
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
