const { genAI, modelConfig } = require('../config/gemini');

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel(modelConfig);
  }

  async generateSafetyData(productName, language = 'English') {
    try {
      const prompt = `
        Role:
        You are a professional Chemical Safety Expert and certified SDS (Safety Data Sheet) author
        with full expertise in Türkiye (KKDİK / SEA) and EU (REACH & CLP) regulations.
        
        Task:
        Prepare DENETİMDE GEÇERLİ, EKSİKSİZ ve RESMİ FORMATTA SDS data
        for the chemical "${productName}" in language "${language}".
        
        Assume the document will be inspected by a government authority.
        Full compliance with CLP (GHS), REACH and KKDİK is mandatory.
        
        ---
        
        GENERAL RULES (MANDATORY):
        
        - NEVER use the term "MSDS". Use ONLY "SDS".
        - Follow the official 16-section SDS structure.
        - CLP (GHS) classification is MANDATORY.
        - Include correct H-statements, P-statements, signal word and pictograms.
        - NEVER leave any field empty.
        - If data is not explicitly available, make scientifically valid and regulation-compliant assumptions.
        - For truly unavailable data, explicitly use:
          "Uygulanamaz" OR "Mevcut veri yok"
        - Use formal, technical, inspection-ready language.
        - No marketing language, no legal disclaimers.
        
        ---
        
        CRITICAL SDS GUARDRAILS (DO NOT VIOLATE):
        
        - Treat this as an SDS DATA MODEL, not a summary.
        - All sections must be logically consistent.
        - Hazard classification MUST align with PPE, firefighting, transport and disposal.
        - If classified as hazardous, hazards array MUST NOT be empty.
        - If flammable/explosive/environmental hazard exists:
          UN number, ADR class and packing group MUST be provided.
        - PPE must reflect worst-case exposure.
        
        ---
        
        IMPORTANT OUTPUT RULE:
        
        Return ONLY a valid JSON object.
        - No markdown
        - No comments
        - No explanations
        - No extra text
        - No trailing commas
        
        ---
        
        JSON STRUCTURE (STRICT – DO NOT CHANGE KEYS):
        
        {
          "chemicalName": "Resmi Kimyasal Adı",
          "casNumber": "CAS No / EC No",
        
          "supplierInformation": {
            "companyName": "Firma adı veya Uygulanamaz",
            "address": "Adres veya Mevcut veri yok",
            "phone": "Telefon veya Mevcut veri yok",
            "emergencyPhone": "Acil durum telefonu (zorunlu)"
          },
        
          "description": "Madde tanımı ve önerilen kullanım alanları (Section 1).",
        
          "composition": [
            {
              "componentName": "Bileşen adı",
              "casNumber": "CAS No",
              "concentration": "% oran veya Uygulanamaz",
              "classification": "CLP sınıflandırması"
            }
          ],
        
          "hazards": [
            {
              "type": "flammable | irritant | toxic | corrosive | oxidizer | explosive | environmental | health_hazard | gas_cylinder",
              "label": "CLP Tehlike Sınıfı",
              "signalWord": "Tehlike | Dikkat",
              "pictograms": ["GHS01","GHS02","GHS07"],
              "description": "H ifadeleri ve tehlike açıklamaları"
            }
          ],
        
          "exposureControls": {
            "occupationalExposureLimit": "Varsa OEL değeri, yoksa Mevcut veri yok",
            "engineeringControls": "Havalandırma vb.",
            "ppeNotes": "Maruziyete göre ek önlemler"
          },
        
          "ppe": [
            {
              "type": "goggles | gloves | lab_coat | mask | face_shield | respirator",
              "label": "Kişisel koruyucu ekipman"
            }
          ],
        
          "properties": [
            {
              "label": "Fiziksel/Kimyasal özellik",
              "value": "Değer + birim"
            }
          ],
        
          "handling": "Güvenli elleçleme talimatları (Section 7).",
          "storage": "Depolama koşulları ve uyumsuz maddeler (Section 7).",
        
          "firstAid": [
            "Soluma: Section 4",
            "Cilt Teması: Section 4",
            "Göz Teması: Section 4",
            "Yutma: Section 4"
          ],
        
          "firefighting": [
            "Uygun söndürücüler",
            "Özel tehlikeler ve koruyucu ekipman"
          ],
        
          "accidentalRelease": "Kaza sonucu yayılma önlemleri (Section 6).",
        
          "stabilityAndReactivity": "Kararlılık ve reaksiyonlar (Section 10).",
        
          "toxicologicalInformation": "Toksikolojik etkiler (Section 11).",
        
          "ecologicalInformation": "Ekotoksisite bilgileri (Section 12).",
        
          "disposalConsiderations": "Atık bertaraf yöntemleri (Section 13).",
        
          "transportInformation": "UN No, taşıma adı, ADR/RID/IMDG/IATA (Section 14).",
        
          "regulatoryInformation": "KKDİK / SEA / REACH / CLP bilgileri (Section 15).",
        
          "revisionInformation": {
            "sdsVersion": "Revizyon numarası",
            "revisionDate": "GG.AA.YYYY",
            "changes": "İlk yayın veya revizyon açıklaması"
          },
        
          "riskAlert": {
            "hasAlert": true,
            "title": "Çok Önemli Güvenlik Uyarısı",
            "description": "Varsa CMR, STOT, kritik risk; yoksa genel güvenlik özeti."
          }
        }
      `;

      console.log(`Calling Gemini API (${this.model.model}) for: ${productName}`);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      try {
        if (response.candidates && response.candidates[0]) {
          console.log('Gemini usage metadata:', response.usageMetadata);
          console.log('Gemini finish reason:', response.candidates[0].finishReason);
        }
      } catch (e) {
        console.log('Could not log metadata:', e.message);
      }

      let text = response.text().trim();
      return this._parseJsonResponse(text);
    } catch (error) {
      console.error("Gemini Service Error:", error.message);
      throw error;
    }
  }

  async analyzeFile(fileBuffer, mimeType, language = 'English') {
    try {
      const prompt = `
        Role: Expert Chemical Safety Officer.
        Task: Analyze the attached Safety Data Sheet (SDS) or chemical document image. Extract key safety information and summarize it.
        Language: ${language}.
        
        IMPORTANT: Return ONLY a valid JSON object.
        Structure:
        {
          "confidence": "98%",
          "chemicalName": "Chemical Name",
          "summary": {
             "hazards": "Short summary of hazards",
             "ppe": "Short summary of required PPE",
             "firstAid": "Short summary of first aid measures",
             "storage": "Short summary of storage requirements"
          },
          "details": {
            "hazards": [
              { "type": "flammable|irritant|toxic|corrosive|oxidizer|explosive|environmental|health_hazard|gas_cylinder", "label": "Label", "description": "Details" }
            ],
            "ppe": [
               { "type": "goggles|gloves|lab_coat|mask|face_shield|respirator", "label": "Label" }
            ],
            "flashPoint": "Value if found or N/A",
            "casNumber": "Value if found"
          }
        }
      `;

      console.log(`Calling Gemini API (${this.model.model}) for file analysis (${mimeType})`);

      const imagePart = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text().trim();

      return this._parseJsonResponse(text);
    } catch (error) {
      console.error("Gemini File Analyze Error:", error.message);
      throw error;
    }
  }

  async generateProductDetails(productName, language = 'English') {
    try {
      const prompt = `
        Role: Expert Chemical Safety Officer and Industrial Chemist.
        Task: Provide a detailed technical overview for the chemical product "${productName}" for a laboratory inventory system.
        Language: ${language}.
        
        IMPORTANT: Return ONLY a valid JSON object.
        Structure:
        {
          "chemicalName": "Full standardized name",
          "synonyms": "Common synonyms (e.g. Propan-2-one)",
          "casNumber": "CAS Number",
          "basicInfo": {
            "formula": "Chemical Formula",
            "molecularWeight": "Value with units",
            "appearance": "Physical description",
            "purityGrade": "Typical purity (e.g. ACS Reagent, >99.5%)"
          },
          "safetySummary": {
             "dangerDescription": "A concise 1-2 sentence warning summary.",
             "hazards": ["Flammable", "Irritant"], 
             "ppEs": ["Goggles", "Gloves", "Ventilation"]
          },
          "physicalProperties": [
             { "label": "Boiling Point", "value": "Value" },
             { "label": "Melting Point", "value": "Value" },
             { "label": "Density", "value": "Value" },
             { "label": "Solubility", "value": "Value" }
          ],
          "storageInfo": {
             "location": "Recommended storage (e.g. Flammables Cabinet)",
             "conditions": "Keep cool, dry, well-ventilated"
          }
        }
      `;

      console.log(`Calling Gemini API (${this.model.model}) for Product Details: ${productName}`);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      return this._parseJsonResponse(text);
    } catch (error) {
      console.error("Gemini Product Details Error:", error.message);
      throw error;
    }
  }

  async translateAndFormatNews(newsItems) {
    try {
      // Limit to 10 items to avoid token limits
      const limitedNews = newsItems.slice(0, 10);
      const newsInput = limitedNews.map((item, index) => `Item ${index + 1}:\nTitle: ${item.title}\nSummary: ${item.contentSnippet || item.content}\nLink: ${item.link}`).join('\n\n');

      const prompt = `
        Role: Science News Editor.
        Task: Translate and format the following list of science/chemistry news into Turkish.
        
        Input News:
        ${newsInput}
        
        IMPORTANT: 
        1. Translate Title and Summary to Turkish.
        2. Keep the original Link.
        3. Assign a relevant static Unsplash image URL to each news item based on its topic (e.g., chemistry, biology, lab, dna, atom).
        4. Return ONLY a valid JSON array.
        
        Structure:
        [
          {
            "id": 1,
            "title": "Turkish Title",
            "description": "Turkish Summary (2-3 sentences max)",
            "date": "YYYY-MM-DD",
            "source": "ScienceDaily",
            "sourceLink": "Original Link",
            "imageUrl": "https://images.unsplash.com/..."
          }
        ]
        
        Ensure you process exactly ${limitedNews.length} items.
      `;

      console.log(`Calling Gemini API (${this.model.model}) for News Translation`);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      const parsedData = JSON.parse(text);

      // Post-process to ensure valid IDs and dates if missing
      const today = new Date().toISOString().split('T')[0];
      return parsedData.map((item, index) => ({
        ...item,
        id: index + 1,
        date: item.date || today
      }));

    } catch (error) {
      console.error("Gemini News Translation Error:", error);
      // Fallback: Return original items if AI fails, but limited
      return newsItems.slice(0, 5).map((item, index) => ({
        id: index + 1,
        title: item.title,
        description: item.contentSnippet,
        date: new Date().toISOString().split('T')[0],
        source: "ScienceDaily",
        sourceLink: item.link,
        imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d"
      }));
    }
  }

  async generateTdsData(productName, language = 'English') {
    try {
      const prompt = `
        Role: Expert Industrial Chemist, Technical Documentation Specialist, and Chemical Regulatory Compliance Expert.
        Task: Provide a COMPREHENSIVE, REGULATION-COMPLIANT Technical Data Sheet (TDS) for the chemical product "${productName}".
        Language: ${language}.
        
        COMPLIANCE REQUIREMENTS:
        - Full compliance with Turkish KKDİK (Kimyasalların Kayıt, Değerlendirme, İzin ve Kısıtlanması Hakkında Yönetmelik)
        - Full compliance with EU REACH and CLP regulations
        - Include all legally required supplier and document information
        - Include transport classification where applicable
        - Professional, audit-ready documentation
        
        CRITICAL RULES:
        - NEVER leave required fields empty
        - For unavailable data, use "Mevcut veri yok" or "Uygulanamaz" appropriately
        - Use scientifically accurate and regulation-compliant data
        - Include proper references to standards (TS, EN, ISO)
        - Ensure transport info aligns with hazard classification
        
        IMPORTANT: Return ONLY a valid JSON object.
        Structure:
        {
          "productName": "Standardized Product Name",
          "subtitle": "Common name or chemical formula",
          "category": "Industrial|Laboratory|Reagent|Food Grade|Pharmaceutical",
          
          "identity": {
            "casNumber": "CAS Number",
            "ecNumber": "EC Number",
            "formula": "Chemical Formula",
            "molecularWeight": "Value with unit"
          },
          
          "physicalProperties": [
            { "label": "Appearance", "value": "Description" },
            { "label": "Odor", "value": "Description" },
            { "label": "pH", "value": "Value" },
            { "label": "Density", "value": "Value with unit" },
            { "label": "Melting Point", "value": "Value with unit" },
            { "label": "Boiling Point", "value": "Value with unit" },
            { "label": "Flash Point", "value": "Value with unit or Uygulanamaz" },
            { "label": "Vapor Pressure", "value": "Value with unit or Mevcut veri yok" },
            { "label": "Solubility", "value": "Description" }
          ],
          
          "technicalSpecs": [
            { "label": "Purity (Min)", "value": "Percentage" },
            { "label": "Assay", "value": "Percentage or method" },
            { "label": "Iron (Fe)", "value": "Value with unit or Mevcut veri yok" },
            { "label": "Chloride (Cl)", "value": "Value with unit or Mevcut veri yok" },
            { "label": "Carbonate (Max)", "value": "Percentage or N/A" },
            { "label": "Heavy Metals", "value": "Value with unit or Mevcut veri yok" }
          ],
          
          "storageInfo": {
            "conditions": [
              "Serin ve kuru yerde saklayın",
              "İyi havalandırılan alanda muhafaza edin",
              "Güneş ışığından uzak tutun",
              "Uyumsuz maddelerden ayrı depolayın"
            ],
            "shelfLife": "Duration (e.g., 24 Months, 36 Months)"
          },
          
          "safetyWarnings": {
            "ghsLabels": ["skull", "health_and_safety", "warning", "corrosive", "flammable", "oxidizer", "environment"],
            "hazardStatement": "Primary H-statement (e.g., H302+H332: Yutulması ve solunması halinde zararlıdır)",
            "ghsTitle": "GHS Classification Label"
          },
          
          "supplierInformation": {
            "companyName": "Use generic placeholder: 'Firma Adı' or manufacturer name if well-known",
            "address": "Türkiye or EU based generic address or 'Tedarikçi bilgisi için lütfen etiket bilgilerine başvurunuz'",
            "phone": "+90 XXX XXX XX XX or Mevcut veri yok",
            "email": "info@example.com or Mevcut veri yok",
            "website": "www.example.com or Mevcut veri yok"
          },
          
          "documentInformation": {
            "documentNumber": "TDS-[ProductCode]-001 (generate based on product)",
            "revisionNumber": "Rev. 1.0",
            "issueDate": "Use current date in DD.MM.YYYY format",
            "supersedes": "İlk Yayın"
          },
          
          "regulatoryCompliance": {
            "reach": "REACH status: 'Kayıtlı', 'Pre-kayıtlı', 'Muaf (Annex IV/V)', or 'Mevcut veri yok'",
            "kkdik": "KKDİK compliance status: 'Bildirim yapılmıştır', 'Muaf', or 'Mevcut veri yok'",
            "standards": ["TS EN ISO standard", "Industry standard if applicable"]
          },
          
          "transportInformation": {
            "unNumber": "UN XXXX (if hazardous for transport) or 'Uygulanamaz'",
            "properShippingName": "Official transport name or 'Tehlikeli madde değildir'",
            "transportClass": "ADR/RID/IMDG/IATA class or 'Uygulanamaz'",
            "packingGroup": "I, II, III or 'Uygulanamaz'"
          }
        }
        
        NOTES:
        - If the chemical is hazardous (flammable, toxic, corrosive, etc.), transport information MUST be filled
        - GHS labels must match the hazard classification
        - Supplier information should be realistic but generic (to protect privacy)
        - All regulatory fields are MANDATORY for professional TDS documents
      `;

      console.log(`Calling Gemini API (${this.model.model}) for TDS: ${productName}`);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      return this._parseJsonResponse(text);
    } catch (error) {
      console.error("Gemini TDS Error:", error.message);
      throw error;
    }
  }

  _parseJsonResponse(text) {
    if (!text) {
      throw new Error("AI'dan boş yanıt geldi.");
    }

    let jsonString = text.trim();

    // 1. Remove Markdown code blocks if present (though application/json mode shouldn't have them)
    // Matches ```json { ... } ``` or similar
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    const match = markdownRegex.exec(jsonString);
    if (match) {
      jsonString = match[1];
    }

    try {
      // 2. Try to find the first { or [ and last } or ]
      const firstBrace = jsonString.indexOf('{');
      const firstBracket = jsonString.indexOf('[');
      const lastBrace = jsonString.lastIndexOf('}');
      const lastBracket = jsonString.lastIndexOf(']');

      let startIndex = -1;
      let endIndex = -1;

      // Determine which one comes first/last to support both objects and arrays
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIndex = firstBrace;
      } else if (firstBracket !== -1) {
        startIndex = firstBracket;
      }

      if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
        endIndex = lastBrace;
      } else if (lastBracket !== -1) {
        endIndex = lastBracket;
      }

      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        jsonString = jsonString.substring(startIndex, endIndex + 1);
      }

      // 3. Clean up common JSON minor errors (like trailing commas)
      const cleaned = jsonString
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']');

      const parsedData = JSON.parse(cleaned);
      console.log("Successfully parsed JSON data from Gemini.");
      return parsedData;
    } catch (parseError) {
      console.error("Parse Error. Response length:", text.length);
      console.error("Last 100 chars:", text.substring(Math.max(0, text.length - 100)));

      // Save for debugging
      try {
        const fs = require('fs');
        const timestamp = new Date().getTime();
        fs.writeFileSync(`error_response_${timestamp}.txt`, text);
      } catch (e) { }

      throw new Error(`AI yanıtını işleyemedim (JSON formatı bozuk veya eksik). Hata: ${parseError.message}`);
    }
  }
  async identifyProductFromText(ocrText, language = 'Turkish') {
    try {
      const prompt = `
        Role: Expert Industrial Chemist and Product Specialist.
        Task: Analyze the provided OCR text from a chemical product label/container. 
        Identify the primary chemical raw material name, CAS number, and/or chemical formula mentioned in the text.
        
        Rules:
        1. Ignore manufacturer names, weight/volume info, batch numbers, or irrelevant shipping text.
        2. Focus only on the chemical identification.
        3. If multiple chemicals are found, pick the main one.
        4. If no chemical is clearly identified, return null for chemicalName.
        
        Text to analyze:
        """
        ${ocrText}
        """
        
        Language of identified info: ${language}.
        
        IMPORTANT: Return ONLY a valid JSON object.
        Structure:
        {
          "chemicalName": "Standardized Chemical Name",
          "casNumber": "CAS Number (if found or null)",
          "formula": "Chemical Formula (if found or null)",
          "probability": "0-100 percentage",
          "note": "Optional brief context why this was picked"
        }
      `;

      console.log(`Calling Gemini API for OCR Identification`);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      return this._parseJsonResponse(text);
    } catch (error) {
      console.error("Gemini OCR Identification Error:", error.message);
      throw error;
    }
  }
}

module.exports = new GeminiService();
