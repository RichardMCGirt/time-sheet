document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
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

    // Hide elements during data fetching
    titleElement.style.display = 'none';
    messageContainer.style.display = 'none';
    checkAllButton.style.display = 'none';
    keyEnterHint.style.display = 'none';

    // Handle the loading screen
    setTimeout(() => {
        // Trigger the transition to full color
        loadingLogo.classList.add('full-color');

        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                // Now load the data and show the main content
                mainContent.classList.add('visible');
                loadDataAndInitializePage(); 
            }, 700); // Wait 1 second for the fade-out transition before hiding
        }, 1000); // Wait 1 second for the full color transition before starting fade-out
    }, 1000); // Display the loading screen for 1 second before starting the color transition

    async function loadDataAndInitializePage() {
        const supervisorName = await fetchSupervisorName(supervisorEmail);
        if (supervisorName) {
            await fetchTimesheets(supervisorName);
        } else {
            console.error(`Supervisor not found for email: ${supervisorEmail}`);
            alert("Supervisor not found. Please check your email and try again.");
        }
    }

    async function fetchSupervisorName(email) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${email}')`;
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch supervisor name: ${response.statusText}`);
            const data = await response.json();
            return data.records.length > 0 ? data.records[0].fields['Full Name'] : null;
        } catch (error) {
            console.error(error);
            alert("Error fetching supervisor data. Please try again later.");
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
            alert("Error fetching employee data. Please try again later.");
            return 'Unknown';
        }
    }

    async function fetchTimesheets(supervisorName) {
        const filterFormula = supervisorEmail === 'katy@vanirinstalledsales.com' ? 
                              '{Employee Number}!=BLANK()' : 
                              `AND({Supervisor}='${supervisorName}', {Employee Number}!=BLANK())`;

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${filterFormula}&sort[0][field]=Employee Number&sort[0][direction]=asc`;

        try {
            loadingIndicator.style.display = 'block'; // Show loading indicator
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch timesheets: ${response.statusText}`);
            const data = await response.json();
            await populateTimesheets(data.records);
        } catch (error) {
            console.error(error);
            alert("Error fetching timesheet data. Please try again later.");
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading indicator
            // Show elements after data has been fetched
            titleElement.style.display = '';
            messageContainer.style.display = '';
            checkAllButton.style.display = '';
            keyEnterHint.style.display = '';
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
                const hasValues = checkTimesheetValues(fields);
    
                const nameContainer = document.createElement('div');
                nameContainer.classList.add('name-container');
                nameContainer.textContent = `${employeeName}`; // Employee name only, number hidden
                nameContainer.setAttribute('data-record-id', record.id); // Set the record ID
                nameContainer.setAttribute('data-employee-number', employeeNumber); // Store employee number for CSV generation
                nameContainer.addEventListener('click', () => {
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
                            <!-- Employee Number column removed from the table header -->
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
                        ${generateRows(fields, record.id, employeeNumber)} <!-- Pass employeeNumber -->
                    </tbody>
                `;
    
                if (supervisorEmail !== 'katy@vanirinstalledsales.com' && fields['Approved']) {
                    table.style.display = 'none'; // Hide approved rows for non-Katy users
                }
    
                timesheetsBody.appendChild(table);
            }
        } else {
            const noRecordsRow = document.createElement('div');
            noRecordsRow.classList.add('name-container');
            noRecordsRow.textContent = `No records found for the supervisor: ${supervisorEmail}`;
            timesheetsBody.appendChild(noRecordsRow);
        }
    }

    function checkTimesheetValues(fields) {
        return fields['Total Hours Worked'] || fields['PTO Time Used'] || fields['Personal Time Used'] || fields['Holiday Hours Used'];
    }
    
    function toggleVisibility(recordId) {
        const nameContainer = timesheetsBody.querySelector(`.name-container[data-record-id="${recordId}"]`);
        const table = timesheetsBody.querySelector(`.time-entry-table[data-record-id="${recordId}"]`);
    
        if (nameContainer && table) {
            // Toggle the display of the table
            table.style.display = table.style.display === 'none' ? '' : 'none';
            nameContainer.classList.toggle('hidden', table.style.display === 'none');
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

        // Adjust visibility of the table based on the checkbox state
        const table = timesheetsBody.querySelector(`.time-entry-table[data-record-id="${recordId}"]`);
    
        if (table) {
            if (supervisorEmail !== 'katy@vanirinstalledsales.com') {
                // Hide the table if the checkbox is checked and the supervisor is not Katy
                table.style.display = isApproved ? 'none' : '';
            } else {
                // For Katy, do not hide the table based on checkbox state
                table.style.display = '';
            }
        }
    }

    function generateRows(fields, recordId, employeeNumber) {
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
    
        return `
            <tr>
                <!-- Removed Employee Number Row -->
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

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const handleBlurDebounced = debounce(async function (event) {
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
    }, 300);

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

    function resetAllCheckboxes() {
        const checkboxes = timesheetsBody.querySelectorAll('.approve-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const recordId = checkbox.getAttribute('data-record-id');
            updateApprovalStatus(recordId, false, null);
        });
    }

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

    function exportToExcel() {
        const data = collectTimesheetData();
        
        // Define header row and data
        const wsData = [
            ["Employee Name", "Date Ending", "Hours Worked", "PTO Hours Used", "Personal Hours Used", "Holiday Hours Used", "Gifted Hours", "Total Hours"],
            ...data
        ];

        // Create a new worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Define styles
        const headerStyle = {
            font: { bold: true, color: "FFFFFF" }, // Bold font and white text
            fill: { fgColor: { rgb: "000000" } }   // Black background
        };

        // Apply styles to header row (row index 0)
        for (let col = 0; col < wsData[0].length; col++) {
            const cellAddress = { c: col, r: 0 }; // { c: column index, r: row index }
            const cellRef = XLSX.utils.encode_cell(cellAddress);
            ws[cellRef].s = headerStyle; // Apply the style
        }

        // Define column widths
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

        // Create a new workbook and add the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Timesheets Data');

        // Write workbook to file
        XLSX.writeFile(wb, 'timesheets_data.xlsx');
    }

    document.getElementById('customXlsxButton').addEventListener('click', generateCustomXlsx);

    function generateCustomXlsx() {
        const data = [];
        data.push(["RECTYPE", "EMPLOYEE", "PEREND", "TIMECARD", "LINENUM", "CATEGORY", "EARNDED", "HOURS"]);
        
        const tables = document.querySelectorAll('.time-entry-table');
        
        tables.forEach(table => {
            const recordId = table.getAttribute('data-record-id');
            const employeeNumber = getEmployeeNumber(recordId);
            
            if (employeeNumber) {
                const formattedEmployeeNumber = formatEmployeeNumber(employeeNumber);
                const rows = table.querySelectorAll('tbody tr');
        
                let lineNumber = 1; // Start the line number at 1 for each employee
        
                rows.forEach(row => {
                    const formattedDate = formatDate(row.querySelector('input[name="dateEnding"]').value);
        
                    if (formattedDate) {
                        const xlsxRows = generateXlsxRows(row, formattedEmployeeNumber, formattedDate, lineNumber);
                        data.push(...xlsxRows);
                        lineNumber = (lineNumber % 8) + 1; // Increment and reset line number after reaching 8
                    }
                });
            } else {
                console.warn(`Employee number element not found for record ID: ${recordId}`);
            }
        });
        
        downloadXlsx(data, 'custom_timesheets.xlsx');
    }
    
    function generateXlsxRows(row, formattedEmployeeNumber, formattedDate, lineNumber) {
        const totalHours = parseFloat(row.querySelector('input[name="total_hours"]').value || 0);
        const giftedHours = parseFloat(row.querySelector('input[name="gifted_hours"]').value || 0);
        const ptoHours = parseFloat(row.querySelector('input[name="pto_hours"]').value || 0);
        const personalHours = parseFloat(row.querySelector('input[name="personal_hours"]').value || 0);
        const holidayHours = parseFloat(row.querySelector('input[name="holiday_hours"]').value || 0);
        const overtimeHours = Math.max(totalHours - 40, 0);
        const xlsxRows = [];
    
        // Regular hours (capped at 40) and category 2
        if (totalHours > 0) {
            const regularHours = Math.min(totalHours, 40);
            xlsxRows.push(generateXlsxLine(formattedEmployeeNumber, formattedDate, 2, '0001', regularHours, lineNumber++));
        }
    
        // Overtime hours and category 2
        if (overtimeHours > 0) {
            xlsxRows.push(generateXlsxLine(formattedEmployeeNumber, formattedDate, 2, '0002', overtimeHours, lineNumber++));
        }
    
        // Gifted hours and category 2
        if (giftedHours > 0) {
            const cappedGiftedHours = Math.min(giftedHours, 3);
            xlsxRows.push(generateXlsxLine(formattedEmployeeNumber, formattedDate, 2, '0011', cappedGiftedHours, lineNumber++));
        }
    
        // PTO hours and category 2
        if (ptoHours > 0) {
            xlsxRows.push(generateXlsxLine(formattedEmployeeNumber, formattedDate, 2, '0004', ptoHours, lineNumber++));
        }
    
        // Personal hours and category 2
        if (personalHours > 0) {
            xlsxRows.push(generateXlsxLine(formattedEmployeeNumber, formattedDate, 2, '0005', personalHours, lineNumber++));
        }
    
        // Holiday hours and category 2
        if (holidayHours > 0) {
            xlsxRows.push(generateXlsxLine(formattedEmployeeNumber, formattedDate, 2, '0007', holidayHours, lineNumber++));
        }
    
        return xlsxRows;
    }
    
    function generateXlsxLine(employeeNumber, date, category, earnDed, hours, lineNumber) {
        const formattedEarnDed = `${earnDed.toString().padStart(4, '0')}`;
        return [2, employeeNumber, date, 'R', lineNumber, category, formattedEarnDed, hours];
    }
    
    function downloadXlsx(data, filename) {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheets');
        XLSX.writeFile(workbook, filename);
    }
    
    function getEmployeeNumber(recordId) {
        const nameContainer = document.querySelector(`.name-container[data-record-id="${recordId}"]`);
        return nameContainer ? nameContainer.getAttribute('data-employee-number').trim() : null;
    }
    
    function formatEmployeeNumber(employeeNumber) {
        return employeeNumber.padStart(6, '0');
    }
    
    function formatDate(dateEnding) {
        if (!dateEnding) {
            console.warn('Empty date field detected, skipping row.');
            return null;
        }
        const dateObj = new Date(dateEnding);
        if (isNaN(dateObj.getTime())) {
            console.warn(`Invalid date: ${dateEnding}`);
            return null;
        }
        return dateObj.toISOString().split('T')[0].replace(/-/g, '');
    }
    
    
    
    

    // Schedule checkbox reset for every Thursday
    const now = new Date();
    const nextThursday = new Date();
    nextThursday.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7));
    nextThursday.setHours(0, 0, 0, 0);

    const timeUntilNextThursday = nextThursday - now;
    setTimeout(function() {
        resetAllCheckboxes();
        setInterval(resetAllCheckboxes, 7 * 24 * 60 * 60 * 1000); // Every 7 days
    }, timeUntilNextThursday);
});