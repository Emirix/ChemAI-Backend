const GeminiService = require('../services/geminiService');

exports.analyzeSds = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi.' });
        }

        const { buffer, mimetype } = req.file;

        // Validate mime type (images and pdfs)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(mimetype)) {
            return res.status(400).json({ error: 'Desteklenmeyen dosya formatı. Lütfen görsel veya PDF yükleyin.' });
        }

        console.log(`Analyzing file: ${mimetype}, size: ${buffer.length}`);

        const result = await GeminiService.analyzeFile(buffer, mimetype);

        res.json(result);
    } catch (error) {
        console.error('SDS Analysis Error:', error);
        res.status(500).json({ error: 'Analiz sırasında bir hata oluştu.' });
    }
};
