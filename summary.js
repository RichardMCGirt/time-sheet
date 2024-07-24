document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'app9gw2qxhGCmtJvW';
    const tableName = 'tbljmLpqXScwhiWTt';
  
    document.getElementById('submit-button').addEventListener('click', function(event) {
        event.preventDefault();
    
        // Extract data from summary form
        const ptoTime = document.getElementById('pto-time').innerText;
        const personalTime = document.getElementById('total-personal-time-display').innerText;
        const holidayHours = document.getElementById('Holiday-hours').innerText;
        const totalTimeWorked = document.getElementById('total-time-worked').innerText;
        const totalTimeWithPto = document.getElementById('total-time-with-pto-value').innerText;
        const remainingPtoHours = document.getElementById('remaining-pto-hours').innerText;
        const remainingPersonalHours = document.getElementById('remaining-personal-hours').innerText;
        const date7 = document.getElementById('date7').value; 
        // Prepare data for Airtable
        const data = {
          fields: {
            "PTO Hours": remainingPtoHours,
            "Personaltime": remainingPersonalHours,
            "Total Hours Worked": totalTimeWorked,
            "PTO time used": ptoTime,
            "Personal Time Used": personalTime,
            "Holiday Hours Used": holidayHours,
            "date7": date7
          }
        };
    
        // Post data to Airtable
        fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
          console.log('Data successfully posted to Airtable:', result);
          alert('Data successfully posted!');
        })
        .catch(error => {
          console.error('Error posting data to Airtable:', error);
          alert('Failed to post data.');
        });
      });
    });