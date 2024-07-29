document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbl3PB88KkGdPlT5x'; // New table ID for all operations

    const userEmail = localStorage.getItem('userEmail');
    let records = []; // Store the records locally for demonstration
    let currentEditingIndex = null; // Track the index of the record being edited

    // Define variables
    const form = document.getElementById('timeOffForm');
    const reasonDropdown = document.getElementById('reasonDropdown');
    const reasonInput = document.getElementById('reasonInput');
    const requestsList = document.getElementById('requestsList');
    const submissionStatus = document.createElement('div'); // Create the element dynamically
    const submittedData = document.createElement('div'); // Create the element dynamically
    const submittedEmployeeName = document.createElement('span'); // Create the element dynamically
    const submittedStartDate = document.createElement('span'); // Create the element dynamically
    const submittedStartTime = document.createElement('span'); // Create the element dynamically
    const submittedEndDate = document.createElement('span'); // Create the element dynamically
    const submittedEndTime = document.createElement('span'); // Create the element dynamically
    const submittedReason = document.createElement('span'); // Create the element dynamically
    const daysOffMessage = document.createElement('span'); // Create the element dynamically
    const submitButton = document.getElementById('submitButton'); // Submit button
    const logoutButton = document.getElementById('logout-button'); // Logout button

    // Append dynamically created elements to the body
    document.body.appendChild(submissionStatus);
    document.body.appendChild(submittedData);
    submittedData.appendChild(submittedEmployeeName);
    submittedData.appendChild(submittedStartDate);
    submittedData.appendChild(submittedStartTime);
    submittedData.appendChild(submittedEndDate);
    submittedData.appendChild(submittedEndTime);
    submittedData.appendChild(submittedReason);
    submittedData.appendChild(daysOffMessage);

    // Debugging
    console.log({ form, reasonDropdown, reasonInput, requestsList, submissionStatus, submittedData, submittedEmployeeName, submittedStartDate, submittedStartTime, submittedEndDate, submittedEndTime, submittedReason, daysOffMessage, submitButton, logoutButton });

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

    // Handle logout
    logoutButton.addEventListener('click', (event) => {
        handleLogout(event);
    });

    async function fetchEmployeeName(email) {
        try {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const data = await response.json();
            if (data.records.length > 0) {
                const employeeName = data.records[0].fields['Full Name'];
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
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const data = await response.json();
            records = data.records || []; // Initialize records as an empty array if undefined
            displayPreviousRequests(records);
        } catch (error) {
            console.error('Error fetching previous requests:', error);
        }
    }

    async function sendToAirtable(formData) {
        try {
            const employeeName = document.getElementById('employeeName').value;
            const recordId = await getRecordIdByName(employeeName);

            if (recordId) {
                // Update existing record
                const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fields: formData
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Record updated successfully:', data);
                    submissionStatus.textContent = 'Submission successful!';
                    submissionStatus.classList.remove('hidden');
                    submissionStatus.classList.add('success');
                    displaySubmittedData(formData); // Display the submitted data
                    fetchPreviousRequests(localStorage.getItem('userEmail')); // Refresh the records after saving
                } else {
                    const errorData = await response.json();
                    console.error('Error data from Airtable:', errorData); // Log error data
                    throw new Error(`Failed to update record: ${JSON.stringify(errorData)}`);
                }
            } else {
                // Create new record
                const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fields: formData
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Record saved successfully:', data);
                    submissionStatus.textContent = 'Submission successful!';
                    submissionStatus.classList.remove('hidden');
                    submissionStatus.classList.add('success');
                    displaySubmittedData(formData); // Display the submitted data
                    fetchPreviousRequests(localStorage.getItem('userEmail')); // Refresh the records after saving
                } else {
                    const errorData = await response.json();
                    console.error('Error data from Airtable:', errorData); // Log error data
                    throw new Error(`Failed to save record: ${JSON.stringify(errorData)}`);
                }
            }
        } catch (error) {
            console.error('Error saving to Airtable:', error);
            submissionStatus.textContent = 'Submission failed. Please try again.';
            submissionStatus.classList.remove('hidden');
            submissionStatus.classList.add('error');
        }
    }

    async function getRecordIdByName(name) {
        try {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{Full Name}='${name}'`)}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const data = await response.json();
            if (data.records.length > 0) {
                return data.records[0].id;
            }
            return null;
        } catch (error) {
            console.error('Error fetching record ID by name:', error);
            return null;
        }
    }

    function getNextAvailableIndex() {
        let maxIndex = 0;
        if (records) {
            records.forEach(record => {
                for (let i = 1; i <= 10; i++) {
                    if (record.fields[`Time off Start Date ${i}`]) {
                        maxIndex = i;
                    }
                }
            });
        }
        return maxIndex + 1;
    }

    function handleFormSubmit() {
        const reasonElement = document.getElementById('reasonDropdown');
        const reasonValue = reasonElement.value === 'other' ? document.getElementById('reasonInput').value : reasonElement.value;

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            submissionStatus.textContent = 'Start Date and End Date are required.';
            submissionStatus.classList.remove('hidden');
            submissionStatus.classList.add('error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            submissionStatus.textContent = 'Start Date cannot be later than End Date.';
            submissionStatus.classList.remove('hidden');
            submissionStatus.classList.add('error');
            return;
        }

        const nextIndex = currentEditingIndex !== null ? currentEditingIndex : getNextAvailableIndex();
        if (nextIndex > 10) {
            console.error('No available index to store the new time-off request.');
            submissionStatus.textContent = 'No available index to store the new time-off request.';
            submissionStatus.classList.remove('hidden');
            submissionStatus.classList.add('error');
            return;
        }

        const formData = {
            'Full Name': document.getElementById('employeeName').value,
            [`Time off Start Date ${nextIndex}`]: startDate,
            [`Time off Start Time ${nextIndex}`]: document.getElementById('startTime').value,
            [`Time off End Date ${nextIndex}`]: endDate,
            [`Time off End Time ${nextIndex}`]: document.getElementById('endTime').value,
            [`Reason ${nextIndex}`]: reasonValue
        };

        console.log('Form Data being sent:', formData); // Log the form data

        sendToAirtable(formData);

        // Clear only the necessary form fields, preserving the employee name
        document.getElementById('startDate').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('endTime').value = '';
        document.getElementById('reasonDropdown').value = '';
        document.getElementById('reasonInput').value = '';
        document.getElementById('reasonInput').classList.add('hidden');

        // Reset the editing index
        currentEditingIndex = null;

        // Change button text back to 'Submit'
        submitButton.textContent = 'Submit';

        // Refresh the records list
        fetchPreviousRequests(userEmail);
    }

    function displayPreviousRequests(records) {
        requestsList.innerHTML = ''; // Clear previous requests

        records.forEach(record => {
            for (let i = 1; i <= 10; i++) {
                if (record.fields[`Time off Start Date ${i}`]) {
                    const recordItem = document.createElement('li');
                    recordItem.className = 'record';

                    const approvedCheckbox = record.fields[`Time off Approved ${i}`] ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>';
                    const daysOff = calculateBusinessDays(record.fields[`Time off Start Date ${i}`], record.fields[`Time off End Date ${i}`]);

                    recordItem.innerHTML = `
                        <p><strong>Employee Name:</strong> ${record.fields['Full Name']}</p>
                        <p><strong>Start Date:</strong> ${record.fields[`Time off Start Date ${i}`]}</p>
                        <p><strong>Start Time:</strong> ${record.fields[`Time off Start Time ${i}`]}</p>
                        <p><strong>End Date:</strong> ${record.fields[`Time off End Date ${i}`]}</p>
                        <p><strong>End Time:</strong> ${record.fields[`Time off End Time ${i}`]}</p>
                        <p><strong>Reason:</strong> ${record.fields[`Reason ${i}`]}</p>
                        <p><strong>Days Off (excluding weekends):</strong> ${daysOff}</p>
                        <p><strong>Approved:</strong> ${approvedCheckbox}</p>
                        <button class="edit-button" data-index="${i}" data-id="${record.id}">Edit</button>
                        <button class="delete-button" data-index="${i}" data-id="${record.id}">Delete</button>
                    `;

                    requestsList.appendChild(recordItem);
                }
            }
        });

        // Add event listeners for Edit and Delete buttons
        document.querySelectorAll('.edit-button').forEach(button => {
            console.log('Adding event listener to edit button:', button);
            button.addEventListener('click', handleEditClick);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            console.log('Adding event listener to delete button:', button);
            button.addEventListener('click', handleDeleteClick);
        });
    }

    function handleEditClick(event) {
        console.log('Edit button clicked:', event.target);
        const index = event.target.dataset.index;
        const id = event.target.dataset.id;
        const record = records.find(record => record.id === id);
        console.log('Record to edit:', record);
        if (record) {
            currentEditingIndex = index;
            document.getElementById('startDate').value = record.fields[`Time off Start Date ${index}`] || '';
            document.getElementById('startTime').value = record.fields[`Time off Start Time ${index}`] || '';
            document.getElementById('endDate').value = record.fields[`Time off End Date ${index}`] || '';
            document.getElementById('endTime').value = record.fields[`Time off End Time ${index}`] || '';
            document.getElementById('reasonDropdown').value = record.fields[`Reason ${index}`] || '';

            if (document.getElementById('reasonDropdown').value === 'other') {
                document.getElementById('reasonInput').value = record.fields[`Reason ${index}`] || '';
                document.getElementById('reasonInput').classList.remove('hidden');
            } else {
                document.getElementById('reasonInput').classList.add('hidden');
            }

            // Focus on the start date field for user convenience
            document.getElementById('startDate').focus();

            // Change button text to 'Submit Edit'
            submitButton.textContent = 'Submit Edit';
        }
    }

    async function handleDeleteClick(event) {
        console.log('Delete button clicked:', event.target);
        const index = event.target.dataset.index;
        const id = event.target.dataset.id;
        const record = records.find(record => record.id === id);
        console.log('Record to delete:', record);
        if (record) {
            const confirmDelete = confirm('Are you sure you want to delete this request?');
            if (confirmDelete) {
                try {
                    // Remove the specific fields from the record
                    const fieldsToDelete = {
                        [`Time off Start Date ${index}`]: null,
                        [`Time off Start Time ${index}`]: null,
                        [`Time off End Date ${index}`]: null,
                        [`Time off End Time ${index}`]: null,
                        [`Reason ${index}`]: null,
                        [`Time off Approved ${index}`]: null
                    };

                    const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${id}`;
                    const response = await fetch(url, {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            fields: fieldsToDelete
                        })
                    });

                    if (response.ok) {
                        console.log('Fields deleted successfully');
                        fetchPreviousRequests(localStorage.getItem('userEmail')); // Refresh the records after deleting
                    } else {
                        const errorData = await response.json();
                        console.error('Error data from Airtable:', errorData); // Log error data
                        throw new Error(`Failed to delete fields: ${JSON.stringify(errorData)}`);
                    }
                } catch (error) {
                    console.error('Error deleting fields from Airtable:', error);
                }
            }
        }
    }

    function displaySubmittedData(formData) {
        const index = currentEditingIndex !== null ? currentEditingIndex : getNextAvailableIndex() - 1;
        submittedEmployeeName.textContent = formData['Full Name'];
        submittedStartDate.textContent = formData[`Time off Start Date ${index}`];
        submittedStartTime.textContent = formData[`Time off Start Time ${index}`];
        submittedEndDate.textContent = formData[`Time off End Date ${index}`];
        submittedEndTime.textContent = formData[`Time off End Time ${index}`];
        submittedReason.textContent = formData[`Reason ${index}`];

        const daysOff = calculateBusinessDays(formData[`Time off Start Date ${index}`], formData[`Time off End Date ${index}`]);
        daysOffMessage.textContent = `Total days off (excluding weekends): ${daysOff}`;

        submittedData.classList.remove('hidden');
    }

    function handleLogout(event) {
        event.preventDefault();
        console.log('Logging out...');
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('user');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
    }

    function calculateBusinessDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let count = 0;
        let currentDate = start;

        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sundays (0) and Saturdays (6)
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return count;
    }
});
