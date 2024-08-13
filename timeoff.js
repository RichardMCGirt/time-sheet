
document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'patdCNFzzxpHXs14G.892585ccb188d17d06078c040fedb939583a082a9f7c84ca3063eae2024a998b';
    const baseId = 'appzys5CNiZIV1ihx';
    const tableId = 'tblKBCKzmHgoPClac'; 

    const userEmail = localStorage.getItem('userEmail');
    let records = [];
    let currentEditingIndex = null;

    const form = document.getElementById('timeOffForm');
    const requestsList = document.getElementById('requestsList');
    const previousRequestsContainer = document.getElementById('previousRequests');
    const submissionStatus = document.getElementById('submissionStatus');
    const submittedData = document.getElementById('submittedData');
    const submittedEmployeeName = document.getElementById('submittedEmployeeName');
    const submittedStartDate = document.getElementById('submittedStartDate');
    const submittedStartTime = document.getElementById('submittedStartTime');
    const submittedEndDate = document.getElementById('submittedEndDate');
    const submittedEndTime = document.getElementById('submittedEndTime');
    const daysOffMessage = document.getElementById('daysOffMessage');
    const submitButton = document.getElementById('submitButton');
    const logoutButton = document.getElementById('logout-button');

    if (!userEmail) {
        window.location.href = 'index.html';
        return;
    }

    fetchEmployeeName(userEmail);

    function fillEmailFromLocalStorage() {
        const email = localStorage.getItem('userEmail');
        if (email) {
            document.getElementById('user-email').textContent = email;
        }
    }

    fillEmailFromLocalStorage();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleFormSubmit();
    });

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
            let url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            let allRecords = [];
            while (url) {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`
                    }
                });
                const data = await response.json();
                allRecords = allRecords.concat(data.records);
                url = data.offset ? `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}&offset=${data.offset}` : null;
            }
            records = allRecords || [];
            await deleteExpiredRecords(records);
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
                const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fields: formData })
                });

                if (response.ok) {
                    const data = await response.json();
                    showSuccessMessage('Submission successful!');
                    displaySubmittedData(formData);
                    fetchPreviousRequests(localStorage.getItem('userEmail'));
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    const errorData = await response.json();
                    throw new Error(`Failed to update record: ${JSON.stringify(errorData)}`);
                }
            } else {
                const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fields: formData })
                });

                if (response.ok) {
                    const data = await response.json();
                    showSuccessMessage('Submission successful!');
                    displaySubmittedData(formData);
                    fetchPreviousRequests(localStorage.getItem('userEmail'));
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    const errorData = await response.json();
                    throw new Error(`Failed to save record: ${JSON.stringify(errorData)}`);
                }
            }
        } catch (error) {
            console.error('Error saving to Airtable:', error);
            showError('Submission failed. Please try again.');
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
        const startDate = document.getElementById('startDate').value;
        let startTime = document.getElementById('startTime').value;
        const endDate = document.getElementById('endDate').value;
        let endTime = document.getElementById('endTime').value;
    
        if (!startDate || !endDate) {
            showError('Start Date and End Date are required.');
            return;
        }
    
        const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
        const endDateTime = new Date(`${endDate}T${endTime || '23:59'}`);
    
        if (startDateTime > endDateTime) {
            showError('Start Date cannot be later than End Date.');
            return;
        }
    
        const now = new Date();
        if (now >= startDateTime && now <= endDateTime) {
            showSuccessMessage('The requested time-off is happening now.');
        }
    
        if (startTime === 'All Day') {
            startTime = '07:00 AM';
        } else {
            startTime = convertToAMPM(startTime);
        }
        if (endTime === 'All Day') {
            endTime = '04:00 PM';
        } else {
            endTime = convertToAMPM(endTime);
        }
    
        const nextIndex = currentEditingIndex !== null ? currentEditingIndex : getNextAvailableIndex();
        if (nextIndex > 10) {
            showError('No available index to store the new time-off request.');
            return;
        }
    
        const formData = {
            [`Time off Start Date ${nextIndex}`]: startDate,
            [`Time off Start Time ${nextIndex}`]: startTime,
            [`Time off End Date ${nextIndex}`]: endDate,
            [`Time off End Time ${nextIndex}`]: endTime,
        };
    
        sendToAirtable(formData);
    
        document.getElementById('startDate').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('endTime').value = '';
    
        currentEditingIndex = null;
        submitButton.textContent = 'Submit';
    
        fetchPreviousRequests(userEmail);
    }
    
    function convertToAMPM(time) {
        const [hourString, minute] = time.split(':');
        let hour = parseInt(hourString, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${period}`;
    }

    function displayPreviousRequests(records) {
        requestsList.innerHTML = '';
    
        if (records.length > 0) {
            previousRequestsContainer.classList.remove('hidden');
        } else {
            previousRequestsContainer.classList.add('hidden');
        }
    
        records.forEach(record => {
            for (let i = 1; i <= 10; i++) {
                if (record.fields[`Time off Start Date ${i}`]) {
                    const recordItem = document.createElement('li');
                    recordItem.className = 'record';
    
                    const approved = record.fields[`Time off Approved ${i}`];
                    const approvedCheckbox = approved ? '<input type="checkbox" class="approved-checkbox" checked disabled>' : '';
                    const approvedText = approved ? '<p><strong>Approved:</strong>' : '';
                    const daysOff = calculateBusinessDays(record.fields[`Time off Start Date ${i}`], record.fields[`Time off End Date ${i}`]);
                    const reason = record.fields[`Reason ${i}`] || 'N/A';
                    const reasonClass = reason !== 'N/A' ? 'reason-red' : '';
    
                    recordItem.innerHTML = `
                        <p><strong>Start Date:</strong> ${record.fields[`Time off Start Date ${i}`]}</p>
                        <p><strong>Start Time:</strong> ${record.fields[`Time off Start Time ${i}`]}</p>
                        <p><strong>End Date:</strong> ${record.fields[`Time off End Date ${i}`]}</p>
                        <p><strong>End Time:</strong> ${record.fields[`Time off End Time ${i}`]}</p>
                        <p><strong>Days Off:</strong> ${daysOff} days</p>
                        <p class="reason ${reasonClass}" style="display: ${approved ? 'none' : 'block'};"><strong>Reason:</strong> ${reason}</p>
                        ${approvedText}${approvedCheckbox}</p>
                        <button class="edit-button" data-index="${i}" data-id="${record.id}">Edit</button>
                        <button class="delete-button" data-index="${i}" data-id="${record.id}">Delete</button>`;
    
                    requestsList.appendChild(recordItem);
                }
            }
        });
    
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEditClick);
        });
    
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDeleteClick);
        });
    }
    
    function handleEditClick(event) {
        const index = event.target.dataset.index;
        const id = event.target.dataset.id;
        const record = records.find(record => record.id === id);
        if (record) {
            currentEditingIndex = index;
            document.getElementById('startDate').value = record.fields[`Time off Start Date ${index}`] || '';
            document.getElementById('startTime').value = convertTo24HourFormat(record.fields[`Time off Start Time ${index}`]) || '';
            document.getElementById('endDate').value = record.fields[`Time off End Date ${index}`] || '';
            document.getElementById('endTime').value = convertTo24HourFormat(record.fields[`Time off End Time ${index}`]) || '';

            document.getElementById('startDate').focus();
            submitButton.textContent = 'Submit Edit';
        }
    }

    async function handleDeleteClick(event) {
        const index = event.target.dataset.index;
        const id = event.target.dataset.id;
        const record = records.find(record => record.id === id);
        if (record) {
            const confirmDelete = confirm('Are you sure you want to delete this request?');
            if (confirmDelete) {
                try {
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
                        body: JSON.stringify({ fields: fieldsToDelete })
                    });

                    if (response.ok) {
                        fetchPreviousRequests(localStorage.getItem('userEmail'));
                    } else {
                        const errorData = await response.json();
                        throw new Error(`Failed to delete fields: ${JSON.stringify(errorData)}`);
                    }
                } catch (error) {
                    console.error('Error deleting fields from Airtable:', error);
                }
            }
        }
    }

    function convertTo24HourFormat(time) {
        const [timePart, period] = time.split(' ');
        let [hours, minutes] = timePart.split(':');
        hours = parseInt(hours, 10);
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    function displaySubmittedData(formData) {
        const index = currentEditingIndex !== null ? currentEditingIndex : getNextAvailableIndex() - 1;

        if (submittedStartDate) submittedStartDate.textContent = formData[`Time off Start Date ${index}`];
        if (submittedStartTime) submittedStartTime.textContent = formData[`Time off Start Time ${index}`];
        if (submittedEndDate) submittedEndDate.textContent = formData[`Time off End Date ${index}`];
        if (submittedEndTime) submittedEndTime.textContent = formData[`Time off End Time ${index}`];

        const daysOff = calculateBusinessDays(formData[`Time off Start Date ${index}`], formData[`Time off End Date ${index}`]);
        if (daysOffMessage) daysOffMessage.textContent = `Total days off (excluding weekends): ${daysOff}`;

        if (submittedData) submittedData.classList.remove('hidden');
    }

    function handleLogout(event) {
        event.preventDefault();
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
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return count;
    }

    async function deleteExpiredRecords(records) {
        const now = new Date();
        const expiredRecords = records.filter(record => {
            return Object.keys(record.fields).some(field => {
                if (field.startsWith('Time off End Date ') && record.fields[field]) {
                    const endDate = new Date(record.fields[field]);
                    const endTimeField = field.replace('Date', 'Time');
                    const endTime = record.fields[endTimeField];
                    if (endTime) {
                        const [hours, minutes] = endTime.split(':');
                        endDate.setHours(hours, minutes);
                    }
                    return endDate < now;
                }
                return false;
            });
        });

        for (const record of expiredRecords) {
            for (let i = 1; i <= 10; i++) {
                if (record.fields[`Time off End Date ${i}`]) {
                    try {
                        const fieldsToDelete = {
                            [`Time off Start Date ${i}`]: null,
                            [`Time off Start Time ${i}`]: null,
                            [`Time off End Date ${i}`]: null,
                            [`Time off End Time ${i}`]: null,
                            [`Reason ${i}`]: null,
                            [`Time off Approved ${i}`]: null
                        };

                        const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${record.id}`;
                        const response = await fetch(url, {
                            method: 'PATCH',
                            headers: {
                                Authorization: `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ fields: fieldsToDelete })
                        });

                        if (response.ok) {
                            console.log('Expired fields deleted successfully');
                        } else {
                            const errorData = await response.json();
                            throw new Error(`Failed to delete expired fields: ${JSON.stringify(errorData)}`);
                        }
                    } catch (error) {
                        console.error('Error deleting expired fields from Airtable:', error);
                    }
                }
            }
        }
    }

    setInterval(() => {
        fetchPreviousRequests(userEmail).then(() => {
            deleteExpiredRecords(records);
        });
    }, 24 * 60 * 60 * 1000);

    fetchPreviousRequests(userEmail).then(() => {
        deleteExpiredRecords(records);
    });

    function convertTimeToTextInput(inputId) {
        const input = document.getElementById(inputId);
        let isTextInput = false;
        input.addEventListener('dblclick', () => {
            if (!isTextInput) {
                input.type = 'text';
                input.value = 'All Day';
                isTextInput = true;
            } else {
                input.type = 'time';
                input.value = '';
                isTextInput = false;
            }
        });
        input.addEventListener('click', () => {
            if (input.type === 'time') {
                input.showPicker();
            }
        });
    }

    convertTimeToTextInput('startTime');
    convertTimeToTextInput('endTime');

    function showDatePicker(inputId) {
        const input = document.getElementById(inputId);
        input.addEventListener('click', () => {
            input.showPicker();
        });
    }

    showDatePicker('startDate');
    showDatePicker('endDate');

    function showSuccessMessage(message) {
        submissionStatus.textContent = message;
        submissionStatus.classList.remove('hidden');
        submissionStatus.classList.add('success');
    }

    function showError(message) {
        submissionStatus.textContent = message;
        submissionStatus.classList.remove('hidden');
        submissionStatus.classList.add('error');
    }

    // Validation logic for PTO, personal, and holiday hours

    function validateHours() {
        const ptoInput = document.getElementById('pto-input');
        const personalHoursInput = document.getElementById('personal-hours-input');
        const holidayHoursInput = document.getElementById('holiday-hours-input'); // Assuming there's an input for holiday hours
    
        const availablePTOElement = document.getElementById('available-pto');
        const availablePersonalHoursElement = document.getElementById('available-personal-hours');
    
        const availablePTO = availablePTOElement ? parseFloat(availablePTOElement.textContent) : 0;
        const availablePersonalHours = availablePersonalHoursElement ? parseFloat(availablePersonalHoursElement.textContent) : 0;
    
        if (ptoInput) {
            ptoInput.addEventListener('input', function() {
                if (parseFloat(ptoInput.value) > availablePTO) {
                    ptoInput.setCustomValidity('You cannot request more PTO than available.');
                } else {
                    ptoInput.setCustomValidity('');
                }
            });
        }
    
        if (personalHoursInput) {
            personalHoursInput.addEventListener('input', function() {
                if (parseFloat(personalHoursInput.value) > availablePersonalHours) {
                    personalHoursInput.setCustomValidity('You cannot request more personal hours than available.');
                } else {
                    personalHoursInput.setCustomValidity('');
                }
            });
        }
    
        if (holidayHoursInput) {
            holidayHoursInput.addEventListener('input', function() {
                if (parseFloat(holidayHoursInput.value) > 40) {
                    holidayHoursInput.setCustomValidity('Holiday hours cannot be greater than 40.');
                } else {
                    holidayHoursInput.setCustomValidity('');
                }
            });
        }
    }
    
    validateHours();
});
