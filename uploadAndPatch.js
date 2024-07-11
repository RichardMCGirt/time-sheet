const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
const baseId = 'appMq9W12jZyCJeXe';
const tableId = 'tblhTl5q7sEFDv66Z';
const cloudName = 'dhju1fzne'; // Replace with your Cloudinary cloud name
const unsignedUploadPreset = 'Timeoff'; // Replace with your unsigned upload preset

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

async function captureScreenshotAndPatch(userEmail) {
    console.log('Capturing screenshot and patching to Airtable...');
    
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
                    console.log('File URL:', fileUrl);

                    const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
                    console.log('Endpoint for patch:', endpoint);

                    const response = await fetch(endpoint, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            fields: {
                                "Screenshot": [
                                    {
                                        "url": fileUrl
                                    }
                                ]
                            }
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to patch data: ${response.statusText}`);
                    }

                    const data = await response.json();
                    console.log('Success:', data);
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


