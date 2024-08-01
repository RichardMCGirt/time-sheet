const API_KEY = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const BASE_ID = 'app9gw2qxhGCmtJvW';
const TABLE_ID = 'tbljmLpqXScwhiWTt';

// Function to get the email from local storage and match it with Airtable
async function matchEmailWithAirtable() {
    const storedEmail = localStorage.getItem('userEmail');
    
    if (!storedEmail) {
        console.error('No email found in local storage');
        return;
    }

    try {
        const response = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
            headers: {
                Authorization: `Bearer ${API_KEY}`
            },
            params: {
                filterByFormula: `{email} = "${storedEmail}"` // Replace 'Email' with your field name
            }
        });

        if (response.data.records.length > 0) {
            console.log('Email matches:', response.data.records);
        } else {
            console.log('No matching email found in Airtable.');
        }
    } catch (error) {
        console.error('Error fetching data from Airtable:', error);
    }
}

// Call the function
matchEmailWithAirtable();