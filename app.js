const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

// 路由
const indexRoutes = require('./routes/index');
const fileRoutes = require('./routes/file');
app.use('/', indexRoutes);
app.use('/file', fileRoutes);


app.listen(PORT, () => {
  console.log(`服务运行在: http://localhost:${PORT}`);
});
