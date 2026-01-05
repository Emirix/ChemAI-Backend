const GeminiService = require('./src/services/geminiService');
console.log('Type:', typeof GeminiService);
console.log('Value:', GeminiService);
if (GeminiService) {
    console.log('Has generateSafetyData:', typeof GeminiService.generateSafetyData);
}
