const express = require('express');
const router = express.Router();

// 首页路由
router.get('/', (req, res) => {
  res.redirect('/web/index.html');
});

module.exports = router;