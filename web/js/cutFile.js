const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB
const THREAD_NUMBER = navigator.hardwareConcurrency || 4; // 当前设备支持的逻辑处理器（CPU核心）数量

/**
 * 切割文件
 * @param {File} file 文件对象
 * @param {Array<number>} uploadedChunks 已上传的切片索引
 * @returns {Promise<object>} 切片信息
 * @description 利用Web worker并行切割文件
 */
export function cutFile(file, uploadedChunks, uploadCallback) {
  return new Promise((resolve, reject) => {
    const numChunks = Math.ceil(file.size / CHUNK_SIZE); // 切片个数
    const threadRanges = distributeChunks(numChunks, THREAD_NUMBER); // 切片分配给每个线程的范围

    threadRanges.forEach(({ start, end }, index) => {
      // 创建Web Worker, 并将切片任务交给它
      const worker = new Worker("./js/hash-worker.js");
      worker.onerror = (err) => console.log("worker error: ", index, err);
      worker.postMessage({ file, CHUNK_SIZE, start, end, uploadedChunks });

      // 记录当前Web Worker正在处理的切片数量
      let activeChunks = end - start;

      // 监听Web Worker的消息
      worker.onmessage = (event) => {
        // 所有切片任务完成，关闭Web Worker
        if (activeChunks === 0) {
          worker.terminate();
        }

        uploadCallback(event.data, numChunks);
      };
    });

    resolve();
  });
}

/**
 * 计算分配给每个线程的切片范围
 * @param {number} numChunks 总切片数
 * @param {number} numThreads 总线程数
 * @returns {Array<{start: number, end: number}>} 切片范围数组
 */
function distributeChunks(numChunks, numThreads) {
  // 计算每个线程应该处理的切片数量
  const chunksPerThread = Math.floor(numChunks / numThreads);
  // 计算最后一个线程可能需要处理的额外切片数量
  const extraChunks = numChunks % numThreads;
  let startIndex = 0;

  // 创建一个数组来存储每个线程的任务范围
  const threadRanges = [];

  for (let i = 0; i < numThreads; i++) {
    // 如果已经分配完所有切片，则停止分配
    if (startIndex >= numChunks) {
      break;
    }
    // 计算当前线程的结束索引
    let endIndex = startIndex + chunksPerThread + (i < extraChunks ? 1 : 0);
    // 确保结束索引不会超过总切片数
    endIndex = Math.min(endIndex, numChunks);
    // 将任务范围添加到数组中
    threadRanges.push({ start: startIndex, end: endIndex });
    // 更新下一个线程的起始索引
    startIndex = endIndex;
  }

  return threadRanges;
}
