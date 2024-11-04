importScripts("spark-md5.min.js");

onmessage = async (event) => {
  const { file, CHUNK_SIZE, start, end, uploadedChunks } = event.data;

  for (let i = start; i < end; i++) {
    let chunk;

    // 如果该chunk已经上传过，则直接添加到结果中
    if (uploadedChunks.includes(i)) {
      chunk = {
        chunkIndex: i,
        isUploaded: true
      };
    } else {
      chunk = await createChunk(file, i, CHUNK_SIZE);
    }

    postMessage(chunk);
  }
};

/**
 * 创建一个切片
 * @param {File} file 文件对象
 * @param {number} index chunk的索引
 * @param {number} chunkSize chunk的大小
 * @returns
 */
async function createChunk(file, index, chunkSize) {
  return new Promise((resolve) => {
    const start = index * chunkSize;
    const end = start + chunkSize;
    const reader = new FileReader();
    const blob = file.slice(start, end);
    const spark = new SparkMD5.ArrayBuffer();

    // 当读取完成后，计算md5值，并返回结果
    reader.onload = (event) => {
      spark.append(event.target.result);

      resolve({
        chunkIndex: index,
        chunkHash: spark.end(),
        chunkBlob: blob,
        isUploaded: false
      });
    };

    // 开始读取切片
    reader.readAsArrayBuffer(blob);
  });
}
