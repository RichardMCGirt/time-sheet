const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'app9gw2qxhGCmtJvW';
const tableId = 'tbljmLpqXScwhiWTt';

// DOM elements
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const submitEmailButton = document.getElementById('submitEmailButton');
const resetPasswordButton = document.getElementById('resetPasswordButton');

submitEmailButton.addEventListener('click', handleEmailSubmit);
resetPasswordButton.addEventListener('click', handlePasswordReset);

async function handleEmailSubmit() {
    const email = emailInput.value;
    if (!email) {
        alert('Please enter your email.');
        return;
    }

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
        if (data.records.length > 0) {
            alert('Email validated. Please enter your new password.');
            forgotPasswordForm.style.display = 'none';
            resetPasswordForm.style.display = 'block';
        } else {
            alert('Email not found.');
        }
    } catch (error) {
        console.error('Error validating email:', error);
        alert('Error validating email: ' + error.message);
    }
}

async function handlePasswordReset() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword || !confirmPassword) {
        alert('Please fill in both password fields.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    const email = emailInput.value;

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
        const userRecord = data.records.find(record => record.fields.email === email);

        if (userRecord) {
            const updateResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${userRecord.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        password: newPassword
                    }
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Error updating password');
            }

            alert('Password updated successfully.');
            window.location.href = 'index.html';
        } else {
            alert('Error finding user record.');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Error resetting password: ' + error.message);
    }
}
