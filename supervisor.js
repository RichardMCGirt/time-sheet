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

    document.getElementById('dark-mode-toggle').addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
    });

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
        let filterFormula = supervisorEmail === 'katy@vanirinstalledsales.com' ? '{Employee Number}!=BLANK()' : `AND({Supervisor}='${supervisorName}', {Employee Number}!=BLANK())`;
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${filterFormula}`;
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

        records.sort((a, b) => {
            const nameA = a.fields['Full Name'] ? a.fields['Full Name'].toLowerCase() : '';
            const nameB = b.fields['Full Name'] ? b.fields['Full Name'].toLowerCase() : '';
            return nameA.localeCompare(nameB);
        });

        if (records.length > 0) {
            records.forEach(record => {
                const fields = record.fields;
                const employeeName = fields['Full Name'] || 'Unknown';

                const nameContainer = document.createElement('div');
                nameContainer.classList.add('name-container');
                nameContainer.textContent = `${employeeName}`;
                timesheetsBody.appendChild(nameContainer);

                const table = document.createElement('table');
                table.classList.add('time-entry-table');
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th class="date-column">Date</th>
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
            });
        } else {
            const noRecordsRow = document.createElement('div');
            noRecordsRow.classList.add('name-container');
            noRecordsRow.textContent = `No records found for the supervisor: ${supervisorEmail}`;
            timesheetsBody.appendChild(noRecordsRow);
        }
    }

    function generateRows(fields) {
        let rows = '';
        for (let day = 1; day <= 7; day++) {
            rows += `
                <tr>
                    <th><input type="date" name="date${day}" value="${fields[`Date${day}`] || ''}" readonly></th>
                    <th><input type="number" name="hours_worked${day}" value="${fields[`Hours Worked${day}`] || ''}" placeholder="0" readonly></th>
                    <th><input type="number" name="pto_hours${day}" value="${fields[`PTO Hours${day}`] || ''}" placeholder="0" readonly></th>
                    <th><input type="number" name="personal_hours${day}" value="${fields[`Personal Hours${day}`] || ''}" placeholder="0" readonly></th>
                    <th><input type="number" name="holiday_hours${day}" value="${fields[`Holiday Hours${day}`] || ''}" placeholder="0" readonly></th>
                    <th><input type="number" name="total_hours${day}" value="${fields[`Total Hours${day}`] || ''}" placeholder="0" readonly></th>
                </tr>
            `;
        }
        return rows;
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
        const ws_data = [];
        const tables = timesheetsBody.querySelectorAll('.time-entry-table');
        
        tables.forEach((table, index) => {
            const nameContainer = table.previousElementSibling;
            const employeeName = nameContainer.textContent;
            const rows = table.querySelectorAll('tbody tr');
            
            ws_data.push([employeeName]);
            ws_data.push(['Date', 'Hours Worked', 'PTO Hours used', 'Personal Hours used', 'Holiday Hours used', 'Total Hours']);
            rows.forEach(row => {
                const columns = row.querySelectorAll('th');
                const rowArray = Array.from(columns).map(column => column.querySelector('input') ? column.querySelector('input').value : column.textContent);
                ws_data.push(rowArray);
            });

            // Add an empty row between tables
            if (index < tables.length - 1) {
                ws_data.push([]);
            }
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 20 }, // Employee Name
            { wch: 15 }, // Date
            { wch: 15 }, // Hours Worked
            { wch: 15 }, // PTO Hours used
            { wch: 15 }, // Personal Hours used
            { wch: 15 }, // Holiday Hours used
            { wch: 15 }  // Total Hours
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Timesheets");
        XLSX.writeFile(wb, "timesheets.xlsx");
    }

    searchInput.addEventListener('input', filterTimesheets);
    dateFilter.addEventListener('input', filterTimesheets);

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
});
