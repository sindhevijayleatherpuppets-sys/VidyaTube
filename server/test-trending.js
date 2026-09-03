const http = require("http");

http.get("http://localhost:5000/api/youtube/trending?regionCode=IN", (res) => {
  let raw = "";
  res.on("data", (chunk) => (raw += chunk));
  res.on("end", () => {
    const data = JSON.parse(raw);
    console.log("Trending Status:", res.statusCode);
    console.log("Trending Live Videos count:", data.videos?.length);
    console.log("First Trending Video Title:", data.videos?.[0]?.title);
    console.log("First Trending Channel:", data.videos?.[0]?.channel?.fullName);
  });
});
