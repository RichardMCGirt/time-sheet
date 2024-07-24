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

    document.getElementById('export-button').addEventListener('click', function () {
        exportToExcel();
    });

    async function fetchSupervisorName(email) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${email}')`;
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) {
                throw new Error(`Failed to fetch supervisor name: ${response.statusText}`);
            }
            const data = await response.json();
            return data.records.length > 0 ? data.records[0].fields['Full Name'] : null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async function fetchTimesheets(supervisorName) {
        let filterFormula;
        if (supervisorEmail === 'katy@vanirinstalledsales.com') {
            filterFormula = '{Employee Number}!=BLANK()';
        } else {
            filterFormula = `AND({Supervisor}='${supervisorName}', {Employee Number}!=BLANK())`;
        }

        let endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${filterFormula}&sort[0][field]=Employee Number&sort[0][direction]=asc`;

        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) {
                throw new Error(`Failed to fetch timesheets: ${response.statusText}`);
            }
            const data = await response.json();
            populateTimesheets(data.records);
        } catch (error) {
            console.error(error);
        }
    }

    function populateTimesheets(records) {
        timesheetsBody.innerHTML = ''; // Clear any existing rows

        if (records.length > 0) {
            records.forEach(record => {
                const fields = record.fields;
                const employeeName = fields['Full Name'] || 'Unknown';
                const employeeNumber = fields['Employee Number'];

                if (!employeeNumber) return; // Skip records without Employee Number

                const nameContainer = document.createElement('div');
                nameContainer.classList.add('name-container');
                nameContainer.textContent = `${employeeName}`;
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
                        </tr>
                    </thead>
                    <tbody>
                        ${generateRows(fields)}
                    </tbody>
                `;

                timesheetsBody.appendChild(table);

                if (supervisorEmail === 'katy@vanirinstalledsales.com') {
                    nameContainer.setAttribute('data-employee-number', employeeNumber);
                    nameContainer.style.display = 'none'; // Hide employee number
                }
            });
        } else {
            const noRecordsRow = document.createElement('div');
            noRecordsRow.classList.add('name-container');
            noRecordsRow.textContent = `No records found for the supervisor: ${supervisorEmail}`;
            timesheetsBody.appendChild(noRecordsRow);
        }
    }

    function generateRows(fields) {
        return `
            <tr>
                <th><input type="date" name="dateEnding" value="${fields['Date7'] || ''}" readonly></th>
                <th><input type="number" name="hours_worked" value="${fields['Hours Worked'] || ''}" placeholder="0" readonly></th>
                <th><input type="number" name="pto_hours" value="${fields['PTO Hours'] || ''}" placeholder="0" readonly></th>
                <th><input type="number" name="personal_hours" value="${fields['Personal Hours'] || ''}" placeholder="0" readonly></th>
                <th><input type="number" name="holiday_hours" value="${fields['Holiday Hours'] || ''}" placeholder="0" readonly></th>
                <th><input type="number" name="total_hours" value="${fields['Total Hours'] || ''}" placeholder="0" readonly></th>
            </tr>
        `;
    }

    function filterTimesheets() {
        const nameFilter = searchInput.value.toLowerCase();
        const dateFilterValue = dateFilter.value;

        const tables = timesheetsBody.querySelectorAll('.time-entry-table');
        tables.forEach(table => {
            const nameContainer = table.previousElementSibling;
            const employeeName = nameContainer.textContent.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');

            let nameMatches = employeeName.includes(nameFilter);
            let dateMatches = !dateFilterValue || Array.from(rows).some(row => {
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
        const wb = XLSX.utils.book_new();
        let ws_data = [
            ['Employee Number', 'Employee Name', 'Date Ending', 'Hours Worked', 'PTO Hours used', 'Personal Hours used', 'Holiday Hours used', 'Total Hours']
        ];

        const tables = timesheetsBody.querySelectorAll('.time-entry-table');
        tables.forEach(table => {
            const nameContainer = table.previousElementSibling;
            const employeeName = nameContainer.textContent;
            const employeeNumber = nameContainer.getAttribute('data-employee-number');
            const rows = table.querySelectorAll('tbody tr');
            let totalHours = [0, 0, 0, 0, 0];
            let dateEnding = '';

            rows.forEach((row, index) => {
                const columns = row.querySelectorAll('th');
                dateEnding = columns[0].querySelector('input').value || '';
                totalHours[0] += parseFloat(columns[1].querySelector('input').value) || 0;
                totalHours[1] += parseFloat(columns[2].querySelector('input').value) || 0;
                totalHours[2] += parseFloat(columns[3].querySelector('input').value) || 0;
                totalHours[3] += parseFloat(columns[4].querySelector('input').value) || 0;
                totalHours[4] += parseFloat(columns[5].querySelector('input').value) || 0;
            });

            ws_data.push([employeeNumber, employeeName, dateEnding, ...totalHours]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Set column widths
        ws['!cols'] = [
            { wch: 18 }, // Employee Number
            { wch: 18 }, // Employee Name
            { wch: 25 }, // Date
            { wch: 14 }, // Hours Worked
            { wch: 18 }, // PTO Hours used
            { wch: 16 }, // Personal Hours used
            { wch: 16 }, // Holiday Hours used
            { wch: 10 }  // Total Hours
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Timesheets");
        XLSX.writeFile(wb, "timesheets.xlsx");
    }

    const supervisorName = await fetchSupervisorName(supervisorEmail);
    await fetchTimesheets(supervisorName);

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

    searchInput.addEventListener('input', filterTimesheets);
    dateFilter.addEventListener('input', filterTimesheets);
});
