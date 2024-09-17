document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbl8znXria2leJfUd';
    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    const timesheetsBody = document.getElementById('timesheets-body');
    const checkAllButton = document.getElementById('check-all-button');
    const logoutButton = document.getElementById('logout-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadingScreen = document.getElementById('loading-screen');
    const loadingLogo = document.getElementById('loading-logo');
    const mainContent = document.getElementById('main-content');

    // Elements to hide during data fetching
    const titleElement = document.querySelector('h1');
    const messageContainer = document.getElementById('message-container');
    const keyEnterHint = document.querySelector('p');

    let allChecked = false;

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

    document.getElementById('export-button').addEventListener('click', exportToExcel);
    checkAllButton.addEventListener('click', handleCheckAll);

    // Hide elements during data fetching
    console.log('Hiding elements before data fetching');
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
            console.log('Fading out loading screen');
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                console.log('Hiding loading screen and displaying main content');
                loadingScreen.classList.add('hidden');
                mainContent.classList.add('visible');
                loadDataAndInitializePage();
            }, 700);
        }, 1000);
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
    }

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

    function generateRows(fields, recordId, employeeNumber) {
        console.log('Generating rows for timesheet');
        let hoursWorked = fields['Total Hours Worked'] || 0;
        const ptoHours = fields['PTO Time Used'] || 0;
        const personalHours = fields['Personal Time Used'] || 0;
        const holidayHours = fields['Holiday Hours Used'] || 0;

        // Round hoursWorked to the nearest quarter
        hoursWorked = Math.round(hoursWorked * 4) / 4;

        // Calculate giftedHours
        let giftedHours = hoursWorked > 0 ? Math.min(3, 40 - (hoursWorked + ptoHours + personalHours + holidayHours)) : 0;
        if (giftedHours < 0) giftedHours = 0; // Ensure giftedHours is not negative
        giftedHours = Math.round(giftedHours * 100) / 100;

        // Calculate totalHours
        let totalHours = hoursWorked + ptoHours + personalHours + holidayHours + giftedHours;
        if (totalHours > 40) {
            giftedHours = 0;
            totalHours = hoursWorked + ptoHours + personalHours + holidayHours;
        }

        return `
            <tr>
                <th><input type="date" name="start" value="${fields['start1'] || ''}" readonly></th>
                <th><input type="date" name="start" value="${fields['start2'] || ''}" readonly></th>
                <th><input type="date" name="start" value="${fields['start3'] || ''}" readonly></th>
                <th><input type="date" name="start" value="${fields['start4'] || ''}" readonly></th>
                <th><input type="date" name="start" value="${fields['start5'] || ''}" readonly></th>
                <th><input type="date" name="start" value="${fields['start6'] || ''}" readonly></th>
                <th><input type="date" name="start" value="${fields['start7'] || ''}" readonly></th>
                <th><input type="number" name="lunchs" value="${fields['lunchs1'] || ''}" readonly></th>
                <th><input type="number" name="lunchs" value="${fields['lunchs2'] || ''}" readonly></th>
                <th><input type="number" name="lunchs" value="${fields['lunchs3'] || ''}" readonly></th>
                <th><input type="number" name="lunchs" value="${fields['lunchs4'] || ''}" readonly></th>
                <th><input type="number" name="lunchs" value="${fields['lunchs5'] || ''}" readonly></th>
                <th><input type="number" name="lunchs" value="${fields['lunchs6'] || ''}" readonly></th>
                <th><input type="number" name="lunchs" value="${fields['lunchs7'] || ''}" readonly></th>
                <th><input type="number" name="lunche" value="${fields['lunche1'] || ''}" readonly></th>
                <th><input type="number" name="lunche" value="${fields['lunche2'] || ''}" readonly></th>

                <th><input type="number" name="lunche" value="${fields['lunche3'] || ''}" readonly></th>
                <th><input type="number" name="lunche" value="${fields['lunche4'] || ''}" readonly></th>
                <th><input type="number" name="lunche" value="${fields['lunche5'] || ''}" readonly></th>
                <th><input type="number" name="lunche" value="${fields['lunche6'] || ''}" readonly></th>
                <th><input type="number" name="lunche" value="${fields['lunche7'] || ''}" readonly></th>
                <th><input type="number" name="end" value="${fields['end1'] || ''}" readonly></th>
                <th><input type="number" name="end" value="${fields['end2'] || ''}" readonly></th>
                <th><input type="number" name="end" value="${fields['end3'] || ''}" readonly></th>
                <th><input type="number" name="end" value="${fields['end4'] || ''}" readonly></th>
                <th><input type="number" name="end" value="${fields['end5'] || ''}" readonly></th>
                <th><input type="number" name="end" value="${fields['end6'] || ''}" readonly></th>
                <th><input type="number" name="end" value="${fields['end7'] || ''}" readonly></th>
                <th><input type="number" name="additionali" value="${fields['additionali1'] || ''}" readonly></th>
                <th><input type="number" name="additionali" value="${fields['additionali2'] || ''}" readonly></th>
                <th><input type="number" name="additionali" value="${fields['additionali3'] || ''}" readonly></th>
                <th><input type="number" name="additionali" value="${fields['additionali4'] || ''}" readonly></th>
                <th><input type="number" name="additionali" value="${fields['additionali5'] || ''}" readonly></th>
                <th><input type="number" name="additionali" value="${fields['additionali6'] || ''}" readonly></th>
                <th><input type="number" name="additionali" value="${fields['additionali7'] || ''}" readonly></th>
                <th><input type="number" name="additionalo" value="${fields['additionalo1'] || ''}" readonly></th>
                <th><input type="number" name="additionalo" value="${fields['additionalo2'] || ''}" readonly></th>
                <th><input type="number" name="additionalo" value="${fields['additionalo3'] || ''}" readonly></th>
                <th><input type="number" name="additionalo" value="${fields['additionalo4'] || ''}" readonly></th>
                <th><input type="number" name="additionalo" value="${fields['additionalo5'] || ''}" readonly></th>
                <th><input type="number" name="additionalo" value="${fields['additionalo6'] || ''}" readonly></th>
                <th><input type="number" name="additionalo" value="${fields['additionalo7'] || ''}" readonly></th>






                <th><input type="number" name="hours_worked" value="${hoursWorked}" placeholder="0" readonly></th>
                <th><input type="number" name="pto_hours" value="${ptoHours}" placeholder="0" readonly></th>
                <th><input type="number" name="personal_hours" value="${personalHours}" placeholder="0" readonly></th>
                <th><input type="number" name="holiday_hours" value="${holidayHours}" placeholder="0" readonly></th>
                <th><input type="number" name="gifted_hours" value="${giftedHours}" placeholder="0" readonly></th>
                <th><input type="number" name="total_hours" value="${totalHours}" placeholder="0" readonly></th>
                <th>
                    <input type="checkbox" class="approve-checkbox" data-record-id="${recordId}" ${fields['Approved'] ? 'checked' : ''}>
                </th>
                <th><input type="text" class="not-approved-checkbox" data-record-id="${recordId}" value="${fields['Timesheet Not Approved Reason'] || ''}"></th>
            </tr>
        `;
    }

    async function fetchTimesheets(supervisorName) {
        let filterFormula;
        
        if (supervisorEmail === 'katy@vanirinstalledsales.com') {
            filterFormula = '{Employee Number}!=BLANK()';
        } else if (supervisorEmail === 'josh@vanirinstalledsales.com' || supervisorEmail === 'ethen.wilson@vanirinstalledsales.com') {
            // Josh and Ethan can see all records where the Supervisor is either Josh Boyd or Ethen Wilson
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
            await populateTimesheets(data.records);
        } catch (error) {
            console.error(error);
            alert("Error fetching timesheet data. Please try again later.");
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading indicator
            // Show elements after data has been fetched
            console.log('Displaying elements after data fetching');
            titleElement.style.display = '';
            messageContainer.style.display = '';
            checkAllButton.style.display = '';
            keyEnterHint.style.display = '';
        }
    }
    
    
    
    
    
    

    async function populateTimesheets(records) {
        console.log('Populating timesheets');
        timesheetsBody.innerHTML = ''; // Clear any existing rows

        if (records.length > 0) {
            for (const record of records) {
                const fields = record.fields;
                const employeeNumber = fields['Employee Number'];

                if (!employeeNumber) continue; // Skip records without Employee Number

                const employeeName = await fetchEmployeeName(employeeNumber);
                const hasValues = checkTimesheetValues(fields);

                const nameContainer = document.createElement('div');
                nameContainer.classList.add('name-container');
                nameContainer.textContent = `${employeeName}`; // Employee name only, number hidden
                nameContainer.setAttribute('data-record-id', record.id); // Set the record ID
                nameContainer.setAttribute('data-employee-number', employeeNumber); // Store employee number for CSV generation
                nameContainer.addEventListener('click', () => {
                    console.log(`Toggling visibility for record ID: ${record.id}`);
                    toggleVisibility(record.id);
                });
                nameContainer.classList.add('clickable');
                if (!hasValues) {
                    nameContainer.style.color = 'red'; // Set the name color to red if no values
                }
                timesheetsBody.appendChild(nameContainer);

                const table = document.createElement('table');
                table.classList.add('time-entry-table');
                table.setAttribute('data-record-id', record.id); // Set the record ID
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th class="date-column">Date Ending</th>
                            <th class="narrow-column">Hours Worked</th>
                            <th class="narrow-column">PTO Hours used</th>
                            <th class="narrow-column">Personal Hours used</th>
                            <th class="narrow-column">Holiday Hours used</th>
                            <th class="narrow-column">Gifted Hours</th>
                            <th class="narrow-column">Total Hours</th>
                            <th class="narrow-column">Approved</th>
                            <th class="narrow-column">Not Approved Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateRows(fields, record.id, employeeNumber)}
                    </tbody>
                `;

                // Bind the change event to the newly created checkbox
                const approveCheckbox = table.querySelector('.approve-checkbox');
                if (approveCheckbox) {
                    approveCheckbox.addEventListener('change', handleCheckboxChange);
                }

                // Bind the blur event to the "Not Approved Reason" text input
                const notApprovedInput = table.querySelector('.not-approved-checkbox');
                if (notApprovedInput) {
                    notApprovedInput.addEventListener('blur', handleTextInputChange);
                }

                if (supervisorEmail !== 'katy@vanirinstalledsales.com' && fields['Approved']) {
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

    function handleCheckboxChange(event) {
        const checkbox = event.target;
        const recordId = checkbox.getAttribute('data-record-id');
        const isApproved = checkbox.checked;  // Get the current state of the checkbox

        console.log(`Checkbox changed: Record ID=${recordId}, Approved=${isApproved}`);

        // Validate against conflicting "Not Approved" text input
        const notApprovedInput = timesheetsBody.querySelector(`.not-approved-checkbox[data-record-id="${recordId}"]`);
        if (notApprovedInput && isApproved && notApprovedInput.value.trim()) {
            alert("Please clear the 'Not Approved' text input if you check the 'Approved' checkbox.");
            checkbox.checked = !isApproved; // Revert checkbox state
            console.log('Conflict detected, reverting checkbox state');
            return;
        }

        // Update the Airtable record with the new approval status
        updateApprovalStatus(recordId, isApproved, null);

        // Show a success message
        displaySuccessMessage("Record successfully updated");

        // Adjust visibility of the table based on the checkbox state
        const table = timesheetsBody.querySelector(`.time-entry-table[data-record-id="${recordId}"]`);
        if (table) {
            if (supervisorEmail !== 'katy@vanirinstalledsales.com') {
                table.style.display = isApproved ? 'none' : '';  // Hide or show the table based on the approval status
            } else {
                table.style.display = '';  // For Katy, do not hide the table
            }
        }
    }

    function handleTextInputChange(event) {
        const input = event.target;
        const recordId = input.getAttribute('data-record-id');
        const notApprovedReason = input.value.trim(); // Get the current value of the input

        console.log(`Text input changed: Record ID=${recordId}, Not Approved Reason=${notApprovedReason}`);

        // Validate against conflicting checkbox
        const checkbox = timesheetsBody.querySelector(`.approve-checkbox[data-record-id="${recordId}"]`);
        if (checkbox && checkbox.checked && notApprovedReason) {
            alert("Please uncheck the 'Approved' checkbox if you enter a reason in the 'Not Approved' text input.");
            input.value = ''; // Clear the text input
            console.log('Conflict detected, clearing Not Approved input');
            return;
        }

        // Update the Airtable record with the new Not Approved reason
        updateApprovalStatus(recordId, null, notApprovedReason);

        // Show a success message
        displaySuccessMessage("Record successfully updated");
    }

    async function updateApprovalStatus(recordId, isApproved, isNotApproved) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        const bodyFields = {};

        console.log(`Updating approval status: Record ID=${recordId}, Approved=${isApproved}, Not Approved=${isNotApproved}`);

        // Ensure that both values are not set simultaneously
        if (isApproved !== null && isNotApproved !== null) {
            alert("You cannot have both the 'Approved' checkbox checked and a 'Not Approved' reason filled out.");
            console.log('Conflict detected: Both Approved and Not Approved are set');
            return;
        }

        if (isApproved !== null) bodyFields.Approved = isApproved;
        if (isNotApproved !== null) bodyFields['Timesheet Not Approved Reason'] = isNotApproved === '' ? '' : isNotApproved;

        if (Object.keys(bodyFields).length === 0) return; // No updates to make

        const body = JSON.stringify({ fields: bodyFields });

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
            displaySuccessMessage("Record successfully updated"); // Show success message
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

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }



    function handleCheckAll() {
        console.log(`Handling check all: All checked=${allChecked}`);
        const checkboxes = timesheetsBody.querySelectorAll('.approve-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
            const recordId = checkbox.getAttribute('data-record-id');
            const isApproved = checkbox.checked;
            
            console.log(`Toggling checkbox for Record ID=${recordId}, Approved=${isApproved}`);
            
            // Ensure that no conflicting text input exists
            const notApprovedInput = timesheetsBody.querySelector(`.not-approved-checkbox[data-record-id="${recordId}"]`);
            if (notApprovedInput && isApproved && notApprovedInput.value.trim()) {
                alert("Please clear the 'Not Approved' text input for all records before checking 'Approved'.");
                checkbox.checked = !isApproved; // Revert checkbox state
                console.log('Conflict detected, reverting checkbox state');
            } else {
                updateApprovalStatus(recordId, isApproved, null);
                displaySuccessMessage("All records successfully updated");
            }
        });
        allChecked = !allChecked;
        checkAllButton.textContent = allChecked ? "Deselect All" : "Select All";
    }

    function resetAllCheckboxes() {
        console.log('Resetting all checkboxes');
        const checkboxes = timesheetsBody.querySelectorAll('.approve-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const recordId = checkbox.getAttribute('data-record-id');
            updateApprovalStatus(recordId, false, null);
        });
    }

    function collectTimesheetData() {
        console.log('Collecting timesheet data');
        const data = [];
        const tables = document.querySelectorAll('.time-entry-table');

        tables.forEach(table => {
            const employeeName = table.previousElementSibling.textContent;
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const date = row.querySelector('input[name="dateEnding"]').value;
                const hoursWorked = row.querySelector('input[name="hours_worked"]').value;
                const ptoHours = row.querySelector('input[name="pto_hours"]').value;
                const personalHours = row.querySelector('input[name="personal_hours"]').value;
                const holidayHours = row.querySelector('input[name="holiday_hours"]').value;
                const giftedHours = row.querySelector('input[name="gifted_hours"]').value;
                const totalHours = row.querySelector('input[name="total_hours"]').value;

                data.push([
                    employeeName, date, hoursWorked, ptoHours,
                    personalHours, holidayHours, giftedHours, totalHours
                ]);
            });
        });

        console.log('Timesheet data collected:', data);
        return data;
    }

