const path = require("path");
const fs = require("fs");

function getUniqueFilename(dir, filename) {
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  let counter = 1;

  let newFilename = filename;
  while (fs.existsSync(path.join(dir, newFilename))) {
    newFilename = `${basename}(${counter})${ext}`;
    counter++;
  }

  return newFilename;
}

module.exports = {
  getUniqueFilename
};
