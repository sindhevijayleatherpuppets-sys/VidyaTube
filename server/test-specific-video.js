const http = require("http");

http.get("http://localhost:5000/api/youtube/videos/yt_wP623vgtbIE", (res) => {
  let raw = "";
  res.on("data", (c) => (raw += c));
  res.on("end", () => {
    console.log("Status for yt_wP623vgtbIE:", res.statusCode);
    console.log("Response:", raw);
  });
});

http.get("http://localhost:5000/api/youtube/videos/wP623vgtbIE", (res) => {
  let raw = "";
  res.on("data", (c) => (raw += c));
  res.on("end", () => {
    console.log("Status for wP623vgtbIE:", res.statusCode);
    console.log("Response:", raw);
  });
});
