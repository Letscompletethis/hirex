const fields = ["apiUrl", "token", "firstName", "lastName", "email", "phone", "currentJobTitle"];
const result = document.querySelector("#result");

chrome.storage.local.get(fields, (saved) => fields.forEach((field) => {
  if (saved[field]) document.querySelector(`#${field}`).value = saved[field];
}));

document.querySelector("#import").addEventListener("click", async () => {
  const values = Object.fromEntries(fields.map((field) => [field, document.querySelector(`#${field}`).value.trim()]));
  if (!values.apiUrl || !values.token || !values.email) {
    result.textContent = "API URL, bearer token, and email are required.";
    return;
  }
  chrome.storage.local.set(values);
  result.textContent = "Importing...";
  try {
    const response = await fetch(`${values.apiUrl.replace(/\/$/, "")}/api/integrations/linkedin/import`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${values.token}` },
      body: JSON.stringify({ source: "user-selected", profile: { firstName: values.firstName, lastName: values.lastName, email: values.email, phone: values.phone, currentJobTitle: values.currentJobTitle } }),
    });
    const body = await response.json();
    result.textContent = response.ok ? `Imported ${body.candidate?.candidate_id || "candidate"}.` : (body.error || "Import failed.");
  } catch (error) {
    result.textContent = error.message || "Could not reach HireX.";
  }
});