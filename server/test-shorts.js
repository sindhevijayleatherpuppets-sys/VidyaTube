const http = require("http");

http.get("http://localhost:5000/api/youtube/shorts", (res) => {
  let raw = "";
  res.on("data", (c) => (raw += c));
  res.on("end", () => {
    const data = JSON.parse(raw);
    console.log("Shorts endpoint status:", res.statusCode);
    console.log("Total Shorts returned:", data.shorts?.length);
    console.log("First short:", data.shorts?.[0]);
    console.log("Next page token:", data.nextPageToken);
  });
});
