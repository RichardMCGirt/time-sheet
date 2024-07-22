document.addEventListener("DOMContentLoaded", async function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    const weekEndingDisplay = document.getElementById('week-ending-display');
    const weekEndingDateSpan = document.getElementById('week-ending-date');
    const timesheetsBody = document.getElementById('timesheets-body');
    const searchInput = document.getElementById('search-input');
    const dateFilter = document.getElementById('date-filter');

    if (userEmailElement) {
        userEmailElement.textContent = supervisorEmail;
        userEmailElement.classList.add('clickable');
    }

    function getNearestWednesday(date) {
        const dayOfWeek = date.getDay();
        const diff = (3 - dayOfWeek + 7) % 7; // 3 represents Wednesday
        date.setDate(date.getDate() + diff);
        return date;
    }

    function formatDateString(date) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    }

    function setWeekEndingDate() {
        const today = new Date();
        const nearestWednesday = getNearestWednesday(today);
        weekEndingDateSpan.textContent = formatDateString(nearestWednesday);
    }

    async function fetchSupervisorName(email) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${email}')`;
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) {
            console.error(`Failed to fetch supervisor name: ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data.records.length > 0 ? data.records[0].fields['Full Name'] : null;
    }

    async function fetchTimesheets(supervisorName) {
        let filterFormula;
        if (supervisorEmail === 'katy@vanirinstalledsales.com') {
            filterFormula = '';
        } else {
            filterFormula = `AND({Supervisor}='${supervisorName}')`;
        }
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${filterFormula}`;
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) {
            console.error(`Failed to fetch timesheets: ${response.statusText}`);
            return;
        }
        const data = await response.json();
        populateTimesheets(data.records);
    }

    function populateTimesheets(records) {
        timesheetsBody.innerHTML = ''; // Clear any existing rows

        // Sort records by employee name alphabetically
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
                    <tbody></tbody>
                `;

                const tbody = table.querySelector('tbody');

                for (let day = 1; day <= 7; day++) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <th><input type="date" name="date${day}" value="${fields[`Date${day}`] || ''}" readonly></th>
                                                <th><input type="number" name="hours_worked${day}" value="${fields[`PTO Hours${day}`] || ''}" placeholder="0" readonly></th>

                        <th><input type="number" name="pto_hours${day}" value="${fields[`PTO Hours${day}`] || ''}" placeholder="0" readonly></th>
                        <th><input type="number" name="personal_hours${day}" value="${fields[`Personal Hours${day}`] || ''}" placeholder="0" readonly></th>
                        <th><input type="number" name="holiday_hours${day}" value="${fields[`Holiday Hours${day}`] || ''}" placeholder="0" readonly></th>
                        <th><input type="number" name="total_hours${day}" value="${fields[`Hours Worked${day}`] || ''}" placeholder="0" readonly></th>
                    `;
                    tbody.appendChild(row);
                }

                timesheetsBody.appendChild(table);
            });
        } else {
            const noRecordsRow = document.createElement('div');
            noRecordsRow.classList.add('name-container');
            noRecordsRow.textContent = `No records found for the supervisor: ${supervisorEmail}`;
            timesheetsBody.appendChild(noRecordsRow);
        }
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

    searchInput.addEventListener('input', filterTimesheets);
    dateFilter.addEventListener('input', filterTimesheets);

    setWeekEndingDate();

    const supervisorName = await fetchSupervisorName(supervisorEmail);
    if (supervisorName || supervisorEmail === 'katy@vanirinstalledsales.com') {
        await fetchTimesheets(supervisorName || 'Katy Schumacher');
    }

    document.getElementById('logout-button').addEventListener('click', function(event) {
        event.preventDefault();
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    });

    if (userEmailElement) {
        userEmailElement.addEventListener('click', function() {
            window.location.href = 'timesheet.html';
        });
    }
});
