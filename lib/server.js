const http = require("http");
const {resetWindows} = require("./window");

const requestListener = (req, res) => {
  switch (req.url) {
    case "/reset":
      resetWindows();
      res.writeHead(200);
      res.end('Success\n');
      break;
    case "/reload":
      resetWindows(true, false);
      res.writeHead(200);
      res.end('Success\n');
      break;
    default:
      res.writeHead(404);
      res.end('404 not found\n');
  }
}

const setUpServer = (config) => {
  if (config?.server?.host) {
    const server = http.createServer(requestListener);
    server.listen(config.server.port, config.server.host, () => {
      console.log(`Server is running on http://${config.server.host}:${config.server.port}`);
    })
  }
}

module.exports = {
  setUpServer
};