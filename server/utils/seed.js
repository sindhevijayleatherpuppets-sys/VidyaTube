require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Video = require("../models/Video");
const Comment = require("../models/Comment");
const Subscription = require("../models/Subscription");
const CommunityPost = require("../models/CommunityPost");
const Notification = require("../models/Notification");

const DEMO_PASSWORD = "Password123";

// High quality reliable web streams for instantaneous playback
const SAMPLE_STREAMS = {
  tech1: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  tech2: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  music: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  gaming1: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  gaming2: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  edu: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
  science: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  sintel: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  subaru: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
  tears: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  weAreGoingOnBullrun: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  whatCarCanYouGet: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
};

const seedDatabase = async () => {
  console.log("Clearing existing data...");
  await User.deleteMany({});
  await Video.deleteMany({});
  await Comment.deleteMany({});
  await Subscription.deleteMany({});
  await CommunityPost.deleteMany({});
  await Notification.deleteMany({});

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Create Users / Creators
  const admin = await User.create({
    fullName: "Admin",
    email: "admin@vidytube.com",
    password: hashed,
    role: "admin",
    handle: "@admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80",
    bio: "Official VidyTube Platform Administrator & Curator.",
    subscriberCount: 24500,
  });

  const alice = await User.create({
    fullName: "Alice Creator",
    email: "alice@vidytube.com",
    password: hashed,
    role: "user",
    handle: "@alicecreates",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
    bio: "Web developer, UI/UX enthusiast, and digital artist. New tech videos every week!",
    subscriberCount: 89200,
  });

  const bob = await User.create({
    fullName: "Bob Coder",
    email: "bob@vidytube.com",
    password: hashed,
    role: "user",
    handle: "@bobdev",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=80",
    bio: "Full-Stack Software Engineer building scalable microservices and cloud backends.",
    subscriberCount: 43100,
  });

  const techflow = await User.create({
    fullName: "TechFlow Hub",
    email: "techflow@vidytube.com",
    password: hashed,
    role: "user",
    handle: "@techflow",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=80",
    bio: "The pulse of next-generation gadgets, AI models, hardware reviews, and breakdowns.",
    subscriberCount: 152000,
  });

  const gamerzone = await User.create({
    fullName: "GamerZone Live",
    email: "gamerzone@vidytube.com",
    password: hashed,
    role: "user",
    handle: "@gamerzone",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80",
    bio: "Pro esports highlights, AAA game walkthroughs, and high-FPS benchmarks.",
    subscriberCount: 210000,
  });

  const lofi = await User.create({
    fullName: "LoFi Chill Beats",
    email: "lofi@vidytube.com",
    password: hashed,
    role: "user",
    handle: "@lofichill",
    avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    bio: "24/7 relaxing lo-fi hip hop, synthwave beats to study, code, and relax to.",
    subscriberCount: 340000,
  });

  // Subscriptions
  await Subscription.create([
    { subscriber: admin._id, channel: alice._id },
    { subscriber: admin._id, channel: techflow._id },
    { subscriber: admin._id, channel: gamerzone._id },
    { subscriber: alice._id, channel: bob._id },
    { subscriber: bob._id, channel: techflow._id },
  ]);

  // 2. Create Standard YouTube Videos
  const sampleVideos = [
    {
      title: "Building a Modern Full-Stack YouTube Clone with React & Node.js",
      description: `In this complete crash course, we build a production-ready video streaming platform from scratch!
Chapters:
0:00 - Introduction & Demo
1:45 - Architecture & System Design
5:20 - Backend Express REST API
12:10 - React 18 & Cinema Player
18:30 - Nested Comment Threads & Polls
24:00 - Testing & Deployment

#webdev #reactjs #nodejs #programming #fullstack`,
      category: "Technology",
      duration: "24:35",
      tags: ["react", "nodejs", "webdev", "javascript", "fullstack"],
      channel: alice._id,
      videoUrl: SAMPLE_STREAMS.tech1,
      thumbnailUrl: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&auto=format&fit=crop&q=80",
      views: 142800,
      likes: [admin._id, bob._id, techflow._id],
    },
    {
      title: "Next-Gen AI & Machine Learning Breakdown in 2026",
      description: "Everything you need to know about the latest breakthroughs in agentic coding, deep reasoning, and synthetic cognition architectures. #ai #tech #future",
      category: "Science",
      duration: "15:42",
      tags: ["ai", "machinelearning", "science", "future", "tech"],
      channel: techflow._id,
      videoUrl: SAMPLE_STREAMS.tech2,
      thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80",
      views: 289400,
      likes: [admin._id, alice._id],
    },
    {
      title: "Lo-Fi Beats to Relax / Study / Code To [Synthwave Mix]",
      description: "Atmospheric and soothing retro synthesizer sounds crafted for deep concentration, night coding sessions, and peaceful study routines.",
      category: "Music",
      duration: "45:00",
      tags: ["lofi", "chill", "music", "coding", "study"],
      channel: lofi._id,
      videoUrl: SAMPLE_STREAMS.music,
      thumbnailUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80",
      views: 520000,
      likes: [admin._id, alice._id, bob._id, techflow._id, gamerzone._id],
    },
    {
      title: "Unreal Engine 5.5 Next-Gen Graphics Showcase & Ray-Tracing Benchmark",
      description: "Pushing photorealism to the absolute extreme! 4K 60FPS ultra high settings benchmark on RTX 5090. #gaming #graphics #unrealengine",
      category: "Gaming",
      duration: "18:20",
      tags: ["gaming", "unrealengine", "raytracing", "benchmark", "4k"],
      channel: gamerzone._id,
      videoUrl: SAMPLE_STREAMS.gaming1,
      thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
      views: 310500,
      likes: [admin._id, bob._id],
    },
    {
      title: "Mastering TypeScript Generics & High-Performance Design Patterns",
      description: "Level up your TypeScript skills! Learn conditional types, keyof index accessors, utility types, and clean architectural patterns. #typescript #coding",
      category: "Education",
      duration: "21:15",
      tags: ["typescript", "javascript", "coding", "education", "tutorial"],
      channel: bob._id,
      videoUrl: SAMPLE_STREAMS.edu,
      thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      views: 94300,
      likes: [alice._id, techflow._id],
    },
    {
      title: "Cyberpunk 2077 Night City Cinematic Tour in 8K Ultra",
      description: "An immersive atmospheric night ride across the neon streets of Night City with path tracing and DLSS 4.0 enabled. #cyberpunk #cinematic #gaming",
      category: "Gaming",
      duration: "12:50",
      tags: ["cyberpunk", "gaming", "nightcity", "cinematic", "scifi"],
      channel: gamerzone._id,
      videoUrl: SAMPLE_STREAMS.gaming2,
      thumbnailUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80",
      views: 185000,
      likes: [admin._id, bob._id],
    },
    {
      title: "James Webb Space Telescope Reveals Stunning Cosmic Structures",
      description: "Astrophysicists unveil unprecedented deep-field imagery of primordial galaxies and stellar nurseries. #space #science #astronomy",
      category: "Science",
      duration: "16:40",
      tags: ["space", "astronomy", "science", "jwst", "universe"],
      channel: techflow._id,
      videoUrl: SAMPLE_STREAMS.science,
      thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
      views: 420800,
      likes: [admin._id, alice._id, techflow._id],
    },
    {
      title: "Top 10 Programmers vs Normal People Moments (Funny Compilation)",
      description: "Relatable coding humor, merge conflict panic, and debugging on production on a Friday afternoon! #comedy #programming #humor",
      category: "Comedy",
      duration: "08:15",
      tags: ["comedy", "funny", "programming", "memes", "humor"],
      channel: alice._id,
      videoUrl: SAMPLE_STREAMS.sintel,
      thumbnailUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
      views: 672000,
      likes: [admin._id, bob._id, techflow._id],
    },
    {
      title: "Formula 1 2026 Season Technical Regulations & Aerodynamic Secrets",
      description: "A comprehensive deep dive into the active aerodynamics, turbo-hybrid powertrains, and suspension overhauls for the 2026 season. #f1 #racing #sports",
      category: "Sports",
      duration: "14:10",
      tags: ["f1", "formula1", "sports", "racing", "automotive"],
      channel: techflow._id,
      videoUrl: SAMPLE_STREAMS.subaru,
      thumbnailUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80",
      views: 198000,
      likes: [admin._id, gamerzone._id],
    },
    {
      title: "Epic Animated Sci-Fi Short Film: Tears of Steel [4K Remaster]",
      description: "In a dystopian future, a group of scientists and warriors assemble at the Oude Kerk in Amsterdam to save what remains of mankind.",
      category: "Entertainment",
      duration: "12:14",
      tags: ["scifi", "animation", "shortfilm", "entertainment", "action"],
      channel: alice._id,
      videoUrl: SAMPLE_STREAMS.tears,
      thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
      views: 890000,
      likes: [admin._id, bob._id, lofi._id],
    },
    {
      title: "Global Tech Summit 2026 Keynote & Quantum Computing Highlights",
      description: "Live coverage and analysis of key announcements in silicon quantum processors, photonics, and renewable datacenters.",
      category: "News",
      duration: "28:50",
      tags: ["news", "tech", "quantum", "datacenter", "keynote"],
      channel: techflow._id,
      videoUrl: SAMPLE_STREAMS.weAreGoingOnBullrun,
      thumbnailUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
      views: 115000,
      likes: [admin._id, alice._id],
    },
    {
      title: "Ultimate Roadtrip Across the Rocky Mountains in 4K HDR",
      description: "Epic aerial drone photography, mountain passes, alpine lakes, and wildlife documentary footage.",
      category: "Entertainment",
      duration: "19:30",
      tags: ["travel", "nature", "mountains", "drone", "4k"],
      channel: bob._id,
      videoUrl: SAMPLE_STREAMS.whatCarCanYouGet,
      thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
      views: 245000,
      likes: [admin._id, lofi._id],
    },
  ];

  // 3. Create YouTube Shorts
  const sampleShorts = [
    {
      title: "CSS Tricks Nobody Told You About! 🤯 #shorts #css #webdev",
      description: "Transform your styling with CSS container queries, subgrid, and color-mix! #shorts #programming",
      category: "Technology",
      duration: "00:48",
      isShort: true,
      tags: ["shorts", "css", "webdev", "quicktips"],
      channel: alice._id,
      videoUrl: SAMPLE_STREAMS.tech1,
      thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
      views: 890000,
      likes: [admin._id, bob._id, techflow._id],
    },
    {
      title: "When the junior developer pushes directly to main branch 😂 #shorts",
      description: "Panic in the dev team chat! #shorts #humor #devlife",
      category: "Comedy",
      duration: "00:35",
      isShort: true,
      tags: ["shorts", "comedy", "developer", "relatable"],
      channel: bob._id,
      videoUrl: SAMPLE_STREAMS.tech2,
      thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
      views: 1450000,
      likes: [admin._id, alice._id, techflow._id],
    },
    {
      title: "This AI robot just solved a Rubik's cube in 0.3 seconds! 🤖⚡ #shorts",
      description: "High speed computer vision in action! #shorts #robotics #ai",
      category: "Science",
      duration: "00:25",
      isShort: true,
      tags: ["shorts", "ai", "robotics", "speed"],
      channel: techflow._id,
      videoUrl: SAMPLE_STREAMS.science,
      thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
      views: 2300000,
      likes: [admin._id, gamerzone._id],
    },
    {
      title: "Insane Clutch 1v5 in Valorant Ranked! 🎯🔥 #shorts #gaming",
      description: "Never give up when the timer is ticking down! #shorts #valorant #esports",
      category: "Gaming",
      duration: "00:52",
      isShort: true,
      tags: ["shorts", "gaming", "valorant", "clutch"],
      channel: gamerzone._id,
      videoUrl: SAMPLE_STREAMS.gaming1,
      thumbnailUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80",
      views: 1890000,
      likes: [admin._id, alice._id, bob._id],
    },
    {
      title: "10-Second Lo-Fi Guitar Melody for Deep Focus 🎸🎧 #shorts",
      description: "Quick audio vibe check for relaxing your mind. #shorts #music #guitar",
      category: "Music",
      duration: "00:30",
      isShort: true,
      tags: ["shorts", "lofi", "guitar", "chill"],
      channel: lofi._id,
      videoUrl: SAMPLE_STREAMS.music,
      thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
      views: 760000,
      likes: [admin._id, alice._id],
    },
    {
      title: "Clean Desk Setup Tour & Cable Management Secrets ✨ #shorts",
      description: "Minimalist workspace inspiration for productivity. #shorts #workspace",
      category: "Technology",
      duration: "00:42",
      isShort: true,
      tags: ["shorts", "setup", "minimalism", "tech"],
      channel: alice._id,
      videoUrl: SAMPLE_STREAMS.edu,
      thumbnailUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
      views: 1120000,
      likes: [admin._id, techflow._id],
    },
  ];

  const insertedVideos = await Video.insertMany([...sampleVideos, ...sampleShorts]);
  const mainVideo = insertedVideos[0];

  // 4. Create Comments with Nested Replies on the main video
  const rootComment1 = await Comment.create({
    video: mainVideo._id,
    user: bob._id,
    text: "Phenomenal tutorial Alice! The explanation of the video streaming pipeline and reactive player state was crystal clear. 👏🚀",
    isPinned: true,
    likes: [admin._id, techflow._id],
  });

  await Comment.create({
    video: mainVideo._id,
    user: alice._id,
    parentId: rootComment1._id,
    text: "Thanks so much Bob! Glad you found the player architecture helpful. More full-stack projects coming soon!",
    likes: [admin._id, bob._id],
  });

  const rootComment2 = await Comment.create({
    video: mainVideo._id,
    user: techflow._id,
    text: "The UI design in this video platform looks so sleek and responsive. Outstanding work!",
    likes: [alice._id],
  });

  await Comment.create({
    video: mainVideo._id,
    user: admin._id,
    parentId: rootComment2._id,
    text: "Agreed! The custom controls and YouTube Shorts integration feel super smooth.",
    likes: [alice._id, techflow._id],
  });

  // 5. Create Community Posts with Interactive Polls
  await CommunityPost.create([
    {
      channel: alice._id,
      text: "🎉 Hey everyone! We just crossed 85K subscribers on VidyTube! What tutorial should I build next?",
      pollOptions: [
        { text: "Full-Stack E-Commerce with Stripe & Next.js", votes: [admin._id, bob._id] },
        { text: "Real-Time Chat App with WebSockets & WebRTC", votes: [techflow._id] },
        { text: "AI Agent Platform with Python & LangChain", votes: [gamerzone._id] },
        { text: "Mobile App with React Native & Expo", votes: [] },
      ],
      likes: [admin._id, bob._id, techflow._id],
    },
    {
      channel: techflow._id,
      text: "🚨 Major tech breakdown drops tomorrow! Are you excited for the new generation of AI hardware chips?",
      pollOptions: [
        { text: "Yes! Can't wait 🔥", votes: [admin._id, alice._id, bob._id] },
        { text: "More interested in quantum computing", votes: [] },
        { text: "Just want better battery life ⚡", votes: [gamerzone._id] },
      ],
      likes: [admin._id, alice._id],
    },
  ]);

  // 6. Create Initial Notifications
  await Notification.create([
    {
      recipient: admin._id,
      sender: alice._id,
      type: "new_video",
      video: mainVideo._id,
      message: "Alice Creator uploaded: Building a Modern Full-Stack YouTube Clone",
    },
    {
      recipient: admin._id,
      sender: techflow._id,
      type: "new_video",
      video: insertedVideos[1]._id,
      message: "TechFlow Hub uploaded: Next-Gen AI & Machine Learning Breakdown in 2026",
    },
    {
      recipient: admin._id,
      sender: bob._id,
      type: "subscribe",
      message: "Bob Coder subscribed to your channel!",
    },
  ]);

  console.log("--------------------------------------------------");
  console.log("✅ VidyTube database seeded successfully with A-to-Z YouTube features!");
  console.log("   - 12 High-Definition multi-category videos");
  console.log("   - 6 YouTube Shorts");
  console.log("   - 6 Channels with avatars & banners");
  console.log("   - Pinned comments and nested replies");
  console.log("   - Interactive Community posts with live polls");
  console.log("   - Real working streamable MP4 media streams");
  console.log("--------------------------------------------------");
  console.log("Admin login:  admin@vidytube.com  / " + DEMO_PASSWORD);
  console.log("Creator 1:    alice@vidytube.com  / " + DEMO_PASSWORD);
  console.log("Creator 2:    bob@vidytube.com    / " + DEMO_PASSWORD);
  console.log("--------------------------------------------------");
};

const run = async () => {
  await connectDB();
  await seedDatabase();
  process.exit(0);
};

if (require.main === module) {
  run().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
