const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'app9gw2qxhGCmtJvW';
const tableId = 'tbljmLpqXScwhiWTt';
let recordId = '';
let userEmail = localStorage.getItem('userEmail') || '';
let availablePTOHours = 0;
let availablePersonalHours = 0;

async function fetchPtoHours() {
    console.log('Fetching PTO hours...');
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch PTO hours: ${response.statusText}`);

        const data = await response.json();
        console.log('Fetched PTO hours:', data);

        if (data.records.length > 0) {
            const record = data.records[0].fields;
            availablePTOHours = record['PTO Hours'] || 0;
            recordId = data.records[0].id; // Save the record ID
            return availablePTOHours;
        } else {
            console.log('No PTO hours data found for user');
            return 0;
        }
    } catch (error) {
        console.error('Error fetching PTO hours:', error);
        alert('Failed to fetch PTO hours. Error: ' + error.message);
        return 0;
    }
}

async function fetchPersonalTime() {
    console.log('Fetching Personal hours...');
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch Personal hours: ${response.statusText}`);

        const data = await response.json();
        console.log('Fetched Personal hours:', data);

        if (data.records.length > 0) {
            const record = data.records[0].fields;
            availablePersonalHours = record['Personaltime'] || 0;
            recordId = data.records[0].id; // Save the record ID
            return availablePersonalHours;
        } else {
            console.log('No Personal hours data found for user');
            return 0;
        }
    } catch (error) {
        console.error('Error fetching Personal hours:', error);
        alert('Failed to fetch Personal hours. Error: ' + error.message);
        return 0;
    }
}

async function fetchPersonalEndDate() {
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch Personal END Date: ${response.statusText}`);
        const data = await response.json();
        if (data.records.length > 0) {
            const personalEndDate = data.records[0].fields['Personal END Date'];
            return personalEndDate;
        } else {
            console.log('No Personal END Date found for user');
            return null;
        }
    } catch (error) {
        console.error('Error fetching Personal END Date:', error);
        return null;
    }
}

async function fetchApprovedStatus() {
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch Approved status: ${response.statusText}`);
        const data = await response.json();
        if (data.records.length > 0) {
            const approved = data.records[0].fields['Approved'];
            return approved;
        } else {
            console.log('No Approved status found for user');
            return false;
        }
    } catch (error) {
        console.error('Error fetching Approved status:', error);
        return false;
    }
}

async function updatePtoHours(usedPtoHoursValue) {
    console.log('Updating PTO hours...');
    const newPtoHoursValue = Math.max(0, availablePTOHours - usedPtoHoursValue);
    console.log('Used PTO hours value:', usedPtoHoursValue);
    console.log('New PTO hours value:', newPtoHoursValue);

    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
    console.log('Endpoint for update:', endpoint);

    try {
        const updateResponse = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: { 'PTO Time Used': newPtoHoursValue } })
        });

        const updateResponseData = await updateResponse.json();
        console.log('Update response data:', updateResponseData);

        if (!updateResponse.ok) throw new Error(`Failed to update PTO hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
        console.log('PTO hours updated successfully');
    } catch (error) {
        console.error('Error updating PTO hours:', error);
        throw new Error('Failed to update PTO hours. Error: ' + error.message);
    }
}

async function updatePersonalHours(usedPersonalHoursValue) {
    console.log('Updating Personal hours...');
    const newPersonalHoursValue = Math.max(0, availablePersonalHours - usedPersonalHoursValue);
    console.log('Used Personal hours value:', usedPersonalHoursValue);
    console.log('New Personal hours value:', newPersonalHoursValue);

    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
    console.log('Endpoint for update:', endpoint);

    try {
        const updateResponse = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: { 'Personaltime': newPersonalHoursValue } })
        });

        const updateResponseData = await updateResponse.json();
        console.log('Update response data:', updateResponseData);

        if (!updateResponse.ok) throw new Error(`Failed to update Personal hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
        console.log('Personal hours updated successfully');
    } catch (error) {
        console.error('Error updating Personal hours:', error);
        throw new Error('Failed to update Personal hours. Error: ' + error.message);
    }
}

export { fetchPtoHours, fetchPersonalTime, fetchPersonalEndDate, fetchApprovedStatus, updatePtoHours, updatePersonalHours };
