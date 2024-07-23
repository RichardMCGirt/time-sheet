document.getElementById('export-xlsx-button').addEventListener('click', async function () {
    const workbook = XLSX.utils.book_new();
    const sheetData = [];
    
    // Collect data from the timesheet form
    const table = document.getElementById('time-entry-table');
    const rows = table.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const rowData = [];
        for (let j = 0; j < cells.length - 1; j++) {
            const input = cells[j].getElementsByTagName('input')[0] || cells[j].getElementsByTagName('span')[0];
            rowData.push(input.value || input.textContent);
        }
        sheetData.push(rowData);
    }
    
    // Create sheet and append to workbook
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet");

    // Generate the XLSX file
    const xlsxFile = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    
    // Convert binary string to array buffer
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }
    
    const xlsxBlob = new Blob([s2ab(xlsxFile)], { type: "application/octet-stream" });

    // Send the file to Airtable
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableId = 'tbljmLpqXScwhiWTt';
    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';

    const formData = new FormData();
    formData.append('attachments', xlsxBlob, 'timesheet.xlsx');

    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;

    try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data = await response.json();

        if (data.records.length > 0) {
            const recordId = data.records[0].id;

            const uploadEndpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}/attachments`;
            const uploadResponse = await fetch(uploadEndpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`
                },
                body: formData
            });

            if (uploadResponse.ok) {
                alert('XLSX file uploaded successfully!');
            } else {
                throw new Error('Failed to upload XLSX file');
            }
        } else {
            throw new Error('No record found for user');
        }
    } catch (error) {
        console.error('Error uploading XLSX file:', error);
        alert('Failed to upload XLSX file. Error: ' + error.message);
    }
});