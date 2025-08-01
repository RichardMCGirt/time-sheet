// Airtable Config
const AIRTABLE_API_KEY = "patW07BoKoJG3dsef.c533e11a7b2005c7ff8a2a4c53f145aa97049a0bed00d0fd82e513f664bcefd9"; 
const BASE_ID = "appRplLVFnR1ZK8WH";
const TABLE_ID = "tblV1HOCtGjfyGk71";

// Auto-populate email from localStorage (saved at login)
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("userEmail") || "";
  document.getElementById("submitterEmail").value = email;
});

// Form submission
document.getElementById("airtableForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const requestType = document.getElementById("requestType").value;
  const submitterEmail = document.getElementById("submitterEmail").value;
  const notes = document.getElementById("notes").value;

  // Format Submitted By from email (firstname.lastname)
  let submittedBy = "";
  if (submitterEmail.includes("@")) {
    const [first, lastWithDomain] = submitterEmail.split(".");
    const last = lastWithDomain.split("@")[0];
    submittedBy = `${capitalize(first)} ${capitalize(last)}`;
  }

  const payload = {
    fields: {
      "Request type": requestType,
      "Submitter Email": submitterEmail,
      "Notes From Submitter": notes,
      "Submitted By": submittedBy
    }
  };

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      document.getElementById("message").innerHTML = "<p class='success'>✅ Request submitted successfully!</p>";
      document.getElementById("airtableForm").reset();
      document.getElementById("submitterEmail").value = localStorage.getItem("userEmail") || "";
    } else {
      const errorData = await response.json();
      console.error("Airtable Error:", errorData);
      document.getElementById("message").innerHTML = "<p class='error'>❌ Error submitting request.</p>";
    }
  } catch (error) {
    console.error("Network Error:", error);
    document.getElementById("message").innerHTML = "<p class='error'>❌ Network error. Try again.</p>";
  }
});

// Helper function to capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
