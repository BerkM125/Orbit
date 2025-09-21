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
            "x-api-key": "sk-4ZGXuNWfzNBMYtzeOcVPauxAFfjkr_ONmWC5pV-pi5M"
        },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetch('http://localhost:7860/api/v1/run/c540d760-6ab2-4820-b402-3b163abe9c7e', options);
        
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
        return JSON.parse(cleanedMessage).result.room.users;

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

module.exports = {
    getLangflowResults
}