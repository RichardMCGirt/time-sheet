const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
const baseId = 'appMq9W12jZyCJeXe';
const tableId = 'tblhTl5q7sEFDv66Z';

async function getRecordIdByEmail(email) {
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={Email}='${email}'`;
    console.log('Fetching record ID for email:', email);
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch record: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.records.length > 0) {
            const recordId = data.records[0].id;
            console.log('Record ID:', recordId);
            return recordId;
        } else {
            throw new Error('No record found for the provided email.');
        }
    } catch (error) {
        console.error('Error fetching record ID:', error);
        throw error;
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    console.log('DOM fully loaded and parsed');

    let userEmail = localStorage.getItem('userEmail') || '';
    console.log('User email:', userEmail);

    // DOM elements
    const ptoHoursElement = document.getElementById('pto-hours');
    const personalHoursInput = document.getElementById('personal-time');
    const holidayHoursInput = document.getElementById('Holiday-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const timeEntryForm = document.getElementById('time-entry-form');
    const ptoTimeInput = document.getElementById('pto-time');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const totalTimeWithPtoSpan = document.getElementById('total-time-with-pto-value');
    const ptoValidationMessage = document.getElementById('pto-validation-message');
    const remainingPtoHoursElement = document.getElementById('remaining-pto-hours');
    const remainingPersonalHoursElement = document.getElementById('remaining-personal-hours');
    const logoutButton = document.getElementById('logout-button');
    const userEmailElement = document.getElementById('user-email');
    const ptoHoursDisplay = document.getElementById('pto-hours-display');
    const personalTimeDisplay = document.getElementById('personal-time-display');
    const resetButton = document.getElementById('reset-button');

    let availablePTOHours = 0;
    let availablePersonalHours = 0;
    let debounceTimer;

    // Set initial value to empty string
    ptoHoursDisplay.textContent = 'Loading...';
    personalTimeDisplay.textContent = 'Loading...';

    // Display user email next to logout button
    if (userEmail) {
        userEmailElement.textContent = userEmail;
        console.log('User email set in the UI');
    } else {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
    }

    // Add event listeners to update personal time display and PTO hours display
    ptoTimeInput.addEventListener('input', handlePtoTimeChange);
    personalHoursInput.addEventListener('input', handlePersonalTimeChange);
    holidayHoursInput.addEventListener('input', handleHolidayHoursChange);

    // Fetch and display PTO hours and Personal hours
    await fetchPtoHours();
    await fetchPersonalTime();

    // Add event listener to show calendar when week-ending input is clicked
    weekEndingInput.addEventListener('focus', () => weekEndingInput.showPicker());

    // Add event listeners to show clock when time input fields are clicked
    const timeInputs = document.querySelectorAll('input[type="time"]');
    timeInputs.forEach(input => {
        input.addEventListener('focus', () => input.showPicker());
    });

    // Adjust week-ending input width
    weekEndingInput.style.width = '120px';

    // Event listeners
    weekEndingInput.addEventListener('change', handleWeekEndingChange);
    timeEntryForm.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculateTotalTimeWorked, 300);
    });
    logoutButton.addEventListener('click', handleLogout);
    resetButton.addEventListener('click', resetForm);

    async function fetchPtoHours() {
        console.log('Fetching PTO hours...');
        
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        console.log('Endpoint:', endpoint);

        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Fetched data:', data);

            if (data.records.length > 0) {
                const userRecord = data.records[0].fields;

                const ptoHours = parseFloat(userRecord['PTO Hours']) || 0;
                availablePTOHours = ptoHours;

                ptoHoursElement.textContent = ptoHours.toFixed(2);
                remainingPtoHoursElement.textContent = ptoHours.toFixed(2);
                ptoHoursDisplay.textContent = `Available PTO Hours: ${ptoHours.toFixed(2)}`;
                console.log('PTO hours:', ptoHours);
            } else {
                throw new Error('No PTO record found for user');
            }
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            ptoHoursElement.textContent = 'Error fetching PTO';
            remainingPtoHoursElement.textContent = 'Error';
            ptoHoursDisplay.textContent = 'Error';
        }
    }

    async function fetchPersonalTime() {
        console.log('Fetching Personal hours...');
    
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        console.log('Endpoint:', endpoint);
    
        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
    
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log('Fetched data:', data);
    
            if (data.records.length > 0) {
                const userRecord = data.records[0].fields;
    
                const personalHours = parseFloat(userRecord['Personaltime']) || 0;
                availablePersonalHours = personalHours;
    
                personalTimeDisplay.textContent = `Personal Time: ${personalHours.toFixed(2)}`;
                remainingPersonalHoursElement.textContent = personalHours.toFixed(2);
                console.log('Personal hours:', personalHours);
            } else {
                throw new Error('No personal time record found for user');
            }
        } catch (error) {
            console.error('Error fetching personal hours:', error);
            personalHoursInput.value = 'Error fetching personal hours';
            personalTimeDisplay.textContent = 'Error fetching personal time';
            remainingPersonalHoursElement.textContent = 'Error';
        }
    }

    function handlePtoTimeChange() {
        console.log('Handling PTO time change...');
        
        const ptoTimeUsed = parseFloat(ptoTimeInput.value) || 0;
        const remainingPtoHours = Math.max(0, availablePTOHours - ptoTimeUsed);
        console.log('PTO time used:', ptoTimeUsed);
        console.log('Remaining PTO hours:', remainingPtoHours);

        if (ptoTimeUsed > availablePTOHours) {
            ptoValidationMessage.textContent = 'PTO time used cannot exceed available PTO hours';
            ptoValidationMessage.style.color = 'red';
        } else {
            ptoValidationMessage.textContent = '';
        }

        remainingPtoHoursElement.textContent = remainingPtoHours.toFixed(2);
        updatePtoHoursDisplay(remainingPtoHours);
        calculateTotalTimeWorked();
    }

    function handlePersonalTimeChange() {
        console.log('Handling Personal time change...');
        
        const personalTimeUsed = parseFloat(personalHoursInput.value) || 0;
        const remainingPersonalHours = Math.max(0, availablePersonalHours - personalTimeUsed);
        console.log('Personal time used:', personalTimeUsed);
        console.log('Remaining Personal hours:', remainingPersonalHours);

        if (personalTimeUsed > availablePersonalHours) {
            ptoValidationMessage.textContent = 'Personal time used cannot exceed available Personal hours';
            ptoValidationMessage.style.color = 'red';
        } else {
            ptoValidationMessage.textContent = '';
        }

        remainingPersonalHoursElement.textContent = remainingPersonalHours.toFixed(2);
        updatePersonalHoursDisplay(remainingPersonalHours);
        updatePersonalTimeDisplay(personalTimeUsed, remainingPersonalHours);
        calculateTotalTimeWorked();
    }

    function handleHolidayHoursChange() {
        console.log('Handling Holiday hours change...');
        calculateTotalTimeWorked();
    }

    function updatePtoHoursDisplay(remainingPtoHours) {
        ptoHoursDisplay.textContent = `Remaining PTO Hours: ${remainingPtoHours.toFixed(2)}`;
    }

    function updatePersonalHoursDisplay(remainingPersonalHours) {
        personalTimeDisplay.textContent = `Remaining Personal Hours: ${remainingPersonalHours.toFixed(2)}`;
    }

    function updatePersonalTimeDisplay(personalTimeUsed, remainingPersonalHours) {
        personalTimeDisplay.textContent = `Personal Time Used: ${personalTimeUsed.toFixed(2)}, Remaining: ${remainingPersonalHours.toFixed(2)}`;
    }

    function handleWeekEndingChange() {
        console.log('Handling Week ending change...');
        console.log('Week ending date:', weekEndingInput.value);
    }

    function calculateTotalTimeWorked() {
        console.log('Calculating total time worked...');

        const startTimes = document.querySelectorAll('input[name^="start-time-"]');
        const endTimes = document.querySelectorAll('input[name^="end-time-"]');
        const personalTimeUsed = parseFloat(personalHoursInput.value) || 0;
        const holidayTimeUsed = parseFloat(holidayHoursInput.value) || 0;

        let totalMinutes = 0;
        startTimes.forEach((startTimeInput, index) => {
            const endTimeInput = endTimes[index];
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;

            if (startTime && endTime) {
                const startDateTime = new Date(`1970-01-01T${startTime}Z`);
                const endDateTime = new Date(`1970-01-01T${endTime}Z`);
                const differenceInMinutes = (endDateTime - startDateTime) / 1000 / 60;

                totalMinutes += differenceInMinutes;
            }
        });

        const totalTimeWorkedHours = totalMinutes / 60;

        // Add PTO, personal, and holiday time to total hours worked
        const ptoTimeUsed = parseFloat(ptoTimeInput.value) || 0;
        const totalTimeWithPto = totalTimeWorkedHours + ptoTimeUsed + personalTimeUsed + holidayTimeUsed;

        totalTimeWorkedSpan.textContent = totalTimeWorkedHours.toFixed(2);
        totalTimeWithPtoSpan.textContent = totalTimeWithPto.toFixed(2);
    }

    async function updatePtoHours(newPtoHours) {
        console.log('Updating PTO hours...', newPtoHours);
        
        const recordId = await getRecordIdByEmail(userEmail);
        console.log('Record ID for updating PTO hours:', recordId);

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        console.log('Endpoint for updating PTO hours:', endpoint);

        const updateData = {
            fields: {
                'PTO Hours': newPtoHours
            }
        };

        try {
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update PTO hours: ${response.statusText}`);
            }

            console.log('PTO hours updated successfully');
            await fetchPtoHours();
        } catch (error) {
            console.error('Error updating PTO hours:', error);
        }
    }

    function resetForm() {
        console.log('Resetting form...');
        timeEntryForm.reset();
        remainingPtoHoursElement.textContent = availablePTOHours.toFixed(2);
        remainingPersonalHoursElement.textContent = availablePersonalHours.toFixed(2);
        totalTimeWorkedSpan.textContent = '0.00';
        totalTimeWithPtoSpan.textContent = '0.00';
        ptoValidationMessage.textContent = '';
        personalTimeDisplay.textContent = `Personal Time: ${availablePersonalHours.toFixed(2)}`;
        ptoHoursDisplay.textContent = `Available PTO Hours: ${availablePTOHours.toFixed(2)}`;
    }

    function handleLogout() {
        console.log('Logging out...');
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    }

    timeEntryForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log('Submitting form...');
        
        const newPtoHours = parseFloat(remainingPtoHoursElement.textContent);
        await updatePtoHours(newPtoHours);
    });
});
