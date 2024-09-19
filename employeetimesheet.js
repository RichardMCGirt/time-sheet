document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbl8znXria2leJfUd';
    const table2Id = 'tbljmLpqXScwhiWTt';
    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    const timesheetsBody = document.getElementById('timesheets-body');
    const checkAllButton = document.getElementById('check-all-button');
    const logoutButton = document.getElementById('logout-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadingScreen = document.getElementById('loading-screen');
    const loadingLogo = document.getElementById('loading-logo');
    const mainContent = document.getElementById('main-content');

    // Define the header element here
    const headerElement = document.querySelector('header');
    const navElement = document.querySelector('nav'); // Define nav element

    
    // Elements to hide during data fetching
    const titleElement = document.querySelector('h1');
    const messageContainer = document.getElementById('message-container');
    const keyEnterHint = document.querySelector('p');



    if (userEmailElement) {
        console.log(`Setting user email: ${supervisorEmail}`);
        userEmailElement.textContent = supervisorEmail;
        userEmailElement.classList.add('clickable');
        userEmailElement.addEventListener('click', () => {
            console.log('User email clicked, navigating to timesheet.html');
            window.location.href = 'timesheet.html';
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log('Logout button clicked, navigating to index.html');
            window.location.href = 'index.html';
        });
    }


     // Hide elements during data fetching
     headerElement.style.display = 'none'; // Hide header
     navElement.style.display = 'none';    // Hide nav
     titleElement.style.display = 'none';
     messageContainer.style.display = 'none';
     checkAllButton.style.display = 'none';
     keyEnterHint.style.display = 'none';

// Handle the loading screen
console.log('Starting loading screen sequence');
setTimeout(() => {
    console.log('Applying full-color transition to loading logo');
    loadingLogo.classList.add('full-color');

    setTimeout(() => {
        // Start the transition to fade out the loading screen
        loadingScreen.classList.add('fade-out');

        // After the transition, hide the loading screen and show the main content
        setTimeout(() => {
            loadingScreen.classList.add('hidden'); // Hide the loading screen
            mainContent.style.display = 'block'; // Show the main content
        }, 700); // Matches the fade-out duration
    }, 1000); // Simulate a delay for data loading, adjust as needed
}, 1000);



async function loadDataAndInitializePage() {
    console.log(`Fetching supervisor name for email: ${supervisorEmail}`);
    const supervisorName = await fetchSupervisorName(supervisorEmail);
    if (supervisorName) {
        console.log(`Supervisor found: ${supervisorName}`);
        await fetchTimesheets(supervisorName);
    } else {
        console.error(`Supervisor not found for email: ${supervisorEmail}`);
        alert("Supervisor not found. Please check your email and try again.");
    }

    // Show the header, nav, and other elements after the data is loaded
    headerElement.style.display = ''; // Show the header after loading
    navElement.style.display = '';    // Show the nav after loading
    titleElement.style.display = '';  // Show the title
    messageContainer.style.display = ''; // Show the message container
    checkAllButton.style.display = ''; // Show the check all button
    keyEnterHint.style.display = ''; // Show the key enter hint
}

loadDataAndInitializePage();
    
    
    

    async function fetchSupervisorName(email) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${email}')`;
        console.log(`Fetching supervisor name from Airtable with endpoint: ${endpoint}`);
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch supervisor name: ${response.statusText}`);
            const data = await response.json();
            console.log('Supervisor data fetched:', data);
            return data.records.length > 0 ? data.records[0].fields['Full Name'] : null;
        } catch (error) {
            console.error(error);
            alert("Error fetching supervisor data. Please try again later.");
            return null;
        }
    }

    async function fetchEmployeeName(employeeNumber) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Employee Number}='${employeeNumber}')`;
        console.log(`Fetching employee name from Airtable with endpoint: ${endpoint}`);
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch employee name: ${response.statusText}`);
            const data = await response.json();
            console.log('Employee data fetched:', data);
            return data.records.length > 0 ? data.records[0].fields['Full Name'] : 'Unknown';
        } catch (error) {
            console.error(error);
            alert("Error fetching employee data. Please try again later.");
            return 'Unknown';
        }
    }

    function calculateHours(start, end, lunchStart, lunchEnd, additionalIn, additionalOut) {
        if (!start || !end) return 0; // If start or end time is missing, return 0
    
        const startTime = new Date(`1970-01-01T${start}:00`);
        const endTime = new Date(`1970-01-01T${end}:00`);
        const lunchStartTime = lunchStart ? new Date(`1970-01-01T${lunchStart}:00`) : null;
        const lunchEndTime = lunchEnd ? new Date(`1970-01-01T${lunchEnd}:00`) : null;
        const additionalInTime = additionalIn ? new Date(`1970-01-01T${additionalIn}:00`) : null;
        const additionalOutTime = additionalOut ? new Date(`1970-01-01T${additionalOut}:00`) : null;
    
        // Calculate worked hours between start and end time
        let workedHours = (endTime - startTime) / (1000 * 60 * 60); // Convert milliseconds to hours
    
        // Subtract lunch break time if both lunch start and end are provided
        if (lunchStartTime && lunchEndTime) {
            const lunchHours = (lunchEndTime - lunchStartTime) / (1000 * 60 * 60);
            workedHours -= lunchHours;
        }
    
        // Add the additional in/out time if both are provided
        if (additionalInTime && additionalOutTime) {
            const additionalHours = (additionalOutTime - additionalInTime) / (1000 * 60 * 60);
            workedHours += additionalHours; // Add additional hours worked
        }
    
        return workedHours > 0 ? workedHours.toFixed(2) : 0; // Return total worked hours, rounded to 2 decimal places
    }
    
    function formatDateToMMDDYYYY(dateString) {
        if (!dateString) return ''; // Return empty string if date is not available
    
        // Append 'T00:00:00Z' to treat the date as UTC
        const date = new Date(`${dateString}T00:00:00Z`);
    
        const month = (date.getUTCMonth() + 1).toString().padStart(2, ''); // Get month (UTC)
        const day = date.getUTCDate().toString().padStart(2, ''); // Get day (UTC)
        const year = date.getUTCFullYear(); // Get year (UTC)
    
        return `${month}/${day}/${year}`;
    }
    
    

    function generateRows(fields, recordId, employeeNumber) {
        console.log('Generating rows for timesheet');
        console.log('Generating rows for record:', recordId); // Debugging to check `recordId`

        let totalHoursWorked = 0;  // Initialize total hours worked across all days.
        let totalOvertimeHours = 0;  // Initialize total overtime hours.
        let giftedHours = 0; // Initialize gifted hours.
    
        // Helper function to calculate hours worked and accumulate total and gifted hours
        function calculateAndAccumulateHours(day) {
            const start = fields[`start${day}`] || '';
            const end = fields[`end${day}`] || '';
            const lunchStart = fields[`lunchs${day}`] || '';
            const lunchEnd = fields[`lunche${day}`] || '';
            const additionalIn = fields[`additionali${day}`] || '';
            const additionalOut = fields[`additionalo${day}`] || '';
    
            // Calculate hours worked for the current day
            const hours = calculateHours(start, end, lunchStart, lunchEnd, additionalIn, additionalOut);
            totalHoursWorked += parseFloat(hours) || 0;  // Accumulate total hours worked
    
            return hours;
        }
    
        // Iterate over all days (1-7) to generate rows
        const rows = [1, 2, 3, 4, 5, 6, 7].map(day => `
        <tr>
            <th><input type="time" name="start${day}" value="${fields[`start${day}`] || ''}" disabled></th>
            <th><input type="time" name="lunchs${day}" value="${fields[`lunchs${day}`] || ''}" disabled></th>
            <th><input type="time" name="lunche${day}" value="${fields[`lunche${day}`] || ''}" disabled></th>
            <th><input type="time" name="end${day}" value="${fields[`end${day}`] || ''}" disabled></th>
            <th><input type="time" name="additionali${day}" value="${fields[`additionali${day}`] || ''}" disabled></th>
            <th><input type="time" name="additionalo${day}" value="${fields[`additionalo${day}`] || ''}" disabled></th>
            <th>${calculateAndAccumulateHours(day)}</th>
        </tr>
    `).join('');

    
        // Calculate gifted hours
        if (totalHoursWorked > 0 && totalHoursWorked < 40) {
            giftedHours = Math.min(3, 40 - totalHoursWorked);  // Gifted hours between 0-3, ensuring total does not exceed 40
        }
        
    
        // Fetch values of Total Personal Hours, Total PTO Hours, and Total Holiday Hours from Airtable fields
        const totalPersonalHours = parseFloat(fields['Total Personal Hours'] || 0);
        const totalPtoHours = parseFloat(fields['Total PTO Hours'] || 0);
        const totalHolidayHours = parseFloat(fields['Total Holiday Hours'] || 0);
    
        // Sum of gifted hours and the additional Airtable fields
        const totalGiftedHours = giftedHours + totalPersonalHours + totalPtoHours + totalHolidayHours;
    
        // Add a row for total hours worked, gifted hours, and each of the additional hour types if they are greater than 0
        let totalRow = '';

// Add a row for total hours worked only if it doesn't match total gifted, PTO, holiday, and personal hours
if (totalHoursWorked > 0 && totalHoursWorked !== (totalHoursWorked + totalGiftedHours + totalHolidayHours + totalPtoHours + totalPersonalHours)) {
    totalRow += `
        <tr>
        <td colspan="5" style="border: none;"></td>
                    <td class="narrow-border" style="text-align:right; border-top: 4px solid white; border-left: 4px solid white; width: 30%;">Total Hours Worked:</td>
            <td style="border-top: 4px solid white;  border-right: 4px solid white; width: 10%;">${totalHoursWorked.toFixed(2)}</td>
        </tr>
    `;
}

if (giftedHours > 0) {
    totalRow += `
        <tr>
        <td colspan="5" style="border: none;"></td>
                    <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">Gifted Hours:</td>
            <td style="border-right: 4px solid white; width: 10%;">${giftedHours.toFixed(2)}</td>
        </tr>
    `;
}

if (totalPersonalHours > 0) {
    totalRow += `
        <tr>
        <td colspan="5" style="border: none;"></td>            <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">Personal Hours:</td>
            <td style="border-right: 4px solid white; width: 10%;">${totalPersonalHours.toFixed(2)}</td>
        </tr>
    `;
}

if (totalPtoHours > 0) {
    totalRow += `
        <tr>
        <td colspan="5" style="border: none;"></td>            <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">PTO Hours:</td>
            <td style="border-right: 4px solid white; width: 10%;">${totalPtoHours.toFixed(2)}</td>
        </tr>
    `;
}

if (totalHolidayHours > 0) {
    totalRow += `
        <tr>
        <td colspan="5" style="border: none;"></td>            <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">Holiday Hours:</td>
            <td style="border-right: 4px solid white; width: 10%;">${totalHolidayHours.toFixed(2)}</td>
        </tr>
    `;
}

// Always show the total hours combined from all sources
totalRow += `
    <tr>
    <td colspan="5" style="border: none;"></td>        <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">Total Hours :</td>
        <td style="border-right: 4px solid white; width: 10%;">${(totalHoursWorked + totalGiftedHours + totalHolidayHours + totalPtoHours + totalPersonalHours).toFixed(2)}</td>
    </tr>
`;

// Add a row for overtime hours if any
if (totalOvertimeHours > 0) {
    totalRow += `
        <tr>
        <td colspan="5" style="border: none;"></td>            <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">Overtime Hours (over 40):</td>
            <td style="border-right: 4px solid white; width: 10%;">${totalOvertimeHours.toFixed(2)}</td>
        </tr>
    `;
}

// Add the approval checkbox as the last row
totalRow += `
    <tr>
    <td colspan="5" style="border: none;"></td>        <td class="narrow-border" style="text-align:right; border-bottom: 4px solid white; border-left: 4px solid white; width: 30%;">Approval :</td>
        <td style="border-bottom: 4px solid white; border-right: 4px solid white; width: 10%;">
        <input type="checkbox" class="approve-checkbox" 
               data-record-id="${recordId}" 
               ${fields['Approved'] === true ? 'checked' : ''}>
      </td>
    </tr>
`;



console.log(`Employee Number: ${employeeNumber}, Approved: ${fields['Approved']}`);


return rows + totalRow;
}
    

    


      

async function fetchTimesheets(supervisorName) {
    let filterFormula;

    if (supervisorEmail === 'katy@vanirinstalledsales.com') {
        filterFormula = '{Employee Number}!=BLANK()';
    } else if (supervisorEmail === 'josh@vanirinstalledsales.com' || supervisorEmail === 'ethen.wilson@vanirinstalledsales.com') {
        filterFormula = `OR({Supervisor}='Josh Boyd', {Supervisor}='Ethen Wilson')`;
    } else {
        filterFormula = `AND({Supervisor}='${supervisorName}', {Employee Number}!=BLANK())`;
    }

    let allRecords = [];
    let offset = null; // Used for pagination

    do {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Employee Number&sort[0][direction]=asc${offset ? `&offset=${offset}` : ''}`;
        console.log(`Fetching timesheets with endpoint: ${endpoint}`);

        try {
            loadingIndicator.style.display = 'block'; // Show loading indicator
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch timesheets: ${response.statusText}`);
            const data = await response.json();
            allRecords = allRecords.concat(data.records); // Append new records to the list

            offset = data.offset; // Get the next page's offset if available
        } catch (error) {
            console.error(error);
            alert("Error fetching timesheet data. Please try again later.");
            return;
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading indicator
        }
    } while (offset); // Continue fetching as long as there's an offset (i.e., more pages)

    // Fetch approval status from table2Id
    const approvedData = await fetchApprovedStatus();
    await populateTimesheets(allRecords, approvedData); // Pass all records and approval data to populateTimesheets
}



    async function fetchTimesheets(supervisorName) {
        let filterFormula;
        
        if (supervisorEmail === 'katy@vanirinstalledsales.com') {
            filterFormula = '{Employee Number}!=BLANK()';
        } else if (supervisorEmail === 'josh@vanirinstalledsales.com' || supervisorEmail === 'ethen.wilson@vanirinstalledsales.com') {
            filterFormula = `OR({Supervisor}='Josh Boyd', {Supervisor}='Ethen Wilson')`;
        } else {
            filterFormula = `AND({Supervisor}='${supervisorName}', {Employee Number}!=BLANK())`;
        }
    
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Employee Number&sort[0][direction]=asc`;
        console.log(`Fetching timesheets with endpoint: ${endpoint}`);
        
        try {
            loadingIndicator.style.display = 'block'; // Show loading indicator
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch timesheets: ${response.statusText}`);
            const data = await response.json();
            console.log('Timesheets data fetched:', data);
            
            // Fetch approval status from table2Id
            const approvedData = await fetchApprovedStatus();
            await populateTimesheets(data.records, approvedData);
        } catch (error) {
            console.error(error);
            alert("Error fetching timesheet data. Please try again later.");
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading indicator
            titleElement.style.display = '';
            messageContainer.style.display = '';
            checkAllButton.style.display = '';
            keyEnterHint.style.display = '';
        }
    }

    async function fetchApprovedStatus() {
        let allRecords = [];
        let offset = null;
    
        do {
            const endpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}${offset ? `?offset=${offset}` : ''}`;
            console.log(`Fetching approved status with endpoint: ${endpoint}`);
        
            try {
                const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
                if (!response.ok) throw new Error(`Failed to fetch approved status: ${response.statusText}`);
                const data = await response.json();
                allRecords = allRecords.concat(data.records);
        
                offset = data.offset;
            } catch (error) {
                console.error('Error fetching approved status:', error);
                return {};
            }
        } while (offset);
        
        return allRecords.reduce((acc, record) => {
            const employeeNumber = record.fields['Employee Number'];
            const approved = record.fields['Approved'] ?? false;
            const date7 = record.fields['date7'] || '';
            acc[employeeNumber] = { approved, date7 };
            console.log(`Employee Number: ${employeeNumber}, Approved: ${approved}, date7: ${date7}`);
            return acc;
        }, {});
    }

    async function populateTimesheets(records, approvedData) {
        console.log('Populating timesheets');
        timesheetsBody.innerHTML = '';
    
        if (records.length > 0) {
            for (const record of records) {
                const fields = record.fields;
                const employeeNumber = fields['Employee Number'];
    
                if (!employeeNumber) continue;
    
                const employeeName = await fetchEmployeeName(employeeNumber);
                const hasValues = checkTimesheetValues(fields);
    
                // Get the approval status and date7 value from approvedData
                const { approved: approvalStatus, date7 } = approvedData[employeeNumber] || { approved: false, date7: '' };
    
                // Format date7 to mm/dd/yyyy
                const formattedDate7 = formatDateToMMDDYYYY(date7);
    
                let totalHoursWorked = 0;
                for (let day = 1; day <= 7; day++) {
                    totalHoursWorked += parseFloat(calculateHours(fields[`start${day}`], fields[`end${day}`], fields[`lunchs${day}`], fields[`lunche${day}`], fields[`additionali${day}`], fields[`additionalo${day}`])) || 0;
                }
    
                const nameContainer = document.createElement('div');
                nameContainer.classList.add('name-container');
                nameContainer.textContent = `${employeeName}  ${formattedDate7}`;
                nameContainer.setAttribute('data-record-id', record.id);
                nameContainer.setAttribute('data-employee-number', employeeNumber);
                nameContainer.addEventListener('click', () => {
                    console.log(`Toggling visibility for record ID: ${record.id}`);
                    toggleVisibility(record.id);
                });
                nameContainer.classList.add('clickable');
    
                if (totalHoursWorked === 0) {
                    nameContainer.style.color = 'red';
                }
                timesheetsBody.appendChild(nameContainer);
    
                const table = document.createElement('table');
                table.classList.add('time-entry-table');
                table.setAttribute('data-record-id', record.id);
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th class="narrow-column">Start Time</th>
                            <th class="narrow-column">Lunch Start</th>
                            <th class="narrow-column">Lunch End</th>
                            <th class="narrow-column">End Time</th>
                            <th class="narrow-column">Additional Time in</th>
                            <th class="narrow-column">Additional Time out</th>
                            <th>Hours Worked</th> 
                        </tr>
                    </thead>
                    <tbody>
                        ${generateRows(fields, record.id, employeeNumber)}
                    </tbody>
                `;
                console.log(`Employee Number: ${employeeNumber}, Approved: ${approvalStatus}`);
    
                // Fetch the approved status from approvedData and log it
                console.log(`Setting checkbox for Employee Number: ${employeeNumber}, Approved Status: ${approvalStatus}`);
    
                // Update the checkbox with the approval status
                const approveCheckbox = table.querySelector('.approve-checkbox');
                if (approveCheckbox) {
                    approveCheckbox.checked = approvalStatus; // Set checked based on the approval status
                    approveCheckbox.setAttribute('data-employee-number', employeeNumber);
                    approveCheckbox.addEventListener('change', handleCheckboxChange);
                }
    
                if (supervisorEmail !== 'katy@vanirinstalledsales.com' && approvalStatus) {
                    table.style.display = 'none'; // Hide approved rows for non-Katy users
                }
    
                timesheetsBody.appendChild(table);
            }
        } else {
            console.log('No records found for the supervisor');
            const noRecordsRow = document.createElement('div');
            noRecordsRow.classList.add('name-container');
            noRecordsRow.textContent = `No records found for the supervisor: ${supervisorEmail}`;
            timesheetsBody.appendChild(noRecordsRow);
        }
    }

    function checkTimesheetValues(fields) {
        console.log('Checking timesheet values');
        return fields['Total Hours Worked'] || fields['PTO Time Used'] || fields['Personal Time Used'] || fields['Holiday Hours Used'];
    }
    
    function toggleVisibility(recordId) {
        const nameContainer = timesheetsBody.querySelector(`.name-container[data-record-id="${recordId}"]`);
        const table = timesheetsBody.querySelector(`.time-entry-table[data-record-id="${recordId}"]`);

        if (nameContainer && table) {
            console.log(`Toggling table visibility for record ID: ${recordId}`);
            table.style.display = table.style.display === 'none' ? '' : 'none';
            nameContainer.classList.toggle('hidden', table.style.display === 'none');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.approve-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckboxChange);
        });
    });

   // Handling the checkbox change and passing `recordId`
   function handleCheckboxChange(event) {
    const checkbox = event.target;
    const recordId = checkbox.getAttribute('data-record-id'); // This is likely the record ID
    const employeeNumber = checkbox.getAttribute('data-employee-number'); // Use this to get the employee number
    const isApproved = checkbox.checked;

    console.log(`Checkbox clicked. Record ID: ${recordId}, Employee Number: ${employeeNumber}, Approved: ${isApproved}`);

    if (employeeNumber) {
        updateApprovalStatus(employeeNumber, isApproved);
    } else {
        console.error('Employee Number is not defined');
    }
}

    
async function updateApprovalStatus(employeeNumber, isApproved, isNotApproved) {
    const approvedEndpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}?filterByFormula=AND({Employee Number}='${employeeNumber}')`;
    
    try {
        const response = await fetch(approvedEndpoint, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        if (data.records.length === 0) {
            throw new Error(`No record found for Employee Number: ${employeeNumber}`);
        }

        const recordId = data.records[0].id;
        const endpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}/${recordId}`;
        const bodyFields = {};

        console.log(`Updating approval status for Employee Number: ${employeeNumber}, Record ID: ${recordId}, Approved: ${isApproved}`);
        
        if (isApproved !== null) bodyFields.Approved = isApproved;
        if (isNotApproved !== null) bodyFields['Timesheet Not Approved Reason'] = isNotApproved === '' ? '' : isNotApproved;

        if (Object.keys(bodyFields).length === 0) return;

        const body = JSON.stringify({ fields: bodyFields });

        const updateResponse = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body,
        });
        
        if (!updateResponse.ok) {
            const errorMessage = await updateResponse.text();
            throw new Error(`Failed to update approval status: ${updateResponse.statusText}. Error message: ${errorMessage}`);
        }

        const updatedData = await updateResponse.json();
        console.log('Approval status updated:', updatedData);
        displaySuccessMessage("Record successfully updated");

    } catch (error) {
        console.error('Error updating approval status:', error);
    }
}


    loadDataAndInitializePage();


    async function fetchSingleRecord(recordId) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}/${recordId}`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            console.log('Fetched record:', data);
            // Log the fields of the record to see available fields
            console.log('Fields:', data.fields);
        } catch (error) {
            console.error('Error fetching record:', error);
        }
    }
    
    document.querySelectorAll('.approve-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            const recordId = event.target.getAttribute('data-record-id');  // Get the recordId
            fetchSingleRecord(recordId);  // Trigger the function
        });
    });
    

    async function updateApprovalStatus(employeeNumber, isApproved, isNotApproved) {
        // Fetch the record ID from table2Id based on Employee Number
        const approvedEndpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}?filterByFormula=AND({Employee Number}='${employeeNumber}')`;
        
        try {
            const response = await fetch(approvedEndpoint, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
    
            const data = await response.json();
            if (data.records.length === 0) {
                throw new Error(`No record found for Employee Number: ${employeeNumber}`);
            }
    
            const recordId = data.records[0].id;  // Get record ID from table2Id
            const endpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}/${recordId}`;
            const bodyFields = {};
    
            console.log(`Updating approval status: Employee Number=${employeeNumber}, Record ID=${recordId}, Approved=${isApproved}, Not Approved=${isNotApproved}`);
            
            if (isApproved !== null) bodyFields.Approved = isApproved;
            if (isNotApproved !== null) bodyFields['Timesheet Not Approved Reason'] = isNotApproved === '' ? '' : isNotApproved;
    
            if (Object.keys(bodyFields).length === 0) return; // No updates to make
    
            const body = JSON.stringify({ fields: bodyFields });
    
            const updateResponse = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body,
            });
            
            if (!updateResponse.ok) {
                const errorMessage = await updateResponse.text();
                throw new Error(`Failed to update approval status: ${updateResponse.statusText}. Error message: ${errorMessage}`);
            }
    
            const updatedData = await updateResponse.json();
            console.log('Approval status updated:', updatedData);
            displaySuccessMessage("Record successfully updated");
            
        } catch (error) {
            console.error('Error updating approval status:', error);
        }
    }
     



    function displaySuccessMessage(message) {
        // Create or reuse a message element
        let messageElement = document.getElementById('success-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'success-message';
            messageElement.style.position = 'fixed';
            messageElement.style.top = '50%';
            messageElement.style.left = '50%';
            messageElement.style.transform = 'translate(-50%, -50%)';
            messageElement.style.padding = '20px';
            messageElement.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
            messageElement.style.color = 'white';
            messageElement.style.fontSize = '16px';
            messageElement.style.borderRadius = '8px';
            messageElement.style.zIndex = '1000';
            document.body.appendChild(messageElement);
        }

        // Set the message and show it
        messageElement.textContent = message;
        messageElement.style.display = 'block';

        // Hide the message after 2 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 2000);
    }
 
 
  
});
