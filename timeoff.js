document.addEventListener("DOMContentLoaded", function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const timeOffForm = document.getElementById('time-off-form');
    const submitButton = document.getElementById('submit-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const ptoHoursElement = document.getElementById('pto-hours');
    const personalHoursElement = document.getElementById('personal-hours');
    const userEmail = localStorage.getItem('userEmail');
    const userEmailElement = document.getElementById('user-email');
    const requestsContainer = document.getElementById('requests-container');

    // Redirect to login page if user is not logged in
    if (!userEmail) {
        window.location.href = 'index.html';
        return;
    }

    // Display user email
    userEmailElement.textContent = userEmail;

    // Fetch user data from Airtable
    async function fetchUserData() {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={Email}="${userEmail}"`;
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch user data: ${response.statusText}`);
            const data = await response.json();
            updateUserInfo(data.records[0].fields);
        } catch (error) {
            console.error(error);
            alert('Failed to load user data. Please try again later.');
        } finally {
            loadingIndicator.classList.remove('active');
        }
    }

    // Update user info in the header
    function updateUserInfo(fields) {
        ptoHoursElement.textContent = fields['PTO Hours'] || '0';
        personalHoursElement.textContent = fields['Personal Hours'] || '0';
    }

    // Handle form submission
    timeOffForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Validate dates
        const startDateElements = timeOffForm.querySelectorAll('input[name="start_date[]"]');
        const endDateElements = timeOffForm.querySelectorAll('input[name="end_date[]"]');
        const singleDateElements = timeOffForm.querySelectorAll('input[name="single_date[]"]');
        const dateRanges = [];

        for (let i = 0; i < startDateElements.length; i++) {
            const startDate = new Date(startDateElements[i].value);
            const endDate = new Date(endDateElements[i].value);
            if (endDate < startDate) {
                alert('End Date cannot be before Start Date.');
                return;
            }
            dateRanges.push({ "Start Date": startDateElements[i].value, "End Date": endDateElements[i].value });
        }

        singleDateElements.forEach(singleDate => {
            dateRanges.push({ "Single Date": singleDate.value });
        });

        // Collect form data
        const formData = new FormData(timeOffForm);
        const reason = formData.get('reason') === 'Other' ? formData.get('other_reason') : formData.get('reason');
        const data = {
            fields: {
                "Employee Name": userEmail,
                "Date Ranges": dateRanges,
                "Reason": reason
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
            document.getElementById('other-reason').style.display = 'none';
            displayRequest(data.fields);
        } catch (error) {
            console.error('Error submitting time-off request:', error);
            alert('Failed to submit time-off request. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
        }
    });

    // Display submitted time-off request
    function displayRequest(fields) {
        const requestElement = document.createElement('div');
        requestElement.classList.add('request');

        const dateRangeElements = fields["Date Ranges"].map(range => {
            if (range["Start Date"] && range["End Date"]) {
                return `<p>Start Date: ${range["Start Date"]} - End Date: ${range["End Date"]}</p>`;
            } else {
                return `<p>Single Date: ${range["Single Date"]}</p>`;
            }
        }).join("");

        requestElement.innerHTML = `
            <div>
                <p><strong>Employee:</strong> ${fields["Employee Name"]}</p>
                ${dateRangeElements}
                <p><strong>Reason:</strong> ${fields["Reason"]}</p>
            </div>
            <div>
                <label for="approve-${fields["Employee Name"]}">Approve:</label>
                <input type="checkbox" id="approve-${fields["Employee Name"]}" name="approve-${fields["Employee Name"]}">
            </div>
        `;

        requestsContainer.appendChild(requestElement);
    }

    // Initialize the form
    fetchUserData();
});
