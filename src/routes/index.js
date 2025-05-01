const router = require('express').Router();

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Stockify API',
    version: '1.0.0'
  });
})

module.exports = router;