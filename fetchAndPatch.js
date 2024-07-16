// fetchAndPatch.js

const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'app9gw2qxhGCmtJvW';
const tableId = 'tbljmLpqXScwhiWTt/';
const cloudName = 'dhju1fzne';
const unsignedUploadPreset = 'Timeoff';

// Fetch record ID by email
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

// Upload image to Cloudinary
async function uploadImageToCloudinary(blob) {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', unsignedUploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (response.ok) {
        console.log('Uploaded image URL:', data.secure_url);
        return data.secure_url;
    } else {
        throw new Error('Failed to upload image to Cloudinary: ' + data.error.message);
    }
}

// Fetch PTO hours
async function fetchPtoHours(userEmail) {
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
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
        if (data.records.length > 0) {
            return parseFloat(data.records[0].fields['PTO Hours']) || 0;
        } else {
            throw new Error('No PTO record found for user');
        }
    } catch (error) {
        console.error('Error fetching PTO hours:', error);
        throw error;
    }
}

// Fetch Personal hours
async function fetchPersonalTime(userEmail) {
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
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
        if (data.records.length > 0) {
            return parseFloat(data.records[0].fields['Personaltime']) || 0;
        } else {
            throw new Error('No personal time record found for user');
        }
    } catch (error) {
        console.error('Error fetching personal hours:', error);
        throw error;
    }
}

// Patch data to Airtable
async function patchAirtableRecord(recordId, fields) {
    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
    try {
        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields })
        });

        if (!response.ok) {
            throw new Error(`Failed to patch data: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error patching data to Airtable:', error);
        throw error;
    }
}

// Capture screenshot and patch to Airtable
async function captureScreenshotAndPatch(userEmail) {
    try {
        const recordId = await getRecordIdByEmail(userEmail);
        if (!recordId) {
            alert('No record found for the provided email.');
            return;
        }

        html2canvas(document.getElementById('time-entry-form')).then(canvas => {
            canvas.toBlob(async blob => {
                try {
                    const fileUrl = await uploadImageToCloudinary(blob);
                    const fields = { "Screenshot": [{ "url": fileUrl }] };
                    await patchAirtableRecord(recordId, fields);
                    alert('Screenshot patched to Airtable successfully!');
                } catch (error) {
                    console.error('Error uploading image or patching to Airtable:', error);
                    alert('Error uploading image or patching to Airtable.');
                }
            });
        });
    } catch (error) {
        console.error('Error during screenshot capture and patch:', error);
    }
}

// Export functions
