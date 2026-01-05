const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendQuoteRequest({ to, supplierName, productName, quantity, unit, note, userEmail, userName }) {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'ChemAI'}" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Yeni Teklif Talebi: ${productName} - ChemAI`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #1f89e5;">Yeni Teklif Talebi</h2>
                    <p>Sayın <strong>${supplierName}</strong> Yetkilisi,</p>
                    <p>ChemAI platformu üzerinden bir kullanıcımız sizinle iletişime geçmek ve aşağıdaki ürün için teklif almak istiyor:</p>
                    
                    <div style="background-color: #f6f7f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Ürün:</strong> ${productName}</p>
                        <p style="margin: 5px 0;"><strong>Miktar:</strong> ${quantity} ${unit}</p>
                    </div>

                    ${note ? `<p><strong>Kullanıcı Notu:</strong><br/>${note}</p>` : ''}

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                    
                    <h3 style="color: #666; font-size: 16px;">Talep Eden Bilgileri</h3>
                    <p style="margin: 5px 0;"><strong>İsim:</strong> ${userName || 'Belirtilmedi'}</p>
                    <p style="margin: 5px 0;"><strong>E-posta:</strong> ${userEmail}</p>
                    
                    <p style="font-size: 12px; color: #999; margin-top: 30px;">
                        Bu e-posta ChemAI platformu aracılığıyla gönderilmiştir. Yanıtlamak için doğrudan kullanıcının e-posta adresine yazabilirsiniz.
                    </p>
                </div>
            `,
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();
