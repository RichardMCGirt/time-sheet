document.addEventListener('DOMContentLoaded', function() {
    const userEmail = localStorage.getItem('userEmail');
    let currentRecordId = null; // Store the current record ID for editing
    let records = []; // Store the records locally for demonstration

    // Redirect to login page if no user email is found
    if (!userEmail) {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
        return; // Stop further execution if no user email
    }

    // Simulate fetching employee name
    fetchEmployeeName(userEmail);

    document.getElementById('timeOffForm').addEventListener('submit', function(event) {
        event.preventDefault();
        handleFormSubmit();
    });

    document.getElementById('reasonDropdown').addEventListener('change', function() {
        const reasonInput = document.getElementById('reasonInput');
        if (this.value === 'other') {
            reasonInput.classList.remove('hidden');
            reasonInput.required = true;
            this.classList.add('hidden');
        } else {
            reasonInput.classList.add('hidden');
            reasonInput.required = false;
            this.classList.remove('hidden');
        }
    });

    function fetchEmployeeName(email) {
        const employeeName = "John Doe"; // Simulated employee name
        document.getElementById('employeeName').value = employeeName;
        document.getElementById('employeeName').readOnly = true;
        fetchPreviousRequests(employeeName);
    }

    function sendToAirtable(formData, recordId) {
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

        console.log('Records:', records);
        fetchPreviousRequests(formData.employeeName);
        displaySubmittedData(formData);
        currentRecordId = null; // Reset the current record ID after submission
    }

    function fetchPreviousRequests(employeeName) {
        const employeeRecords = records.filter(record => record.fields.employeeName === employeeName);
        displayPreviousRequests(employeeRecords);
    }

    function displayPreviousRequests(records) {
        const container = document.getElementById('previousRequests');
        container.innerHTML = '';

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

            container.appendChild(recordDiv);
        });

        document.querySelectorAll('.editBtn').forEach(button => {
            button.addEventListener('click', function() {
                const recordId = this.getAttribute('data-id');
                const record = records.find(record => record.id === recordId);
                currentRecordId = recordId; // Store the current record ID for editing
                console.log(`Edit button clicked. Current record ID set to: ${currentRecordId}`); // Debugging line
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
        const reasonInput = document.getElementById('reasonInput');
        if (record.fields.reason === 'other') {
            reasonInput.classList.remove('hidden');
            reasonElement.classList.add('hidden');
        } else {
            reasonInput.classList.add('hidden');
            reasonElement.classList.remove('hidden');
        }

        console.log(`Form filled for editing. Current record ID: ${currentRecordId}`); // Debugging line
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

        console.log(`Form submitted. Current record ID: ${currentRecordId}`); // Debugging line

        sendToAirtable(formData, currentRecordId);

        // Clear only the necessary form fields, preserving the employee name
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('reasonDropdown').value = '';
        document.getElementById('reasonInput').value = '';
        document.getElementById('reasonInput').classList.add('hidden');
        document.getElementById('reasonDropdown').classList.remove('hidden');
        currentRecordId = null;
    }

    function deleteRecord(recordId) {
        records = records.filter(record => record.id !== recordId);
        console.log('Record deleted:', recordId);
        fetchPreviousRequests(document.getElementById('employeeName').value);
    }

    function displaySubmittedData(formData) {
        const container = document.getElementById('submittedData');
        const recordDiv = document.createElement('div');
        recordDiv.className = 'record';

        recordDiv.innerHTML = `
            <p>Employee Name: ${formData.employeeName}</p>
            <p>Start Date: ${formData.startDate}</p>
            <p>End Date: ${formData.endDate}</p>
            <p>Reason: ${formData.reason}</p>
        `;

        container.appendChild(recordDiv);
    }
});
