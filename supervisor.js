document.addEventListener("DOMContentLoaded", async function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';

    const supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';
    const userEmailElement = document.getElementById('user-email');
    
    if (userEmailElement) {
        userEmailElement.textContent = supervisorEmail;
        userEmailElement.classList.add('clickable');
    }

    const weekEndingDisplay = document.getElementById('week-ending-display');
    const timesheetsBody = document.getElementById('timesheets-body');

    async function fetchSupervisorName(email) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${email}')`;
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) {
            console.error(`Failed to fetch supervisor name: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        if (data.records.length > 0) {
            return data.records[0].fields['Full Name'];
        }
        return null;
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

        if (records.length > 0) {
            records.forEach(record => {
                const fields = record.fields;
                const employeeName = fields['Full Name'] || 'Unknown';

                const nameHeader = document.createElement('h3');
                nameHeader.textContent = `Employee: ${employeeName}`;
                timesheetsBody.appendChild(nameHeader);

                for (let day = 1; day <= 7; day++) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="date" name="date${day}" value="${fields[`Date${day}`] || ''}" readonly></td>
                        <td><input type="time" name="start_time${day}" value="${fields[`Start Time${day}`] || ''}" readonly></td>
                        <td><input type="time" name="lunch_start${day}" value="${fields[`Lunch Start${day}`] || ''}" readonly></td>
                        <td><input type="time" name="lunch_end${day}" value="${fields[`Lunch End${day}`] || ''}" readonly></td>
                        <td><input type="time" name="end_time${day}" value="${fields[`End Time${day}`] || ''}" readonly></td>
                        <td><input type="time" name="Additional_Time_In${day}" value="${fields[`Additional Time In${day}`] || ''}" readonly></td>
                        <td><input type="time" name="Additional_Time_Out${day}" value="${fields[`Additional Time Out${day}`] || ''}" readonly></td>
                        <td><span id="hours-worked-today${day}">${fields[`Hours Worked${day}`] || ''}</span></td>
                        <td><input type="number" name="PTO_hours${day}" value="${fields[`PTO Hours${day}`] || ''}" readonly></td>
                        <td><input type="number" name="Personal_hours${day}" value="${fields[`Personal Hours${day}`] || ''}" readonly></td>
                        <td><input type="number" name="Holiday_hours${day}" value="${fields[`Holiday Hours${day}`] || ''}" readonly></td>
                        <td><input type="checkbox" id="did-not-work-${day}" ${fields[`Did Not Work${day}`] ? 'checked' : ''} disabled></td>
                    `;
                    timesheetsBody.appendChild(row);
                }

                // Add seven empty rows for each employee
                for (let i = 0; i < 7; i++) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.innerHTML = `
                        <td><input type="date" name="date${i + 1}" readonly></td>
                        <td><input type="time" name="start_time${i + 1}" readonly></td>
                        <td><input type="time" name="lunch_start${i + 1}" readonly></td>
                        <td><input type="time" name="lunch_end${i + 1}" readonly></td>
                        <td><input type="time" name="end_time${i + 1}" readonly></td>
                        <td><input type="time" name="Additional_Time_In${i + 1}" readonly></td>
                        <td><input type="time" name="Additional_Time_Out${i + 1}" readonly></td>
                        <td><span id="hours-worked-today${i + 1}"></span></td>
                        <td><input type="number" name="PTO_hours${i + 1}" readonly></td>
                        <td><input type="number" name="Personal_hours${i + 1}" readonly></td>
                        <td><input type="number" name="Holiday_hours${i + 1}" readonly></td>
                        <td><input type="checkbox" id="did-not-work-${i + 1}" disabled></td>
                    `;
                    timesheetsBody.appendChild(emptyRow);
                }
            });
        } else {
            const noRecordsRow = document.createElement('tr');
            noRecordsRow.innerHTML = `<td colspan="12">No records found for the supervisor: ${supervisorEmail}</td>`;
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
