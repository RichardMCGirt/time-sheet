async function fetchPtoHours() {
    console.log('Fetching PTO hours...');
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';

    const userEmail = localStorage.getItem('userEmail');
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch PTO hours: ${response.statusText}`);

        const data = await response.json();
        console.log('Fetched PTO hours:', data);

        if (data.records.length > 0) {
            const record = data.records[0].fields;
            availablePTOHours = record['PTO Hours'] || 0;
            elements.ptoHoursDisplay.textContent = availablePTOHours.toFixed(2);
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
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';

    const userEmail = localStorage.getItem('userEmail');
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch Personal hours: ${response.statusText}`);

        const data = await response.json();
        console.log('Fetched Personal hours:', data);

        if (data.records.length > 0) {
            const record = data.records[0].fields;
            availablePersonalHours = record['Personaltime'] || 0;
            elements.personalTimeDisplay.textContent = availablePersonalHours.toFixed(2);
            console.log('Available Personal hours:', availablePersonalHours);
        } else {
            console.log('No Personal hours data found for user');
        }
    } catch (error) {
        console.error('Error fetching Personal hours:', error);
        alert('Failed to fetch Personal hours. Error: ' + error.message);
    }
}

async function updatePtoHours() {
    console.log('Updating PTO hours...');
    const usedPtoHoursValue = parseFloat(elements.ptoTimeSpan.textContent) || 0;
    const newPtoHoursValue = Math.max(0, availablePTOHours - usedPtoHoursValue);
    console.log('Used PTO hours value:', usedPtoHoursValue);
    console.log('New PTO hours value:', newPtoHoursValue);

    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
    console.log('Endpoint for update:', endpoint);

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

async function updatePersonalHours() {
    console.log('Updating Personal hours...');
    const usedPersonalHoursValue = parseFloat(elements.personalTimeSpan.textContent) || 0;
    const newPersonalHoursValue = Math.max(0, availablePersonalHours - usedPersonalHoursValue);
    console.log('Used Personal hours value:', usedPersonalHoursValue);
    console.log('New Personal hours value:', newPersonalHoursValue);

    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
    console.log('Endpoint for update:', endpoint);

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

async function patchTimesheetData(payload) {
    console.log('Patching timesheet data...');
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const userEmail = localStorage.getItem('userEmail');
    
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
                body: JSON.stringify({ fields: payload })
            });

            const updateResponseData = await updateResponse.json();
            console.log('Update response data:', updateResponseData);

            if (!updateResponse.ok) throw new Error(`Failed to update timesheet data: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
            console.log('Timesheet data updated successfully');
            alert('Timesheet data updated successfully!');
        } else {
            throw new Error('No record found for user');
        }
    } catch (error) {
        console.error('Error updating timesheet data:', error);
        alert('Failed to update timesheet data. Error: ' + error.message);
    }
}
