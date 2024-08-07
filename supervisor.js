document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    const timesheetsBody = document.getElementById('timesheets-body');
    const checkAllButton = document.getElementById('check-all-button');
    const logoutButton = document.getElementById('logout-button'); // Add the logout button

    let allChecked = false;

    if (userEmailElement) {
        userEmailElement.textContent = supervisorEmail;
        userEmailElement.classList.add('clickable');
        userEmailElement.addEventListener('click', () => {
            window.location.href = 'timesheet.html';
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    document.getElementById('export-button').addEventListener('click', exportToExcel);
    checkAllButton.addEventListener('click', handleCheckAll);

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

    async function fetchEmployeeName(employeeNumber) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Employee Number}='${employeeNumber}')`;
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch employee name: ${response.statusText}`);
            const data = await response.json();
            return data.records.length > 0 ? data.records[0].fields['Full Name'] : 'Unknown';
        } catch (error) {
            console.error(error);
            return 'Unknown';
        }
    }

    async function fetchTimesheets(supervisorName) {
        const filterFormula = supervisorEmail === 'katy@vanirinstalledsales.com' ? 
                              '{Employee Number}!=BLANK()' : 
                              `AND({Supervisor}='${supervisorName}', {Employee Number}!=BLANK())`;

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${filterFormula}&sort[0][field]=Employee Number&sort[0][direction]=asc`;

        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch timesheets: ${response.statusText}`);
            const data = await response.json();
            await populateTimesheets(data.records);
        } catch (error) {
            console.error(error);
        }
    }

    async function populateTimesheets(records) {
        timesheetsBody.innerHTML = ''; // Clear any existing rows

        if (records.length > 0) {
            for (const record of records) {
                const fields = record.fields;
                const employeeNumber = fields['Employee Number'];

                if (!employeeNumber) continue; // Skip records without Employee Number

                const employeeName = await fetchEmployeeName(employeeNumber);

                const nameContainer = document.createElement('div');
                nameContainer.classList.add('name-container');
                nameContainer.textContent = employeeName;
                nameContainer.addEventListener('click', () => {
                    // Redirect to the employee's record
                    window.location.href = `employee_record.html?employeeNumber=${employeeNumber}`;
                });
                nameContainer.classList.add('clickable');
                timesheetsBody.appendChild(nameContainer);

                const table = document.createElement('table');
                table.classList.add('time-entry-table');
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
                            <th class="narrow-column">Not Approved</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateRows(fields, record.id)}
                    </tbody>
                `;

                timesheetsBody.appendChild(table);
            }
        } else {
            const noRecordsRow = document.createElement('div');
            noRecordsRow.classList.add('name-container');
            noRecordsRow.textContent = `No records found for the supervisor: ${supervisorEmail}`;
            timesheetsBody.appendChild(noRecordsRow);
        }
    }

    function generateRows(fields, recordId) {
        let hoursWorked = fields['Total Hours Worked'] || 0;
        const ptoHours = fields['PTO Time Used'] || 0;
        const personalHours = fields['Personal Time Used'] || 0;
        const holidayHours = fields['Holiday Hours Used'] || 0;
    
        // Round hoursWorked to the nearest quarter
        hoursWorked = Math.round(hoursWorked * 4) / 4;
    
        // Calculate giftedHours
        let giftedHours = hoursWorked > 0 ? Math.min(3, 40 - (hoursWorked + ptoHours + personalHours + holidayHours)) : 0;
        // Ensure giftedHours is not negative
        if (giftedHours < 0) giftedHours = 0;
        // Round giftedHours to two decimal points
        giftedHours = Math.round(giftedHours * 100) / 100;
    
        // Calculate totalHours
        let totalHours = hoursWorked + ptoHours + personalHours + holidayHours + giftedHours;
        
        // Set giftedHours to 0 if totalHours exceeds 40 and recalculate totalHours
        if (totalHours > 40) {
            giftedHours = 0;
            totalHours = hoursWorked + ptoHours + personalHours + holidayHours;
        }
    
        // Round totalHours to the nearest quarter
    
        return `
            <tr>
                <th><input type="date" name="dateEnding" value="${fields['date7'] || ''}" readonly></th>
                <th><input type="number" name="hours_worked" value="${hoursWorked}" placeholder="0" readonly></th>
                <th><input type="number" name="pto_hours" value="${ptoHours}" placeholder="0" readonly></th>
                <th><input type="number" name="personal_hours" value="${personalHours}" placeholder="0" readonly></th>
                <th><input type="number" name="holiday_hours" value="${holidayHours}" placeholder="0" readonly></th>
                <th><input type="number" name="gifted_hours" value="${giftedHours}" placeholder="0" readonly></th>
                <th><input type="number" name="total_hours" value="${totalHours}" placeholder="0" readonly></th>
                <th><input type="checkbox" class="approve-checkbox" data-record-id="${recordId}" ${fields['Approved'] ? 'checked' : ''}></th>
                <th><input type="text" class="not-approved-checkbox" data-record-id="${recordId}" value="${fields['Timesheet Not Approved Reason'] || ''}"></th>
            </tr>
        `;
    }
    
    
    

    async function updateApprovalStatus(recordId, isApproved, isNotApproved) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        const bodyFields = {};

        // Ensure that both values are not set simultaneously
        if (isApproved !== null && isNotApproved !== null) {
            alert("You cannot have both the 'Approved' checkbox checked and a 'Not Approved' reason filled out.");
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
        } catch (error) {
            console.error('Error updating approval status:', error);
        }
    }

    function handleCheckboxChange(event) {
        const checkbox = event.target;
        const recordId = checkbox.getAttribute('data-record-id');
        const isApproved = checkbox.classList.contains('approve-checkbox') ? checkbox.checked : null;

        // Validate against conflicting "Not Approved" text input
        const notApprovedInput = timesheetsBody.querySelector(`.not-approved-checkbox[data-record-id="${recordId}"]`);
        if (notApprovedInput && isApproved && notApprovedInput.value.trim()) {
            alert("Please clear the 'Not Approved' text input if you check the 'Approved' checkbox.");
            checkbox.checked = !isApproved; // Revert checkbox state
            return;
        }

        updateApprovalStatus(recordId, isApproved, null);
    }

    function handleBlur(event) {
        const input = event.target;
        if (input.classList.contains('not-approved-checkbox')) {
            const recordId = input.getAttribute('data-record-id');
            const isNotApproved = input.value.trim() || ''; // Save the text value, or empty string if empty

            // Validate against conflicting checkbox
            const checkbox = timesheetsBody.querySelector(`.approve-checkbox[data-record-id="${recordId}"]`);
            if (checkbox && checkbox.checked && isNotApproved) {
                alert("Please uncheck the 'Approved' checkbox if you enter a reason in the 'Not Approved' text input.");
                input.value = ''; // Clear the text input
                return;
            }

            updateApprovalStatus(recordId, null, isNotApproved);
        }
    }

    function handleCheckAll() {
        const checkboxes = timesheetsBody.querySelectorAll('.approve-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
            const recordId = checkbox.getAttribute('data-record-id');
            const isApproved = checkbox.checked;
            
            // Ensure that no conflicting text input exists
            const notApprovedInput = timesheetsBody.querySelector(`.not-approved-checkbox[data-record-id="${recordId}"]`);
            if (notApprovedInput && isApproved && notApprovedInput.value.trim()) {
                alert("Please clear the 'Not Approved' text input for all records before checking 'Approved'.");
                checkbox.checked = !isApproved; // Revert checkbox state
            } else {
                updateApprovalStatus(recordId, isApproved, null);
            }
        });
        allChecked = !allChecked;
        checkAllButton.textContent = allChecked ? "Deselect All" : "Select All";
    }
// supervisor.js

// Function to collect timesheet data
function collectTimesheetData() {
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

    return data;
}

// Function to export data to Excel
function exportToExcel() {
    const data = collectTimesheetData();
    
    const ws = XLSX.utils.aoa_to_sheet([
        ["Employee Name", "Date Ending", "Hours Worked", "PTO Hours Used", "Personal Hours Used", "Holiday Hours Used", "Gifted Hours", "Total Hours"],
        ...data
    ]);

    ws['!cols'] = [
        { wpx: 150 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 },
        { wpx: 120 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheets Data');

    XLSX.writeFile(wb, 'timesheets_data.xlsx');
}



    
    

    timesheetsBody.addEventListener('change', handleCheckboxChange);
    timesheetsBody.addEventListener('blur', handleBlur, true);

    const supervisorName = await fetchSupervisorName(supervisorEmail);
    if (supervisorName) {
        await fetchTimesheets(supervisorName);
    } else {
        console.error(`Supervisor not found for email: ${supervisorEmail}`);
    }
});
