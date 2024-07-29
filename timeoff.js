
        document.addEventListener('DOMContentLoaded', () => {
            const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
            const baseId = 'app9gw2qxhGCmtJvW';
            const tableId = 'tbl3PB88KkGdPlT5x';

            const userEmail = localStorage.getItem('userEmail');
            let records = [];
            let currentEditingIndex = null;

            const form = document.getElementById('timeOffForm');
            const requestsList = document.getElementById('requestsList');
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
                    const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
                    const response = await fetch(url, {
                        headers: {
                            Authorization: `Bearer ${apiKey}`
                        }
                    });
                    const data = await response.json();
                    records = data.records || [];
                    deleteExpiredRecords(records);
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
                            submissionStatus.textContent = 'Submission successful!';
                            submissionStatus.classList.remove('hidden');
                            submissionStatus.classList.add('success');
                            displaySubmittedData(formData);
                            fetchPreviousRequests(localStorage.getItem('userEmail'));
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
                            submissionStatus.textContent = 'Submission successful!';
                            submissionStatus.classList.remove('hidden');
                            submissionStatus.classList.add('success');
                            displaySubmittedData(formData);
                            fetchPreviousRequests(localStorage.getItem('userEmail'));
                        } else {
                            const errorData = await response.json();
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

            function displayPreviousRequests(records) {
                requestsList.innerHTML = '';

                records.forEach(record => {
                    for (let i = 1; i <= 10; i++) {
                        if (record.fields[`Time off Start Date ${i}`]) {
                            const recordItem = document.createElement('li');
                            recordItem.className = 'record';

                            const approvedCheckbox = record.fields[`Time off Approved ${i}`] ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>';
                            const daysOff = calculateBusinessDays(record.fields[`Time off Start Date ${i}`], record.fields[`Time off End Date ${i}`]);

                            recordItem.innerHTML = 
                                `<p><strong>Employee Name:</strong> ${record.fields['Full Name']}</p>
                                <p><strong>Start Date:</strong> ${record.fields[`Time off Start Date ${i}`]}</p>
                                <p><strong>Start Time:</strong> ${record.fields[`Time off Start Time ${i}`]}</p>
                                <p><strong>End Date:</strong> ${record.fields[`Time off End Date ${i}`]}</p>
                                <p><strong>End Time:</strong> ${record.fields[`Time off End Time ${i}`]}</p>
                                <p><strong>Days Off (excluding weekends):</strong> ${daysOff}</p>
                                <p><strong>Approved:</strong> ${approvedCheckbox}</p>
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
                    document.getElementById('startTime').value = record.fields[`Time off Start Time ${index}`] || '';
                    document.getElementById('endDate').value = record.fields[`Time off End Date ${index}`] || '';
                    document.getElementById('endTime').value = record.fields[`Time off End Time ${index}`] || '';

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

            function displaySubmittedData(formData) {
                const index = currentEditingIndex !== null ? currentEditingIndex : getNextAvailableIndex() - 1;
                submittedEmployeeName.textContent = formData['Full Name'];
                submittedStartDate.textContent = formData[`Time off Start Date ${index}`];
                submittedStartTime.textContent = formData[`Time off Start Time ${index}`];
                submittedEndDate.textContent = formData[`Time off End Date ${index}`];
                submittedEndTime.textContent = formData[`Time off End Time ${index}`];

                const daysOff = calculateBusinessDays(formData[`Time off Start Date ${index}`], formData[`Time off End Date ${index}`]);
                daysOffMessage.textContent = `Total days off (excluding weekends): ${daysOff}`;

                submittedData.classList.remove('hidden');
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

            function deleteExpiredRecords(records) {
                const now = new Date();
                records.forEach(async (record) => {
                    for (let i = 1; i <= 10; i++) {
                        const endDate = record.fields[`Time off End Date ${i}`];
                        const endTime = record.fields[`Time off End Time ${i}`];
                        if (endDate && endTime) {
                            const endDateTime = new Date(`${endDate}T${endTime}`);
                            if (now > endDateTime) {
                                try {
                                    const fieldsToDelete = {
                                        [`Time off Start Date ${i}`]: null,
                                        [`Time off Start Time ${i}`]: null,
                                        [`Time off End Date ${i}`]: null,
                                        [`Time off End Time ${i}`]: null,
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
                });
            }

            setInterval(() => {
                fetchPreviousRequests(userEmail).then(() => {
                    deleteExpiredRecords(records);
                });
            }, 24 * 60 * 60 * 1000);

            fetchPreviousRequests(userEmail).then(() => {
                deleteExpiredRecords(records);
            });
        });
