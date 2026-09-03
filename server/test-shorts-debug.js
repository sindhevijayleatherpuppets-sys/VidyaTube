const https = require("https");
require("dotenv").config();

const apiKey = process.env.YOUTUBE_API_KEY;
console.log("Using API Key:", apiKey ? `${apiKey.slice(0, 8)}...` : "NONE");

const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&maxResults=20&q=%23shorts&key=${apiKey}`;

https.get(url, (res) => {
  let raw = "";
  res.on("data", (c) => (raw += c));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    try {
      const data = JSON.parse(raw);
      console.log("Items count:", data.items?.length);
      console.log("First item:", data.items?.[0]);
      if (data.error) console.log("Error details:", data.error);
    } catch (e) {
      console.log("Raw:", raw);
    }
  });
});
