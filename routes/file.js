const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getUniqueFilename } = require("../utils");

const ROOT_PATH = path.join(__dirname, "../").replace(/\\/g, "/"); // 获取项目的根目录路径
const UPLOAD_PATH = path.join(ROOT_PATH, "uploads"); // 上传文件路径
const UPLOAD_TEMP_PATH = path.join(UPLOAD_PATH, "temp"); // 上传文件临时路径

const _CHUNKS_FOLDER_MARK_ = "_CHUNKS_FOLDER_MARK_"; // 存放分片的目录，目录名后缀，如：filename.txt_CHUNKS_FOLDER_MARK_
const _CHUNK_ = "_CHUNK_"; // 保存后切片的文件名前缀，如：_CHUNK_1

const router = express.Router();
const uploader = multer({ dest: UPLOAD_TEMP_PATH });

// 上传文件
router.post("/upload", uploader.single("chunkBlob"), (req, res) => {
  const { filename, chunkIndex, chunkHash } = req.body;
  const chunksDir = path.join(UPLOAD_PATH, filename + _CHUNKS_FOLDER_MARK_);
  if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir);

  const chunkPath = path.join(chunksDir, _CHUNK_ + chunkIndex);

  // 将分片移动到指定目录，并重命名为：_CHUNK_index
  fs.rename(req.file.path, chunkPath, (err) => {
    if (err) {
    } else {
      // 删除临时文件
      fs.unlink(req.file.path, (err) => {});
    }
  });

  res.json({
    status: 200,
    msg: "上传成功"
  });
});

// 获取已上传的文件切片
router.get("/uploadedChunks", (req, res) => {
  const { filename } = req.query;
  const chunksDir = path.join(UPLOAD_PATH, filename + _CHUNKS_FOLDER_MARK_);

  let uploadedChunks = [];
  if (fs.existsSync(chunksDir)) {
    uploadedChunks = fs.readdirSync(chunksDir).map((name) => parseInt(name.replace(_CHUNK_, "")));
  }

  res.json({
    status: 200,
    msg: "获取成功",
    data: uploadedChunks
  });
});

// 合并文件
router.post("/merge", (req, res) => {
  const filename = req.body.filename;
  console.log("合并文件: ", filename);

  const chunksDir = path.join(UPLOAD_PATH, filename + _CHUNKS_FOLDER_MARK_);
  if (!fs.existsSync(chunksDir)) {
    res.json({
      status: 200,
      msg: "要合并的文件不存在"
    });
    return;
  }

  const indexs = fs.readdirSync(chunksDir).map((name) => parseInt(name.replace(_CHUNK_, "")));
  const indexsSort = indexs.sort((a, b) => a - b);

  const uniqueFilename = getUniqueFilename(UPLOAD_PATH, filename);
  const writeStream = fs.createWriteStream(path.join(UPLOAD_PATH, uniqueFilename));

  indexsSort.forEach((index) => {
    const chunkPath = path.join(chunksDir, _CHUNK_ + index);
    const chunk = fs.readFileSync(chunkPath);
    writeStream.write(chunk);
    fs.unlinkSync(chunkPath);
  });

  writeStream.end();
  fs.rmdirSync(chunksDir);

  res.json({
    status: 200,
    msg: "合并成功"
  });
});

module.exports = router;
