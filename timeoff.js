document.addEventListener('DOMContentLoaded', function() {
    const userEmail = localStorage.getItem('userEmail');

    // Redirect to login page if no user email is found
    if (!userEmail) {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
        return; // Stop further execution if no user email
    }

    // Fetch employee name from Airtable
    fetchEmployeeName(userEmail);

    document.getElementById('timeOffForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting normally

        const reasonElement = document.getElementById('reasonDropdown');
        const reasonValue = reasonElement.value === 'other' ? document.getElementById('reasonInput').value : reasonElement.value;

        // Gather form data
        const formData = {
            employeeName: document.getElementById('employeeName').value,
            requestType: document.getElementById('requestType').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            reason: reasonValue,
        };

        // Save form data in local storage
        localStorage.setItem('timeOffRequest', JSON.stringify(formData));

        // Display form data in the submittedData section
        displaySubmittedData(formData);

        // Optionally, you can also clear the form
        document.getElementById('timeOffForm').reset();
        document.getElementById('reasonInput').classList.add('hidden');
        document.getElementById('reasonDropdown').classList.remove('hidden');

        // Send form data to Airtable
        sendToAirtable(formData);
    });

    document.getElementById('reasonDropdown').addEventListener('change', function() {
        const reasonInput = document.getElementById('reasonInput');
        if (this.value === 'other') {
            reasonInput.classList.remove('hidden');
        } else {
            reasonInput.classList.add('hidden');
        }
    });

    function fetchEmployeeName(email) {
        const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
        const baseId = 'app9gw2qxhGCmtJvW';
        const tableId = 'tbljmLpqXScwhiWTt';

        fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=Email='${email}'`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.records && data.records.length > 0) {
                const employeeName = data.records[0].fields['name'];
                document.getElementById('employeeName').value = employeeName;
            } else {
                alert('Employee not found.');
            }
        })
        .catch(error => {
            console.error('Error fetching employee name:', error);
            alert('Error fetching employee name.');
        });
    }

    function sendToAirtable(formData) {
        const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
        const baseId = 'app9gw2qxhGCmtJvW';
        const tableId = 'tbljmLpqXScwhiWTt';

        fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    'Employee Name': formData.employeeName,
                    'Request Type': formData.requestType,
                    'Time Off Start Date': formData.startDate,
                    'Time Off End Date': formData.endDate,
                    'Reason': formData.reason,
                    'Approved': false // Default value
                }
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            alert('Time-off request submitted successfully to Airtable!');
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('There was an error submitting your request to Airtable.');
        });
    }

    function displaySubmittedData(formData) {
        const approvedCheckbox = formData.approved ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>';

        document.getElementById('submittedEmployeeName').innerText = formData.employeeName;
        document.getElementById('submittedRequestType').innerText = formData.requestType;
        document.getElementById('submittedStartDate').innerText = formData.startDate;
        document.getElementById('submittedEndDate').innerText = formData.endDate;
        document.getElementById('submittedReason').innerText = formData.reason;

        document.getElementById('submittedData').classList.remove('hidden');
    }
});
