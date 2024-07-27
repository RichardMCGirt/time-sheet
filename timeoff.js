document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';

    const userEmail = localStorage.getItem('userEmail');
    let currentRecordId = null; // Store the current record ID for editing
    let records = []; // Store the records locally for demonstration

    // Define variables
    const form = document.getElementById('timeOffForm');
    const reasonDropdown = document.getElementById('reasonDropdown');
    const reasonInput = document.getElementById('reasonInput');
    const submittedData = document.getElementById('submittedData');
    const requestsList = document.getElementById('previousRequests'); // Correct reference

    // Redirect to login page if no user email is found
    if (!userEmail) {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }

    // Fetch employee name using Airtable API
    fetchEmployeeName(userEmail);

    // Toggle reason input visibility based on dropdown selection
    reasonDropdown.addEventListener('change', () => {
        if (reasonDropdown.value === 'other') {
            reasonInput.classList.remove('hidden');
        } else {
            reasonInput.classList.add('hidden');
        }
    });

    // Handle form submission
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleFormSubmit();
    });

    async function fetchEmployeeName(email) {
        try {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{Email}='${email}'`)}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const data = await response.json();
            if (data.records.length > 0) {
                const employeeName = data.records[0].fields.name;
                document.getElementById('employeeName').value = employeeName;
                document.getElementById('employeeName').readOnly = true;
                fetchPreviousRequests(email);
            } else {
                console.error('No employee found with the given email.');
            }
        } catch (error) {
            console.error('Error fetching employee name:', error);
        }
    }

    async function fetchPreviousRequests(email) {
        try {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{Email}='${email}'`)}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const data = await response.json();
            records = data.records;
            displayPreviousRequests(records);
        } catch (error) {
            console.error('Error fetching previous requests:', error);
        }
    }

    async function sendToAirtable(formData, recordId) {
        try {
            let url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
            let method = 'POST';
            if (recordId) {
                url += `/${recordId}`;
                method = 'PATCH';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: formData
                })
            });

            const data = await response.json();
            console.log('Record saved successfully:', data);
            fetchPreviousRequests(localStorage.getItem('userEmail')); // Refresh the records after saving
        } catch (error) {
            console.error('Error saving to Airtable:', error);
        }
    }

    function displayPreviousRequests(records) {
        requestsList.innerHTML = ''; // Clear previous requests

        records.forEach(record => {
            const recordDiv = document.createElement('div');
            recordDiv.className = 'record';

            const approvedCheckbox = record.fields.approved ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>';

            recordDiv.innerHTML = `
                <p>Employee Name: ${record.fields.name}</p>
                <p>Start Date: ${record.fields.startDate}</p>
                <p>End Date: ${record.fields.endDate}</p>
                <p>Reason: ${record.fields.reason}</p>
                <p>Approved: ${approvedCheckbox}</p>
                <button class="editBtn" data-id="${record.id}">Edit</button>
                <button class="deleteBtn" data-id="${record.id}">Delete</button>
            `;

            requestsList.appendChild(recordDiv);
        });

        document.querySelectorAll('.editBtn').forEach(button => {
            button.addEventListener('click', function() {
                const recordId = this.getAttribute('data-id');
                const record = records.find(record => record.id === recordId);
                currentRecordId = recordId; // Store the current record ID for editing
                fillFormForEdit(record);
            });
        });

        document.querySelectorAll('.deleteBtn').forEach(button => {
            button.addEventListener('click', function() {
                const recordId = this.getAttribute('data-id');
                deleteRecord(recordId);
            });
        });
    }

    function fillFormForEdit(record) {
        document.getElementById('startDate').value = record.fields.startDate;
        document.getElementById('endDate').value = record.fields.endDate;
        document.getElementById('reasonInput').value = record.fields.reason;

        const reasonElement = document.getElementById('reasonDropdown');
        if (record.fields.reason === 'other') {
            reasonInput.classList.remove('hidden');
            reasonElement.value = 'other'; // Set the dropdown to 'other'
        } else {
            reasonInput.classList.add('hidden');
            reasonElement.value = record.fields.reason;
        }
    }

    function handleFormSubmit() {
        const reasonElement = document.getElementById('reasonDropdown');
        const reasonValue = reasonElement.value === 'other' ? document.getElementById('reasonInput').value : reasonElement.value;
    
        const formData = {
            Email: localStorage.getItem('userEmail'),
            name: document.getElementById('employeeName').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            reason: reasonValue,
            approved: false // Default approved status
        };
    
        // Detect new fields (example logic, you might need to adapt it)
        const newFields = [];
        const savedRecords = records || [];
        const existingFieldsCount = savedRecords.length;

        const newFieldNames = [
            { name: `New Start Date ${existingFieldsCount + 1}`, type: 'date' },
            { name: `New End Date ${existingFieldsCount + 1}`, type: 'date' },
            { name: `Reason ${existingFieldsCount + 1}`, type: 'singleLineText' }
        ];

        newFields.push(...newFieldNames);
    
        // Add new fields to Airtable if there are any
        if (newFields.length > 0) {
            addFieldsToAirtable(newFields).then(() => {
                // After fields are added, save the form data
                sendToAirtable(formData, currentRecordId);
            });
        } else {
            // Save the form data if there are no new fields
            sendToAirtable(formData, currentRecordId);
        }
    
        // Clear only the necessary form fields, preserving the employee name
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('reasonDropdown').value = '';
        document.getElementById('reasonInput').value = '';
        document.getElementById('reasonInput').classList.add('hidden');
        currentRecordId = null;
    }

    async function addFieldsToAirtable(newFields) {
        const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`;

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: newFields
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Fields added successfully:', data);
            } else {
                const errorData = await response.json();
                console.error('Error adding fields:', errorData);
            }
        } catch (error) {
            console.error('Error adding fields to Airtable:', error);
        }
    }

    async function deleteRecord(recordId) {
        try {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (response.ok) {
                console.log('Record deleted successfully');
                fetchPreviousRequests(localStorage.getItem('userEmail')); // Refresh the records after deletion
            } else {
                const errorData = await response.json();
                console.error('Error deleting record:', errorData);
            }
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    }

    function displaySubmittedData(formData) {
        const container = document.getElementById('submittedData');
        container.innerHTML = `
            <h2>Submitted Time-Off Request</h2>
            <p><strong>Employee Name:</strong> ${formData.name}</p>
            <p><strong>Start Date:</strong> ${formData.startDate}</p>
            <p><strong>End Date:</strong> ${formData.endDate}</p>
            <p><strong>Reason:</strong> ${formData.reason}</p>
        `;
        container.classList.remove('hidden');
    }

    function deleteExpiredRecords() {
        const currentDate = new Date();
        const savedRecords = JSON.parse(localStorage.getItem('timeOffRecords')) || [];
        const validRecords = savedRecords.filter(record => {
            const endDate = new Date(record.fields.endDate);
            return currentDate <= endDate || (currentDate.getDate() === endDate.getDate() + 1 && currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear());
        });
        if (validRecords.length !== savedRecords.length) {
            localStorage.setItem('timeOffRecords', JSON.stringify(validRecords));
            fetchPreviousRequests(document.getElementById('employeeName').value);
        }
    }

    // Check for expired records every hour (3600000 milliseconds)
    setInterval(deleteExpiredRecords, 3600000);
    // Also call it once when the page loads
    deleteExpiredRecords();
});
