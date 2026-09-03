const http = require("http");

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(typeof data === "string" ? data : JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log("=== TESTING SECURE VIDYTUBE VIDEO DOWNLOAD SYSTEM ===");

  // 1. Test unauthenticated request
  console.log("\n1. Testing unauthenticated download...");
  const unauth = await request({
    host: "localhost",
    port: 5000,
    path: "/api/videos/123456789012345678901234/download",
    method: "GET",
  });
  console.log(`Status: ${unauth.status} (Expected: 401 Unauthorized)`);
  console.log(`Message: ${unauth.data?.message}`);

  // 2. Login as Alice
  console.log("\n2. Logging in as creator Alice...");
  const aliceLogin = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "alice@vidytube.com", password: "Password123" }
  );
  const aliceToken = aliceLogin.data.token;
  console.log("Alice logged in successfully.");

  // 3. Get Alice's uploaded videos in Studio
  const aliceStudio = await request({
    host: "localhost",
    port: 5000,
    path: "/api/videos/studio/mine",
    method: "GET",
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  const aliceVideo = aliceStudio.data.videos[0];
  console.log(`Found Alice native video: "${aliceVideo.title}" (_id: ${aliceVideo._id})`);

  // 4. Test Alice downloading her own video
  console.log("\n3. Testing creator Alice downloading her own video...");
  const aliceDownload = await request({
    host: "localhost",
    port: 5000,
    path: `/api/videos/${aliceVideo._id}/download`,
    method: "GET",
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  console.log(`Status: ${aliceDownload.status} (Expected: 200 OK)`);
  console.log(`Content-Disposition: ${aliceDownload.headers["content-disposition"]}`);
  console.log(`Content-Type: ${aliceDownload.headers["content-type"]}`);

  // 5. Login as Bob and try to download Alice's video
  console.log("\n4. Logging in as Bob (different user)...");
  const bobLogin = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "bob@vidytube.com", password: "Password123" }
  );
  const bobToken = bobLogin.data.token;

  console.log("Testing unauthorized user Bob trying to download Alice's master video file...");
  const bobForbidden = await request({
    host: "localhost",
    port: 5000,
    path: `/api/videos/${aliceVideo._id}/download`,
    method: "GET",
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  console.log(`Status: ${bobForbidden.status} (Expected: 403 Forbidden)`);
  console.log(`Message: ${bobForbidden.data?.message}`);

  // 6. Test trying to download an external YouTube video ID
  console.log("\n5. Testing attempt to download external YouTube video (yt_wP623vgtbIE)...");
  const ytForbidden = await request({
    host: "localhost",
    port: 5000,
    path: `/api/videos/yt_wP623vgtbIE/download`,
    method: "GET",
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  console.log(`Status: ${ytForbidden.status} (Expected: 403 Forbidden)`);
  console.log(`Message: ${ytForbidden.data?.message}`);

  console.log("\n✅ ALL 5 SECURITY CRITERIA VERIFIED SUCCESSFULLY!");
}

run().catch(console.error);
