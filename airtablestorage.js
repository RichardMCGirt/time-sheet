document.addEventListener("DOMContentLoaded", function() {
    const saveButton = document.getElementById('save-button');

    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const newTableId = 'tbl8znXria2leJfUd'; // Replace with your new table ID

    let userEmail = localStorage.getItem('userEmail') || '';

    saveButton.addEventListener('click', handleSave);

    async function handleSave(event) {
        event.preventDefault();
        console.log('Save button clicked. Gathering form data...');
        const formData = gatherFormData();
        console.log('Form data gathered:', formData);
        try {
            await sendDataToAirtable(formData);
            alert('Data saved successfully!');
        } catch (error) {
            alert(`Failed to save data: ${error.message}`);
            console.error('Error in handleSave:', error);
        }
    }

    function gatherFormData() {
        const formData = {};
        for (let i = 1; i <= 7; i++) {
            formData[`start${i}`] = document.querySelector(`input[name="start_time${i}"]`).value || '';
            formData[`lunchs${i}`] = document.querySelector(`input[name="lunch_start${i}"]`).value || '';
            formData[`lunche${i}`] = document.querySelector(`input[name="lunch_end${i}"]`).value || '';
            formData[`end${i}`] = document.querySelector(`input[name="end_time${i}"]`).value || '';
            formData[`additionali${i}`] = document.querySelector(`input[name="Additional_Time_In${i}"]`).value || '';
            formData[`additionalo${i}`] = document.querySelector(`input[name="Additional_Time_Out${i}"]`).value || '';
        }
        return formData;
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
                document.querySelector(`input[name="start_time${i}"]`).value = record[`start${i}`] || '';
                document.querySelector(`input[name="lunch_start${i}"]`).value = record[`lunchs${i}`] || '';
                document.querySelector(`input[name="lunch_end${i}"]`).value = record[`lunche${i}`] || '';
                document.querySelector(`input[name="end_time${i}"]`).value = record[`end${i}`] || '';
                document.querySelector(`input[name="Additional_Time_In${i}"]`).value = record[`additionali${i}`] || '';
                document.querySelector(`input[name="Additional_Time_Out${i}"]`).value = record[`additionalo${i}`] || '';
            }
        } catch (error) {
            console.error('Error populating form data:', error);
        }
    }

    populateFormData();
});
