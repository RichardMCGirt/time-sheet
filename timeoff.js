document.addEventListener("DOMContentLoaded", function () {
    // Element References
    const timeOffForm = document.getElementById('time-off-form');
    const submitButton = document.getElementById('submit-button');
    const addButton = document.getElementById('add-date-range');
    const addSingleButton = document.getElementById('add-single-date');
    const ptoHoursElement = document.getElementById('pto-hours');
    const personalHoursElement = document.getElementById('personal-hours');
    const userEmail = localStorage.getItem('userEmail');
    const userEmailElement = document.getElementById('user-email');
    const requestsContainer = document.getElementById('requests-container');
    const dateContainer = document.getElementById('date-range-container');
    let submissionCount = 0;

    // Redirect if userEmail is not found
    if (!userEmail) {
        window.location.href = 'index.html';
        return;
    }

    // Display the user's email
    userEmailElement.textContent = userEmail;

    // Handle adding date inputs
    addButton.addEventListener('click', function () {
        if (submissionCount >= 4) {
            alert('You can only add a maximum of 4 submissions.');
            return;
        }

        submissionCount++;

        const dateInputGroup = document.createElement('div');
        dateInputGroup.classList.add('date-range', 'form-group-row');
        dateInputGroup.setAttribute('data-index', submissionCount);
        dateInputGroup.innerHTML = `
            <div class="form-group">
                <label for="start-date-${submissionCount}">Start Date:</label>
                <input type="date" id="start-date-${submissionCount}" name="start_date[]" required>
            </div>
            <div class="form-group">
                <label for="end-date-${submissionCount}">End Date:</label>
                <input type="date" id="end-date-${submissionCount}" name="end_date[]" required>
            </div>
            <div class="form-group">
                <label for="reason-${submissionCount}">Reason:</label>
                <select id="reason-${submissionCount}" name="reason-${submissionCount}" required>
                    <option value="">Select Reason</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal">Personal</option>
                    <option value="Family Emergency">Family Emergency</option>
                    <option value="Bereavement">Bereavement</option>
                    <option value="Jury Duty">Jury Duty</option>
                    <option value="Medical Appointment">Medical Appointment</option>
                    <option value="Other">Other</option>
                </select>
                <input type="text" id="other-reason-${submissionCount}" name="other_reason-${submissionCount}" placeholder="Please specify" style="display: none; margin-top: 10px;">
            </div>
            <button type="button" class="delete-date-range" onclick="deleteDateRange(${submissionCount})">Delete Date Range</button>
        `;
        dateContainer.appendChild(dateInputGroup);

        document.getElementById(`start-date-${submissionCount}`).addEventListener('change', function () {
            const startDate = this.value;
            document.getElementById(`end-date-${submissionCount}`).setAttribute('min', startDate);
        });

        document.getElementById(`end-date-${submissionCount}`).addEventListener('change', function () {
            const endDate = this.value;
            document.getElementById(`start-date-${submissionCount}`).setAttribute('max', endDate);
        });

        document.getElementById(`reason-${submissionCount}`).addEventListener('change', function () {
            const otherReasonInput = document.getElementById(`other-reason-${submissionCount}`);
            if (this.value === 'Other') {
                otherReasonInput.style.display = 'block';
                otherReasonInput.required = true;
            } else {
                otherReasonInput.style.display = 'none';
                otherReasonInput.required = false;
            }
        });
    });

    addSingleButton.addEventListener('click', function () {
        if (submissionCount >= 4) {
            alert('You can only add a maximum of 4 submissions.');
            return;
        }

        submissionCount++;

        const singleDateInputGroup = document.createElement('div');
        singleDateInputGroup.classList.add('single-date', 'form-group-row');
        singleDateInputGroup.setAttribute('data-index', submissionCount);
        singleDateInputGroup.innerHTML = `
            <div class="form-group">
                <label for="single-date-${submissionCount}">Date:</label>
                <input type="date" id="single-date-${submissionCount}" name="single_date[]" required>
            </div>
            <div class="form-group">
                <label for="reason-${submissionCount}">Reason:</label>
                <select id="reason-${submissionCount}" name="reason-${submissionCount}" required>
                    <option value="">Select Reason</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal">Personal</option>
                    <option value="Family Emergency">Family Emergency</option>
                    <option value="Bereavement">Bereavement</option>
                    <option value="Jury Duty">Jury Duty</option>
                    <option value="Medical Appointment">Medical Appointment</option>
                    <option value="Other">Other</option>
                </select>
                <input type="text" id="other-reason-${submissionCount}" name="other_reason-${submissionCount}" placeholder="Please specify" style="display: none; margin-top: 10px;">
            </div>
            <button type="button" class="delete-single-date" onclick="deleteSingleDate(${submissionCount})">Delete Date</button>
        `;
        dateContainer.appendChild(singleDateInputGroup);

        document.getElementById(`reason-${submissionCount}`).addEventListener('change', function () {
            const otherReasonInput = document.getElementById(`other-reason-${submissionCount}`);
            if (this.value === 'Other') {
                otherReasonInput.style.display = 'block';
                otherReasonInput.required = true;
            } else {
                otherReasonInput.style.display = 'none';
                otherReasonInput.required = false;
            }
        });
    });

    // Handle time-off form submission
    timeOffForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const startDateElements = timeOffForm.querySelectorAll('input[name="start_date[]"]');
        const endDateElements = timeOffForm.querySelectorAll('input[name="end_date[]"]');
        const singleDateElements = timeOffForm.querySelectorAll('input[name="single_date[]"]');
        const dateRanges = [];
        const reasons = [];

        // Validate date ranges
        for (let i = 0; i < startDateElements.length; i++) {
            const startDate = new Date(startDateElements[i].value);
            const endDate = new Date(endDateElements[i].value);
            if (endDate < startDate) {
                alert('End Date cannot be before Start Date.');
                return;
            }
            dateRanges.push({ "Start Date": startDateElements[i].value, "End Date": endDateElements[i].value });
            reasons.push(timeOffForm.querySelector(`select[name="reason-${i+1}"]`).value);
        }

        // Add single dates
        singleDateElements.forEach(singleDate => {
            dateRanges.push({ "Single Date": singleDate.value });
            reasons.push(timeOffForm.querySelector(`select[name="reason-${submissionCount}"]`).value);
        });

        if (dateRanges.length > 4) {
            alert('You can only submit a maximum of 4 requests.');
            return;
        }

        const requestDetails = dateRanges.map((range, index) => {
            const reason = reasons[index];
            return `
                <div>
                    <p><strong>Submission ${index + 1}:</strong> ${range["Start Date"] ? `${range["Start Date"]} to ${range["End Date"]}` : range["Single Date"]}</p>
                    <p><strong>Reason:</strong> ${reason}</p>
                </div>
            `;
        }).join("");

        const requestElement = document.createElement('div');
        requestElement.classList.add('request');
        requestElement.innerHTML = `
            <div>
                <p><strong>Employee:</strong> ${userEmail}</p>
                ${requestDetails}
            </div>
        `;
        requestsContainer.appendChild(requestElement);

        alert('Time-off request submitted successfully!');
        timeOffForm.reset();
        submissionCount = 0; // Reset count after successful submission
        dateContainer.innerHTML = ''; // Clear date inputs
    });

    // Delete date range
    window.deleteDateRange = function (index) {
        const dateRange = document.querySelector(`.date-range[data-index="${index}"]`);
        dateRange.remove();
    };

    // Delete single date
    window.deleteSingleDate = function (index) {
        const singleDate = document.querySelector(`.single-date[data-index="${index}"]`);
        singleDate.remove();
    };
});
