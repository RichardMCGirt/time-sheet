document.addEventListener('DOMContentLoaded', () => {
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

    // Simulate fetching employee name
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

    function fetchEmployeeName(email) {
        const employeeName = "John Doe"; // Simulated employee name
        document.getElementById('employeeName').value = employeeName;
        document.getElementById('employeeName').readOnly = true;
        fetchPreviousRequests(employeeName);
    }

    function sendToLocalStorage(formData, recordId) {
        if (recordId) {
            // Update the record locally
            const record = records.find(record => record.id === recordId);
            if (record) {
                record.fields = formData;
            }
        } else {
            // Create a new record locally
            const newRecord = {
                id: Date.now().toString(),
                fields: formData
            };
            records.push(newRecord);
        }

        // Save to localStorage
        localStorage.setItem('timeOffRecords', JSON.stringify(records));
        fetchPreviousRequests(formData.employeeName); // Ensure correct employee name is used
        displaySubmittedData(formData);
        currentRecordId = null; // Reset the current record ID after submission
    }

    function fetchPreviousRequests(employeeName) {
        const savedRecords = JSON.parse(localStorage.getItem('timeOffRecords')) || [];
        records = savedRecords.filter(record => record.fields.employeeName === employeeName);
        displayPreviousRequests(records);
    }

    function displayPreviousRequests(records) {
        requestsList.innerHTML = ''; // Clear previous requests

        records.forEach(record => {
            const recordDiv = document.createElement('div');
            recordDiv.className = 'record';

            const approvedCheckbox = record.fields.approved ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>';

            recordDiv.innerHTML = `
                <p>Employee Name: ${record.fields.employeeName}</p>
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
            employeeName: document.getElementById('employeeName').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            reason: reasonValue,
            approved: false // Default approved status
        };

        sendToLocalStorage(formData, currentRecordId);

        // Clear only the necessary form fields, preserving the employee name
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('reasonDropdown').value = '';
        document.getElementById('reasonInput').value = '';
        document.getElementById('reasonInput').classList.add('hidden');
        currentRecordId = null;
    }

    function deleteRecord(recordId) {
        records = records.filter(record => record.id !== recordId);
        localStorage.setItem('timeOffRecords', JSON.stringify(records));
        fetchPreviousRequests(document.getElementById('employeeName').value);
    }

    function displaySubmittedData(formData) {
        const container = document.getElementById('submittedData');
        container.innerHTML = `
            <h2>Submitted Time-Off Request</h2>
            <p><strong>Employee Name:</strong> ${formData.employeeName}</p>
            <p><strong>Start Date:</strong> ${formData.startDate}</p>
            <p><strong>End Date:</strong> ${formData.endDate}</p>
            <p><strong>Reason:</strong> ${formData.reason}</p>
        `;
        container.classList.remove('hidden');
    }
});
