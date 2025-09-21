// Returns text/object JSON of all search results
async function getLangflowResults(searchQuery) {
    const payload = {
        "output_type": "chat",
        "input_type": "chat",
        "input_value": searchQuery,
        "session_id": "user_1"
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "x-api-key": "sk-hxsc7zBoVHc1FP1TqSzrki0O3wviyHEg_yU6W5pDW8A"
        },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetch('https://langflow-725514508091.us-west1.run.app/api/v1/run/96b9e326-914f-490e-8c36-e6cfc9659d35', options);
        
        if (!response.ok) { // Check for HTTP errors (e.g., 404 Not Found)
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // Wait for the response body to be parsed as JSON
        console.log("RAW DATA: ", data.outputs[0].outputs[0].artifacts.message);
        let rawMessage = data.outputs[0].outputs[0].artifacts.message;
        
        // First replace double quotes with the number 6 to avoid conflicts
        rawMessage = rawMessage.replace(/"/g, '6');

        // Then replace single quotes with double quotes for valid JSON parsing
        let cleanedMessage = rawMessage.replace(/'/g, '"');
        return JSON.parse(cleanedMessage).result;

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

module.exports = {
    getLangflowResults
}