const http = require("http");

async function test() {
  const vidId = "yt_-zkBGLzTw1Y";
  http.get(`http://localhost:5000/api/youtube/videos/${vidId}`, (res) => {
    let raw = "";
    res.on("data", (c) => (raw += c));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Response:", raw.slice(0, 500));
    });
  });
}

test();
