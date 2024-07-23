document.getElementById('export-xlsx-button').addEventListener('click', async function () {
    const workbook = XLSX.utils.book_new();
    const sheetData = [];
    
    // Collect data from the timesheet form
    const table = document.getElementById('time-entry-table');
    const rows = table.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const rowData = [];
        for (let j = 0; j < cells.length - 1; j++) {
            const input = cells[j].getElementsByTagName('input')[0] || cells[j].getElementsByTagName('span')[0];
            rowData.push(input.value || input.textContent);
        }
        sheetData.push(rowData);
    }
    
    // Create sheet and append to workbook
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet");

    // Generate the XLSX file
    const xlsxFile = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    
    // Convert binary string to array buffer
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }
    
    const xlsxBlob = new Blob([s2ab(xlsxFile)], { type: "application/octet-stream" });

    // Send the file to Airtable
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';

    const formData = new FormData();
    formData.append('attachments', xlsxBlob, 'timesheet.xlsx');

    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data = await response.json();

        if (data.records.length > 0) {
            const recordId = data.records[0].id;

            const uploadEndpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}/attachments`;
            const uploadResponse = await fetch(uploadEndpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`
                },
                body: formData
            });

            if (uploadResponse.ok) {
                alert('XLSX file uploaded successfully!');
            } else {
                throw new Error('Failed to upload XLSX file');
            }
        } else {
            throw new Error('No record found for user');
        }
    } catch (error) {
        console.error('Error uploading XLSX file:', error);
        alert('Failed to upload XLSX file. Error: ' + error.message);
    }
});


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
        createXlsxFile();
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
        let endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${filterFormula}`;
        
        if (supervisorEmail === 'katy@vanirinstalledsales.com') {
            endpoint += '&sort[0][field]=Employee Number&sort[0][direction]=asc';
        }

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

        if (supervisorEmail !== 'katy@vanirinstalledsales.com') {
            records.sort((a, b) => {
                const nameA = a.fields['Full Name'] ? a.fields['Full Name'].toLowerCase() : '';
                const nameB = b.fields['Full Name'] ? b.fields['Full Name'].toLowerCase() : '';
                return nameA.localeCompare(nameB);
            });
        }

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

    async function fetchEmployeeData() {
        console.log('Fetching employee data...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}`;

        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch employee data: ${response.statusText}`);

            const data = await response.json();
            console.log('Fetched employee data:', data);

            return data.records.map(record => ({
                employeeName: record.fields['Full Name'],
                employeeNumber: record.fields['Employee Number'],
                timesheet: [
                    {
                        date: record.fields['Date1'],
                        hoursWorked: record.fields['Hours Worked1'],
                        ptoHoursUsed: record.fields['PTO Hours1'],
                        personalHoursUsed: record.fields['Personal Hours1'],
                        holidayHoursUsed: record.fields['Holiday Hours1'],
                        totalHours: record.fields['Total Hours1']
                    },
                    {
                        date: record.fields['Date2'],
                        hoursWorked: record.fields['Hours Worked2'],
                        ptoHoursUsed: record.fields['PTO Hours2'],
                        personalHoursUsed: record.fields['Personal Hours2'],
                        holidayHoursUsed: record.fields['Holiday Hours2'],
                        totalHours: record.fields['Total Hours2']
                    },
                    // Continue for all 7 days or as per your structure
                ]
            }));
        } catch (error) {
            console.error('Error fetching employee data:', error);
            alert('Failed to fetch employee data. Error: ' + error.message);
            return [];
        }
    }

    async function createXlsxFile() {
        const wb = XLSX.utils.book_new();
        const ws_data = [];
        const employeeData = await fetchEmployeeData();

        // Sort employee data by employee number
        const sortedData = employeeData.sort((a, b) => a.employeeNumber - b.employeeNumber);

        sortedData.forEach(employee => {
            const { employeeName, timesheet } = employee;
            ws_data.push([employeeName]);
            ws_data.push(['Date', 'Hours Worked', 'PTO Hours used', 'Personal Hours used', 'Holiday Hours used', 'Total Hours']);
            
            // Assuming timesheet is an array of objects, each representing a row
            timesheet.forEach(row => {
                ws_data.push([
                    row.date,
                    row.hoursWorked,
                    row.ptoHoursUsed,
                    row.personalHoursUsed,
                    row.holidayHoursUsed,
                    row.totalHours
                ]);
            });

            // Add an empty row between employees
            ws_data.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Set column widths
        ws['!cols'] = [
            { wch: 18 }, // Employee Name
            { wch: 18 }, // Date
            { wch: 12 }, // Hours Worked
            { wch: 14 }, // PTO Hours used
            { wch: 18 }, // Personal Hours used
            { wch: 16 }, // Holiday Hours used
            { wch: 10 }  // Total Hours
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
