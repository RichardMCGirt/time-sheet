document.addEventListener("DOMContentLoaded", async function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    const weekEndingDisplay = document.getElementById('week-ending-display');
    const timesheetsBody = document.getElementById('timesheets-body');

    if (userEmailElement) {
        userEmailElement.textContent = supervisorEmail;
        userEmailElement.classList.add('clickable');
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
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Supervisor}='${supervisorName}')`;
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
                            <th class="time-column">Start Time</th>
                            <th class="time-column">Lunch Start</th>
                            <th class="time-column">Lunch End</th>
                            <th class="time-column">End Time</th>
                            <th class="time-column">Additional Time In</th>
                            <th class="time-column">Additional Time Out</th>
                            <th class="hours-worked-column">Hours Worked</th>
                            <th class="narrow-column">PTO Hours</th>
                            <th class="narrow-column">Personal Hours</th>
                            <th class="narrow-column">Holiday Hours</th>
                            <th class="work-column">Did not work</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;

                const tbody = table.querySelector('tbody');

                for (let day = 1; day <= 7; day++) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="date" name="date${day}" value="${fields[`Date${day}`] || ''}" readonly></td>
                        <td><input type="time" name="start_time${day}" value="${fields[`Start Time${day}`] || ''}" readonly></td>
                        <td><input type="time" name="lunch_start${day}" value="${fields[`Lunch Start${day}`] || ''}" readonly></td>
                        <td><input type="time" name="lunch_end${day}" value="${fields[`Lunch End${day}`] || ''}" readonly></td>
                        <td><input type="time" name="end_time${day}" value="${fields[`End Time${day}`] || ''}" readonly></td>
                        <td><input type="time" name="additional_time_in${day}" value="${fields[`Additional Time In${day}`] || ''}" readonly></td>
                        <td><input type="time" name="additional_time_out${day}" value="${fields[`Additional Time Out${day}`] || ''}" readonly></td>
                        <td><span id="hours-worked-today${day}">${fields[`Hours Worked${day}`] || ''}</span></td>
                        <td><input type="number" name="pto_hours${day}" value="${fields[`PTO Hours${day}`] || ''}" readonly></td>
                        <td><input type="number" name="personal_hours${day}" value="${fields[`Personal Hours${day}`] || ''}" readonly></td>
                        <td><input type="number" name="holiday_hours${day}" value="${fields[`Holiday Hours${day}`] || ''}" readonly></td>
                        <td><input type="checkbox" id="did-not-work-${day}" ${fields[`Did Not Work${day}`] ? 'checked' : ''} disabled></td>
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

    const supervisorName = await fetchSupervisorName(supervisorEmail);
    if (supervisorName) {
        await fetchTimesheets(supervisorName);
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
