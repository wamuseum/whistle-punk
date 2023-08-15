const fs = require("fs");
const path = require("path");

function checkHttpUrl(string) {
  let givenURL = false;
  try {
    givenURL = new URL(string);
  } catch (error) {
    return false;
  }
  return (givenURL.protocol === "http:" || givenURL.protocol === "https:") ? givenURL : false;
}

function findCandidateFile(basePath, filePath) {
  if (path.isAbsolute(filePath)) {
    return fs.existsSync(filePath) ? filePath : false;
  }
  else {
    if (fs.existsSync(path.resolve(path.join(basePath,filePath)))) {
      return path.resolve(path.join(basePath, filePath));
    }
    else {
      if (fs.existsSync(path.resolve(path.join(process.cwd(),filePath)))) {
        return path.resolve(path.join(process.cwd(), filePath));
      }
    }
  }
  return false;
}

module.exports = {
  checkHttpUrl,
  findCandidateFile
}