const GEMINI_API_KEY = "AIzaSyBf3YnLXzqSFeAsOTKyka4ZQx77xdRC2Jg";

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("AVAILABLE MODELS:");
    data.models.forEach(m => {
      console.log(`- ${m.name} (methods: ${m.supportedGenerationMethods?.join(", ")})`);
    });
  } catch (e) {
    console.error(e);
  }
}

listModels();
