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
            document.getElementById('pto-hours-display').textContent = availablePTOHours.toFixed(2);
            console.log('Available PTO hours:', availablePTOHours);
        } else {
            console.log('No PTO hours data found for user');
        }
    } catch (error) {
        console.error('Error fetching PTO hours:', error);
        alert('Failed to fetch PTO hours. Error: ' + error.message);
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
            document.getElementById('personal-time-display').textContent = availablePersonalHours.toFixed(2);
            console.log('Available Personal hours:', availablePersonalHours);
        } else {
            console.log('No Personal hours data found for user');
        }
    } catch (error) {
        console.error('Error fetching Personal hours:', error);
        alert('Failed to fetch Personal hours. Error: ' + error.message);
    }
}

async function updatePtoHours(newPtoHoursValue) {
    console.log('Updating PTO hours...');
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data = await response.json();
        console.log('Fetched data for update:', data);

        if (data.records.length > 0) {
            const recordId = data.records[0].id;
            console.log('Record ID:', recordId);

            const updateResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: { 'PTO Hours': newPtoHoursValue } })
            });

            const updateResponseData = await updateResponse.json();
            console.log('Update response data:', updateResponseData);

            if (!updateResponse.ok) throw new Error(`Failed to update PTO hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
            console.log('PTO hours updated successfully');
            alert('PTO hours updated successfully!');
        } else {
            throw new Error('No record found for user');
        }
    } catch (error) {
        console.error('Error updating PTO hours:', error);
        alert('Failed to update PTO hours. Error: ' + error.message);
    }
}

async function updatePersonalHours(newPersonalHoursValue) {
    console.log('Updating Personal hours...');
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data = await response.json();
        console.log('Fetched data for update:', data);

        if (data.records.length > 0) {
            const recordId = data.records[0].id;
            console.log('Record ID:', recordId);

            const updateResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
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
            alert('Personal hours updated successfully!');
        } else {
            throw new Error('No record found for user');
        }
    } catch (error) {
        console.error('Error updating Personal hours:', error);
        alert('Failed to update Personal hours. Error: ' + error.message);
    }
}
