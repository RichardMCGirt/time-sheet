document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbl3PB88KkGdPlT5x'; // New table ID for all operations

    const userEmail = localStorage.getItem('userEmail');
    let records = []; // Store the records locally for demonstration

    // Define variables
    const form = document.getElementById('timeOffForm');
    const reasonDropdown = document.getElementById('reasonDropdown');
    const reasonInput = document.getElementById('reasonInput');
    const requestsList = document.getElementById('requestsList');
    const submissionStatus = document.getElementById('submissionStatus');
    const submittedData = document.getElementById('submittedData');
    const submittedEmployeeName = document.getElementById('submittedEmployeeName');
    const submittedStartDate = document.getElementById('submittedStartDate');
    const submittedStartTime = document.getElementById('submittedStartTime');
    const submittedEndDate = document.getElementById('submittedEndDate');
    const submittedEndTime = document.getElementById('submittedEndTime');
    const submittedReason = document.getElementById('submittedReason');

    // Debugging
    console.log({ form, reasonDropdown, reasonInput, requestsList, submissionStatus, submittedData, submittedEmployeeName, submittedStartDate, submittedStartTime, submittedEndDate, submittedEndTime, submittedReason });

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
                throw new Error(`Failed to save record: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error saving to Airtable:', error);
            submissionStatus.textContent = 'Submission failed. Please try again.';
            submissionStatus.classList.remove('hidden');
            submissionStatus.classList.add('error');
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

        const nextIndex = getNextAvailableIndex();
        if (nextIndex > 10) {
            console.error('No available index to store the new time-off request.');
            submissionStatus.textContent = 'No available index to store the new time-off request.';
            submissionStatus.classList.remove('hidden');
            submissionStatus.classList.add('error');
            return;
        }

        const formData = {
            'Full Name': document.getElementById('employeeName').value,
            [`Time off Start Date ${nextIndex}`]: document.getElementById('startDate').value,
            [`Time off Start Time ${nextIndex}`]: document.getElementById('startTime').value,
            [`Time off End Date ${nextIndex}`]: document.getElementById('endDate').value,
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
    }

    function displayPreviousRequests(records) {
        requestsList.innerHTML = ''; // Clear previous requests

        records.forEach(record => {
            for (let i = 1; i <= 10; i++) {
                if (record.fields[`Time off Start Date ${i}`]) {
                    const recordItem = document.createElement('li');
                    recordItem.className = 'record';

                    const approvedCheckbox = record.fields[`Time off Approved ${i}`] ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>';

                    recordItem.innerHTML = `
                        <p><strong>Employee Name:</strong> ${record.fields['Full Name']}</p>
                        <p><strong>Start Date:</strong> ${record.fields[`Time off Start Date ${i}`]}</p>
                        <p><strong>Start Time:</strong> ${record.fields[`Time off Start Time ${i}`]}</p>
                        <p><strong>End Date:</strong> ${record.fields[`Time off End Date ${i}`]}</p>
                        <p><strong>End Time:</strong> ${record.fields[`Time off End Time ${i}`]}</p>
                        <p><strong>Reason:</strong> ${record.fields[`Reason ${i}`]}</p>
                        <p><strong>Approved:</strong> ${approvedCheckbox}</p>
                    `;

                    requestsList.appendChild(recordItem);
                }
            }
        });
    }

    function displaySubmittedData(formData) {
        const index = getNextAvailableIndex() - 1;
        submittedEmployeeName.textContent = formData['Full Name'];
        submittedStartDate.textContent = formData[`Time off Start Date ${index}`];
        submittedStartTime.textContent = formData[`Time off Start Time ${index}`];
        submittedEndDate.textContent = formData[`Time off End Date ${index}`];
        submittedEndTime.textContent = formData[`Time off End Time ${index}`];
        submittedReason.textContent = formData[`Reason ${index}`];

        submittedData.classList.remove('hidden');
    }
});
