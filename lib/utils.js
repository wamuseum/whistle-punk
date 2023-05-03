function checkHttpUrl(string) {
  let givenURL = false;
  try {
    givenURL = new URL(string);
  } catch (error) {
    console.log("error is",error)
    return false;
  }
  return (givenURL.protocol === "http:" || givenURL.protocol === "https:") ? givenURL : false;
}

module.exports = {
  checkHttpUrl
}