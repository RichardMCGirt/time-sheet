const apiKey = 'patlpJTj4IzTPxTT3.3de1a5fb5b5881b393d5616821ff762125f1962d1849879d0719eb3b8d580bde';
const baseId = 'appMq9W12jZyCJeXe'; // Extracted base ID
const tableId = 'tblRqUgMsd2QSd5ka'; // Extracted table ID


document.getElementById('loginButton').addEventListener('click', login);

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={email}='${email}'`, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const user = data.records.find(record => record.fields.email === email && record.fields.password === password);

        if (user) {
            sessionStorage.setItem('user', JSON.stringify(user.fields));
            window.location.href = 'timesheet.html';
        } else {
            alert('Invalid email or password');
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}
