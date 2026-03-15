const GEMINI_API_KEY = "AIzaSyBf3YnLXzqSFeAsOTKyka4ZQx77xdRC2Jg";
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function testGemini() {
  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: "Hello, what models can you use?" }] }]
  };

  try {
    console.log("Pinging Gemini 2.5-flash...");
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const text = await response.text();
    console.log("STATUS:", response.status);
    console.log("RESPONSE:", text);
  } catch (e) {
    console.error("Fetch threw:", e);
  }
}

testGemini();
