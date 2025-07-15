const express = require('express');
const { ocrController, upload } = require('../controllers/ocrController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/process-image', 
  auth, 
  upload.single('image'), 
  ocrController.processImage
);

router.post('/process-batch', 
  auth, 
  upload.array('images', 5), 
  ocrController.processBatchImages
);

router.post('/process-text', 
  auth, 
  ocrController.processTextInput
);

module.exports = router;
