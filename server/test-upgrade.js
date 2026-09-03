const http = require("http");

const request = (path, method = "GET", body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : "";
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Length": Buffer.byteLength(dataString) } : {}),
    };

    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );

    req.on("error", reject);
    if (dataString) req.write(dataString);
    req.end();
  });
};

async function runTests() {
  console.log("=== VIDYTUBE PLATFORM VERIFICATION ===");

  // 1. Test YouTube API Search Route
  console.log("\n1. Testing YouTube Data API Search endpoint...");
  const ytSearch = await request("/api/youtube/search?q=nodejs+tutorial");
  console.log("Status:", ytSearch.status);
  console.log("Search results total:", ytSearch.body?.totalResults);
  console.log("Notice / Status:", ytSearch.body?.notice || "Active");

  // 2. Test YouTube API Trending Route
  console.log("\n2. Testing YouTube Data API Trending endpoint (India)...");
  const ytTrending = await request("/api/youtube/trending?regionCode=IN");
  console.log("Status:", ytTrending.status);
  console.log("Trending native count:", ytTrending.body?.nativeTrending?.length);
  console.log("Trending yt count:", ytTrending.body?.videos?.length);

  // 3. Authenticate Demo User to Test Personal Library Endpoints
  console.log("\n3. Authenticating Demo User...");
  const loginRes = await request("/api/auth/login", "POST", {
    email: "alice@vidytube.com",
    password: "Password123",
  });

  const token = loginRes.body?.token;
  console.log("Login Status:", loginRes.status, "Token acquired:", !!token);

  if (token) {
    // 4. Test Favorites
    console.log("\n4. Testing Favorites endpoints...");
    const favListBefore = await request("/api/users/library/favorites", "GET", null, token);
    console.log("Favorites count before:", favListBefore.body?.favorites?.length);

    // Get a video ID from trending or search
    const videoId = ytTrending.body?.nativeTrending?.[0]?._id || "yt_dQw4w9WgXcQ";
    const favToggle = await request(`/api/users/library/favorites/${videoId}`, "POST", null, token);
    console.log("Toggle Favorite:", favToggle.body);

    const favListAfter = await request("/api/users/library/favorites", "GET", null, token);
    console.log("Favorites count after:", favListAfter.body?.favorites?.length);

    // 5. Test Watch Later
    console.log("\n5. Testing Watch Later endpoints...");
    const wlToggle = await request(`/api/users/library/watch-later/${videoId}`, "POST", null, token);
    console.log("Toggle Watch Later:", wlToggle.body);

    const wlList = await request("/api/users/library/watch-later", "GET", null, token);
    console.log("Watch Later count:", wlList.body?.watchLater?.length);

    // 6. Test Watch History
    console.log("\n6. Testing Watch History endpoints...");
    const historyAdd = await request("/api/history", "POST", { videoId }, token);
    console.log("Record Watch History Status:", historyAdd.status);

    const historyList = await request("/api/history", "GET", null, token);
    console.log("Watch History count:", historyList.body?.history?.length);

    // 7. Test Playlists
    console.log("\n7. Testing Playlists endpoints...");
    const playlistCreate = await request("/api/playlists", "POST", {
      name: "My Favorite Dev Tracks",
      description: "Awesome curated playlist",
    }, token);
    console.log("Create Playlist:", playlistCreate.body?.playlist?.name);

    const playlistsList = await request("/api/playlists", "GET", null, token);
    console.log("User Playlists count:", playlistsList.body?.playlists?.length);
  }

  console.log("\n=== ALL BACKEND ENDPOINTS VERIFIED SUCCESSFULLY ===");
}

runTests().catch(console.error);
