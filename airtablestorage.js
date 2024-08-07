document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const newTableId = 'tbl8znXria2leJfUd'; // Replace with your new table ID

    let userEmail = localStorage.getItem('userEmail') || '';

    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('blur', handleSave);
    });

    document.getElementById('reset-button').addEventListener('click', handleReset);

    async function handleSave(event) {
        event.preventDefault();
        console.log('Input field lost focus. Gathering form data...');
        const formData = gatherFormData();
        console.log('Form data gathered:', formData);
        try {
            await sendDataToAirtable(formData);
            showMessage('Data saved successfully!');
        } catch (error) {
            showMessage('Failed to save data. Please try again.');
            console.error('Error saving data:', error);
        }
    }

    function showMessage(message) {
        const messageContainer = document.getElementById('message-container');
        messageContainer.textContent = message;
        setTimeout(() => {
            messageContainer.textContent = '';
        }, 3500); // Clear the message after 3.5 seconds
    }

    function gatherFormData() {
        const formData = {};
        for (let i = 1; i <= 7; i++) {
            formData[`start${i}`] = getValue(`input[name="start_time${i}"]`);
            formData[`lunchs${i}`] = getValue(`input[name="lunch_start${i}"]`);
            formData[`lunche${i}`] = getValue(`input[name="lunch_end${i}"]`);
            formData[`end${i}`] = getValue(`input[name="end_time${i}"]`);
            formData[`additionali${i}`] = getValue(`input[name="Additional_Time_In${i}"]`);
            formData[`additionalo${i}`] = getValue(`input[name="Additional_Time_Out${i}"]`);
            formData[`PTO Hours ${i}`] = parseFloat(getValue(`input[name="pto_hours${i}"]`)) || 0;
            formData[`Personal Hours ${i}`] = parseFloat(getValue(`input[name="personal_hours${i}"]`)) || 0;
            formData[`Holiday Hours ${i}`] = parseFloat(getValue(`input[name="holiday_hours${i}"]`)) || 0;
            formData[`Did not work ${i}`] = getCheckboxValue(`input[name="did_not_work${i}"]`);

            console.log(`Data for day ${i}:`, {
                start: formData[`start${i}`],
                lunchs: formData[`lunchs${i}`],
                lunche: formData[`lunche${i}`],
                end: formData[`end${i}`],
                additionali: formData[`additionali${i}`],
                additionalo: formData[`additionalo${i}`],
                ptoHours: formData[`PTO Hours ${i}`],
                personalHours: formData[`Personal Hours ${i}`],
                holidayHours: formData[`Holiday Hours ${i}`],
                didNotWork: formData[`Did not work ${i}`]
            });
        }
        return formData;
    }

    function getValue(selector) {
        const element = document.querySelector(selector);
        return element ? element.value : '';
    }

    function getCheckboxValue(selector) {
        const element = document.querySelector(selector);
        return element ? element.checked : false;
    }

    async function sendDataToAirtable(data) {
        console.log('Sending data to Airtable...', data);
        const endpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}`;
        const searchEndpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}?filterByFormula=AND({Email}="${userEmail}")`;

        try {
            const searchResponse = await fetch(searchEndpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const searchData = await searchResponse.json();
            console.log('Search data:', searchData);

            if (!searchData.records || searchData.records.length === 0) {
                throw new Error('No matching record found to update.');
            }

            const recordId = searchData.records[0].id;
            console.log('Existing record found with ID:', recordId);

            const record = {
                fields: {
                    ...data,
                    "email": userEmail
                }
            };

            console.log('Payload being sent to Airtable:', JSON.stringify(record));

            const response = await fetch(`${endpoint}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record)
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('Error response from Airtable:', errorResponse);
                throw new Error(`Failed to save data: ${response.statusText}`);
            } else {
                const responseData = await response.json();
                console.log('Data successfully sent to Airtable:', responseData);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }

    async function clearAirtableData() {
        console.log('Clearing data in Airtable...');
        const searchEndpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}?filterByFormula=AND({Email}="${userEmail}")`;

        try {
            const searchResponse = await fetch(searchEndpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const searchData = await searchResponse.json();
            console.log('Search data:', searchData);

            if (!searchData.records || searchData.records.length === 0) {
                console.log('No matching record found to clear.');
                return;
            }

            const recordId = searchData.records[0].id;
            console.log('Existing record found with ID:', recordId);

            const record = {
                fields: {}
            };

            for (let i = 1; i <= 7; i++) {
                record.fields[`start${i}`] = '';
                record.fields[`lunchs${i}`] = '';
                record.fields[`lunche${i}`] = '';
                record.fields[`end${i}`] = '';
                record.fields[`additionali${i}`] = '';
                record.fields[`additionalo${i}`] = '';
                record.fields[`PTO Hours ${i}`] = 0;
                record.fields[`Personal Hours ${i}`] = 0;
                record.fields[`Holiday Hours ${i}`] = 0;
                record.fields[`Did not work ${i}`] = false;
            }

            console.log('Payload being sent to Airtable to clear data:', JSON.stringify(record));

            const response = await fetch(`${endpoint}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record)
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('Error response from Airtable:', errorResponse);
                throw new Error(`Failed to clear data: ${response.statusText}`);
            } else {
                const responseData = await response.json();
                console.log('Data successfully cleared in Airtable:', responseData);
            }
        } catch (error) {
            console.error('Error clearing data in Airtable:', error);
            throw error;
        }
    }

    async function populateFormData() {
        console.log('Populating form data...');
        const searchEndpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}?filterByFormula=AND({Email}="${userEmail}")`;

        try {
            const searchResponse = await fetch(searchEndpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const searchData = await searchResponse.json();
            console.log('Search data:', searchData);

            if (!searchData.records || searchData.records.length === 0) {
                console.log('No matching record found to populate.');
                return;
            }

            const record = searchData.records[0].fields;
            console.log('Existing record found:', record);

            for (let i = 1; i <= 7; i++) {
                setValue(`input[name="start_time${i}"]`, record[`start${i}`]);
                setValue(`input[name="lunch_start${i}"]`, record[`lunchs${i}`]);
                setValue(`input[name="lunch_end${i}"]`, record[`lunche${i}`]);
                setValue(`input[name="end_time${i}"]`, record[`end${i}`]);
                setValue(`input[name="Additional_Time_In${i}"]`, record[`additionali${i}`]);
                setValue(`input[name="Additional_Time_Out${i}"]`, record[`additionalo${i}`]);
                setValue(`input[name="pto_hours${i}"]`, record[`PTO Hours${i}`]);
                setValue(`input[name="personal_hours${i}"]`, record[`Personal Hours${i}`]);
                setValue(`input[name="holiday_hours${i}"]`, record[`Holiday Hours${i}`]);
                setCheckboxValue(`input[name="did_not_work${i}"]`, record[`Did not work${i}`]);
            }
        } catch (error) {
            console.error('Error populating form data:', error);
        }
    }

    function setValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value || '';
        }
    }

    function setCheckboxValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.checked = value || false;
        }
    }

    async function handleReset() {
        console.log('Reset button clicked. Clearing form data...');
        for (let i = 1; i <= 7; i++) {
            setValue(`input[name="start_time${i}"]`, '');
            setValue(`input[name="lunch_start${i}"]`, '');
            setValue(`input[name="lunch_end${i}"]`, '');
            setValue(`input[name="end_time${i}"]`, '');
            setValue(`input[name="Additional_Time_In${i}"]`, '');
            setValue(`input[name="Additional_Time_Out${i}"]`, '');
            setValue(`input[name="pto_hours${i}"]`, '');
            setValue(`input[name="personal_hours${i}"]`, '');
            setValue(`input[name="holiday_hours${i}"]`, '');
            setCheckboxValue(`input[name="did_not_work${i}"]`, false);
        }
        showMessage('Form reset successfully!');
        try {
            await clearAirtableData();
            showMessage('Airtable data cleared successfully!');
        } catch (error) {
            showMessage('Failed to clear Airtable data. Please try again.');
            console.error('Error clearing Airtable data:', error);
        }
    }

    populateFormData();
});
