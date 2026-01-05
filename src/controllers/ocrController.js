const geminiService = require('../services/geminiService');

class OcrController {
    async identifyChemical(req, res) {
        try {
            const { text, language } = req.body;

            if (!text) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Analiz edilecek metin bulunamadı.'
                });
            }

            console.log('OCR text analysis requested...');
            const result = await geminiService.identifyProductFromText(text, language || 'Turkish');
            console.log('Gemini analysis completed successfully:', result.chemicalName);

            res.status(200).json({
                status: 'success',
                data: result
            });
            console.log('Response sent to client.');
        } catch (error) {
            console.error('OcrController identifyChemical error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Metin analizi sırasında bir hata oluştu.',
                error: error.message
            });
        }
    }
}

module.exports = new OcrController();
