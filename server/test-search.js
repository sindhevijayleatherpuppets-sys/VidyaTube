const http = require("http");

const testSearch = (query) => {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    http
      .get(`http://localhost:5000/api/youtube/search?q=${encoded}`, (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      })
      .on("error", reject);
  });
};

async function run() {
  console.log("=== REAL-TIME DYNAMIC SEARCH VERIFICATION ===");
  const queries = ["Telugu songs", "Python tutorial", "Latest technology", "Gaming"];

  for (const q of queries) {
    console.log(`\nQuerying: "${q}"...`);
    const res = await testSearch(q);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Query echoed: ${res.data?.query}`);
    console.log(`Live videos returned: ${res.data?.videos?.length || 0}`);
    console.log(`Notice / Status: ${res.data?.notice || "Active API"}`);
  }
}

run().catch(console.error);
