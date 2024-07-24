document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    const timesheetsBody = document.getElementById('timesheets-body');
    const searchInput = document.getElementById('search-input');
    const dateFilter = document.getElementById('date-filter');

    if (userEmailElement) {
        userEmailElement.textContent = supervisorEmail;
        userEmailElement.classList.add('clickable');
    }

    document.getElementById('export-button').addEventListener('click', exportToExcel);

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
                            <th class="narrow-column">Total Hours</th>
                            <th class="narrow-column">Approve</th>
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
        return `
            <tr>
                <th><input type="date" name="dateEnding" value="${fields['date7'] || ''}" readonly></th>
                <th><input type="number" name="hours_worked" value="${fields['Total Hours Worked'] || ''}" placeholder="0" readonly></th>
                <th><input type="number" name="pto_hours" value="${fields['PTO time used'] || ''}" placeholder="0" readonly></th>
                <th><input type="number" name="personal_hours" value="${fields['Personal Time Used'] || ''}" placeholder="0" readonly></th>
                <th><input type="number" name="holiday_hours" value="${fields['Holiday Hours Used'] || ''}" placeholder="0" readonly></th>
                <th><input type="number" name="total_hours" value="${fields['TotalTimeWithPTO'] || ''}" placeholder="0" readonly></th>
                <th><input type="checkbox" class="approve-checkbox" data-record-id="${recordId}" ${fields['Approved'] ? 'checked' : ''}></th>
            </tr>
        `;
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

    function handleCheckboxChange(event) {
        const checkbox = event.target;
        const recordId = checkbox.getAttribute('data-record-id');
        updateApprovalStatus(recordId, checkbox.checked);
    }

    timesheetsBody.addEventListener('change', handleCheckboxChange);

    function filterTimesheets() {
        const nameFilter = searchInput.value.toLowerCase();
        const dateFilterValue = dateFilter.value;

        const tables = timesheetsBody.querySelectorAll('.time-entry-table');
        tables.forEach(table => {
            const nameContainer = table.previousElementSibling;
            const employeeName = nameContainer.textContent.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');

            const nameMatches = employeeName.includes(nameFilter);
            const dateMatches = !dateFilterValue || Array.from(rows).some(row => {
                const dateInput = row.querySelector('input[type="date"]');
                return dateInput && dateInput.value === dateFilterValue;
            });

            if (nameMatches && dateMatches) {
                nameContainer.style.display = '';
                table.style.display = '';
            } else {
                nameContainer.style.display = 'none';
                table.style.display = 'none';
            }
        });
    }

    function exportToExcel() {
        // Collect data
        let data = [];
        const tables = timesheetsBody.querySelectorAll('.time-entry-table');
        tables.forEach(table => {
            const nameContainer = table.previousElementSibling;
            const employeeName = nameContainer.textContent;
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const date = row.querySelector('input[name="dateEnding"]').value;
                const hoursWorked = row.querySelector('input[name="hours_worked"]').value;
                const ptoHours = row.querySelector('input[name="pto_hours"]').value;
                const personalHours = row.querySelector('input[name="personal_hours"]').value;
                const holidayHours = row.querySelector('input[name="holiday_hours"]').value;
                const totalHours = row.querySelector('input[name="total_hours"]').value;

                data.push([employeeName, date, hoursWorked, ptoHours, personalHours, holidayHours, totalHours]);
            });
        });

        // Convert to CSV format
        let csvContent = "data:text/csv;charset=utf-8," 
            + "Employee Name,Date Ending,Hours Worked,PTO Hours Used,Personal Hours Used,Holiday Hours Used,Total Hours,Approved\n";

        data.forEach(row => {
            csvContent += row.join(",") + "\n";
        });

        // Create a link and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "timesheets_data.csv");
        document.body.appendChild(link);
        link.click();
    }

    // Initial fetch
    const supervisorName = await fetchSupervisorName(supervisorEmail);
    if (supervisorName) {
        await fetchTimesheets(supervisorName);
    } else {
        console.error('No supervisor found with email:', supervisorEmail);
    }

    document.getElementById('logout-button').addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    });

    if (userEmailElement) {
        userEmailElement.addEventListener('click', function () {
            window.location.href = 'timesheet.html';
        });
    }

});
