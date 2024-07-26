document.addEventListener("DOMContentLoaded", function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const employeeNameDropdown = document.getElementById('employee-name');
    const timeOffForm = document.getElementById('time-off-form');
    const submitButton = document.getElementById('submit-button');
    const loadingIndicator = document.getElementById('loading-indicator');

    const userEmail = localStorage.getItem('userEmail');

    // Redirect to login page if user is not logged in
    if (!userEmail) {
        window.location.href = 'index.html';
        return;
    }

    // Fetch employee names from Airtable
    async function fetchEmployeeNames() {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={Email}="${userEmail}"&fields[]=name`;
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch employee names: ${response.statusText}`);
            const data = await response.json();
            populateEmployeeDropdown(data.records);
        } catch (error) {
            console.error(error);
            alert('Failed to load employee names. Please try again later.');
        } finally {
            loadingIndicator.classList.remove('active');
        }
    }

    // Populate the dropdown with employee names
    function populateEmployeeDropdown(records) {
        records.forEach(record => {
            const name = record.fields['name'];
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            employeeNameDropdown.appendChild(option);
        });

        // Select the user's name by default
        if (records.length > 0) {
            employeeNameDropdown.value = records[0].fields['name'];
        }
    }

    // Handle form submission
    timeOffForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Validate dates
        const startDate = new Date(timeOffForm.start_date.value);
        const endDate = new Date(timeOffForm.end_date.value);
        if (endDate < startDate) {
            alert('End Date cannot be before Start Date.');
            return;
        }

        // Collect form data
        const formData = new FormData(timeOffForm);
        const data = {
            fields: {
                "Employee Name": formData.get('employee_name'),
                "Start Date": formData.get('start_date'),
                "End Date": formData.get('end_date'),
                "Reason": formData.get('reason')
            }
        };

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`Failed to submit time-off request: ${response.statusText}`);
            alert('Time-off request submitted successfully!');
            timeOffForm.reset();
        } catch (error) {
            console.error('Error submitting time-off request:', error);
            alert('Failed to submit time-off request. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
        }
    });

    // Initialize the form
    fetchEmployeeNames();
});