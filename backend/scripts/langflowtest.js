// Secure test script - replace YOUR_NEW_API_KEY with your regenerated key

async function testLangflowAPI() {
    // Replace this with your NEW API key after regenerating it
    const API_KEY = "sk-SrVzjvnfpBL5oGlPJfcbX5OBfWRBqBAZp-8Y0gu7KR0";
    
    if (!API_KEY || API_KEY === "") {
      console.error('❌ Please set your API key in the script');
      return;
    }
  
    const payload = {
      "output_type": "chat",
      "input_type": "chat",
      "input_value": "find me a software engineer please",
      "session_id": "user_1"
    };
  
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "x-api-key": API_KEY
      },
      body: JSON.stringify(payload)
    };
  
    try {
      console.log('🚀 Testing Langflow API...');
      
      const response = await fetch(
        'https://langflow-725514508091.us-west1.run.app/api/v1/run/a3a60e71-88a5-4549-b852-ddbdc7da101a', 
        options
      );
      
      console.log('📡 Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error:', response.status, errorText);
        
        // Common error interpretations
        if (response.status === 401) {
          console.log('💡 This looks like an authentication error. Check your API key.');
        } else if (response.status === 404) {
          console.log('💡 Flow not found. Check your flow ID.');
        } else if (response.status === 500) {
          console.log('💡 Server error. This might be the Supabase component issue we discussed.');
        }
        
        return;
      }
  
      const data = await response.json();
      console.log('✅ Success!');
      console.log('📄 Response:', JSON.stringify(data, null, 2));
      
      // Check for designer results
      if (data.outputs && data.outputs[0] && data.outputs[0].outputs) {
        const message = data.outputs[0].outputs[0];
        console.log('🎯 AI Response:', message);
      }
      
    } catch (error) {
      console.error('🔥 Request failed:', error.message);
    }
  }
  
  // Run the test
  testLangflowAPI();