const express = require('express');
const router = express.Router();
const multer = require('multer');
const SafetyController = require('../controllers/safetyController');
const ChatController = require('../controllers/chatController');
const SdsController = require('../controllers/sdsController');
const RawMaterialController = require('../controllers/rawMaterialController');
const NewsController = require('../controllers/newsController');
const TdsController = require('../controllers/tdsController');
const CompanyController = require('../controllers/companyController');
const AdminController = require('../controllers/adminController');
const FeedbackController = require('../controllers/feedbackController');
const NotificationController = require('../controllers/notificationController');
const OcrController = require('../controllers/ocrController');
const { isAdmin } = require('../middleware/auth');


// Multer config for handling file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/safety-data', SafetyController.getSafetyData);
router.post('/chat', ChatController.sendMessage);
router.post('/chat/generate-metadata', ChatController.generateChatMetadata);
router.post('/analyze-sds', upload.single('file'), SdsController.analyzeSds);
router.post('/raw-material-details', RawMaterialController.getRawMaterialDetails);
router.post('/identify-chemical', OcrController.identifyChemical);

// News Routes
router.get('/news', NewsController.getNews);
router.get('/news/categories', NewsController.getCategories);
router.post('/news/fetch-daily', NewsController.fetchDailyNews);

router.post('/tds-data', TdsController.getTdsData);

// Company Management Routes
router.post('/companies', CompanyController.getCompanies);
router.post('/companies/get', CompanyController.getCompanyById);
router.post('/companies/create', CompanyController.createCompany);
router.post('/companies/update', CompanyController.updateCompany);
router.post('/companies/delete', CompanyController.deleteCompany);
router.post('/companies/set-default', CompanyController.setDefaultCompany);
router.post('/companies/default', CompanyController.getDefaultCompany);

// Admin Routes
router.get('/admin/users', isAdmin, AdminController.getUsers);
router.get('/admin/logs', isAdmin, AdminController.getLogs);
router.get('/admin/stats', isAdmin, AdminController.getStats);

// Feedback Routes
router.post('/feedback/submit', FeedbackController.submitFeedback);
router.get('/feedback/user/:user_id', FeedbackController.getUserFeedback);
router.get('/feedback/all', isAdmin, FeedbackController.getAllFeedback);
router.put('/feedback/:id/status', isAdmin, FeedbackController.updateFeedbackStatus);
router.get('/feedback/test-telegram', FeedbackController.testTelegram);

// Notification Routes
router.post('/notifications/send-to-user', NotificationController.sendToUser);
router.post('/notifications/send-to-multiple', isAdmin, NotificationController.sendToMultipleUsers);
router.post('/notifications/broadcast', isAdmin, NotificationController.sendToTopic);

module.exports = router;
