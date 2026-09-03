const http = require("http");

async function test() {
  // 1. Search for "telugu movies"
  console.log("Searching 'telugu movies'...");
  const searchRes = await new Promise((resolve) => {
    http.get("http://localhost:5000/api/youtube/search?q=telugu+movies", (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => resolve(JSON.parse(raw)));
    });
  });

  const firstVid = searchRes.videos?.[0];
  console.log("First video from search:", firstVid);

  if (firstVid) {
    console.log("\nFetching details for ID:", firstVid._id);
    const detailRes = await new Promise((resolve) => {
      http.get(`http://localhost:5000/api/youtube/videos/${firstVid._id}`, (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      });
    });

    console.log("Detail response status:", detailRes.status);
    console.log("Detail response data:", detailRes.data);
  }
}

test().catch(console.error);
