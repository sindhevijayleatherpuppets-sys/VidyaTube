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

  // 2. Create Real Top YouTube Blockbuster Videos
  const sampleVideos = [
    {
      title: "Pushpa 2: The Rule - Official Theatrical Trailer (Telugu) | Allu Arjun | Sukumar | Rashmika",
      description: "Witness the roaring rage of Pushpa Raj! The much anticipated action powerhouse Pushpa 2: The Rule directed by Sukumar, starring Icon Star Allu Arjun, Rashmika Mandanna, Fahadh Faasil. Music by Devi Sri Prasad.",
      category: "Entertainment",
      duration: "03:15",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "1kVK0MZlbI4",
      embedUrl: "https://www.youtube-nocookie.com/embed/1kVK0MZlbI4?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=1kVK0MZlbI4",
      thumbnailUrl: "https://i.ytimg.com/vi/1kVK0MZlbI4/hqdefault.jpg",
      tags: ["pushpa2", "alluarjun", "telugu", "trailer", "tollywood"],
      channel: techflow._id,
      views: 110500000,
      likes: [admin._id, alice._id, bob._id],
    },
    {
      title: "Kalki 2898 AD - Official Release Trailer | Prabhas | Amitabh Bachchan | Kamal Haasan | Deepika",
      description: "The future has arrived. From the world of Nag Ashwin, starring Rebel Star Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone, and Disha Patani. Music by Santhosh Narayanan.",
      category: "Entertainment",
      duration: "02:50",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "kQDd1AhGIHk",
      embedUrl: "https://www.youtube-nocookie.com/embed/kQDd1AhGIHk?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=kQDd1AhGIHk",
      thumbnailUrl: "https://i.ytimg.com/vi/kQDd1AhGIHk/hqdefault.jpg",
      tags: ["kalki2898ad", "prabhas", "kalki", "trailer", "telugu"],
      channel: techflow._id,
      views: 86400000,
      likes: [admin._id, alice._id, gamerzone._id],
    },
    {
      title: "Devara Part 1 - Fear Song Official Video | Jr NTR | Janhvi Kapoor | Anirudh Ravichander",
      description: "Feel the electrifying beats of Anirudh! Devara Part 1 starring Man of Masses Jr NTR, Janhvi Kapoor, Saif Ali Khan, directed by Koratala Siva.",
      category: "Music",
      duration: "03:40",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "NcCYq3bvlJM",
      embedUrl: "https://www.youtube-nocookie.com/embed/NcCYq3bvlJM?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=NcCYq3bvlJM",
      thumbnailUrl: "https://i.ytimg.com/vi/NcCYq3bvlJM/hqdefault.jpg",
      tags: ["devara", "jrntr", "anirudh", "fearsong", "music"],
      channel: lofi._id,
      views: 98000000,
      likes: [admin._id, bob._id, lofi._id],
    },
    {
      title: "Salaar: Part 1 - CeaseFire Action Trailer | Prabhas | Prithviraj | Prashanth Neel",
      description: "From the visionary director of KGF, Prashanth Neel, comes the violent powerhouse Salaar: Part 1 - CeaseFire starring Rebel Star Prabhas and Prithviraj Sukumaran.",
      category: "Entertainment",
      duration: "03:50",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "Pr2jBvbiy04",
      embedUrl: "https://www.youtube-nocookie.com/embed/Pr2jBvbiy04?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=Pr2jBvbiy04",
      thumbnailUrl: "https://i.ytimg.com/vi/Pr2jBvbiy04/hqdefault.jpg",
      tags: ["salaar", "prabhas", "prashanthneel", "trailer", "action"],
      channel: gamerzone._id,
      views: 145000000,
      likes: [admin._id, alice._id, bob._id, techflow._id],
    },
    {
      title: "Guntur Kaaram - Kurchi Madathapetti Full Video Song | Mahesh Babu | Sreeleela | Thaman S",
      description: "Superstar Mahesh Babu and Sreeleela set the dance floor on fire with the mass anthem Kurchi Madathapetti, composed by S Thaman from Guntur Kaaram.",
      category: "Music",
      duration: "04:12",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "q8M6Ybjr2Wc",
      embedUrl: "https://www.youtube-nocookie.com/embed/q8M6Ybjr2Wc?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=q8M6Ybjr2Wc",
      thumbnailUrl: "https://i.ytimg.com/vi/q8M6Ybjr2Wc/hqdefault.jpg",
      tags: ["gunturkaaram", "maheshbabu", "kurchimadathapetti", "thamans", "telugu"],
      channel: lofi._id,
      views: 215000000,
      likes: [admin._id, alice._id, techflow._id],
    },
    {
      title: "Game Changer - Jaragandi Song (Telugu) | Ram Charan | Kiara Advani | Shankar | Thaman S",
      description: "Mega Power Star Ram Charan and Kiara Advani groove to the high-energy mass beats of Jaragandi from Director Shankar's Game Changer. Music by Thaman S.",
      category: "Music",
      duration: "04:30",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "OXe7N7-xMKM",
      embedUrl: "https://www.youtube-nocookie.com/embed/OXe7N7-xMKM?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=OXe7N7-xMKM",
      thumbnailUrl: "https://i.ytimg.com/vi/OXe7N7-xMKM/hqdefault.jpg",
      tags: ["gamechanger", "ramcharan", "jaragandi", "shankar", "telugu"],
      channel: lofi._id,
      views: 74500000,
      likes: [admin._id, bob._id],
    },
    {
      title: "MrBeast - $1 vs $1,000,000,000 Yacht! World Record Experience",
      description: "We rented the most expensive yacht on earth! From a $1 rowboat to a billion-dollar super yacht with helicopters and submersibles.",
      category: "Entertainment",
      duration: "20:15",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "48h57PspBec",
      embedUrl: "https://www.youtube-nocookie.com/embed/48h57PspBec?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=48h57PspBec",
      thumbnailUrl: "https://i.ytimg.com/vi/48h57PspBec/hqdefault.jpg",
      tags: ["mrbeast", "entertainment", "challenge", "yacht", "viral"],
      channel: alice._id,
      views: 340000000,
      likes: [admin._id, alice._id, bob._id, techflow._id, gamerzone._id],
    },
    {
      title: "Grand Theft Auto VI (GTA 6) - Official First Look Trailer 4K 60FPS",
      description: "Welcome back to Vice City! Rockstar Games presents the official trailer for Grand Theft Auto VI. Pushing next-generation graphics and open-world gameplay to new frontiers.",
      category: "Gaming",
      duration: "01:31",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "QdBZY2fkU-0",
      embedUrl: "https://www.youtube-nocookie.com/embed/QdBZY2fkU-0?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=QdBZY2fkU-0",
      thumbnailUrl: "https://i.ytimg.com/vi/QdBZY2fkU-0/hqdefault.jpg",
      tags: ["gta6", "gaming", "rockstargames", "vicecity", "trailer"],
      channel: gamerzone._id,
      views: 235000000,
      likes: [admin._id, bob._id, gamerzone._id],
    },
    {
      title: "Hanu-Man - Official Theatrical Trailer (Telugu) | Teja Sajja | Prasanth Varma",
      description: "The Indian superhero epic! Hanu-Man written and directed by Prasanth Varma, starring Teja Sajja, Amritha Aiyer, Varalaxmi Sarathkumar.",
      category: "Entertainment",
      duration: "03:30",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "MKqJBhOgapM",
      embedUrl: "https://www.youtube-nocookie.com/embed/MKqJBhOgapM?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=MKqJBhOgapM",
      thumbnailUrl: "https://i.ytimg.com/vi/MKqJBhOgapM/hqdefault.jpg",
      tags: ["hanuman", "tejasajja", "superhero", "trailer", "telugu"],
      channel: techflow._id,
      views: 62000000,
      likes: [admin._id, alice._id],
    },
    {
      title: "Apple iPhone 16 Pro & Pro Max Reveal & Official Film",
      description: "The complete in-depth look at Apple's newest flagship: Camera Control button, Apple Intelligence, A18 Pro silicon benchmarks, and titanium design.",
      category: "Technology",
      duration: "01:45",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "70gCxCTpvBg",
      embedUrl: "https://www.youtube-nocookie.com/embed/70gCxCTpvBg?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=70gCxCTpvBg",
      thumbnailUrl: "https://i.ytimg.com/vi/70gCxCTpvBg/hqdefault.jpg",
      tags: ["apple", "iphone16", "mkbhd", "tech", "technology"],
      channel: techflow._id,
      views: 15200000,
      likes: [admin._id, bob._id, techflow._id],
    },
    {
      title: "OG (They Call Him OG) - Official Teaser | Pawan Kalyan | Sujeeth | Thaman S",
      description: "Power Star Pawan Kalyan in and as OG! Directed by Sujeeth, produced by DVV Danayya. A relentless storm of action, style, and mass swagger.",
      category: "Entertainment",
      duration: "02:10",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "_8J8LwoVH_0",
      embedUrl: "https://www.youtube-nocookie.com/embed/_8J8LwoVH_0?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=_8J8LwoVH_0",
      thumbnailUrl: "https://i.ytimg.com/vi/_8J8LwoVH_0/hqdefault.jpg",
      tags: ["og", "pawankalyan", "hungrycheetah", "sujeeth", "telugu"],
      channel: gamerzone._id,
      views: 58000000,
      likes: [admin._id, alice._id, gamerzone._id],
    },
    {
      title: "Interstellar - Official Movie Trailer (Christopher Nolan)",
      description: "One of the greatest cinematic achievements in history. Christopher Nolan's masterpiece Interstellar starring Matthew McConaughey and Anne Hathaway.",
      category: "Science",
      duration: "02:30",
      isShort: false,
      source: "youtube",
      youtubeVideoId: "zSWdZVtXT7E",
      embedUrl: "https://www.youtube-nocookie.com/embed/zSWdZVtXT7E?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      thumbnailUrl: "https://i.ytimg.com/vi/zSWdZVtXT7E/hqdefault.jpg",
      tags: ["interstellar", "science", "hanszimmer", "space", "cinema"],
      channel: techflow._id,
      views: 44000000,
      likes: [admin._id, bob._id, techflow._id],
    },
  ];

  // 3. Create Real YouTube Shorts
  const sampleShorts = [
    {
      title: "Luis Fonsi - Despacito Viral Acoustic Vibe #Shorts",
      description: "The global Latin anthem in a pure acoustic vibe! #shorts #music #despacito",
      category: "Music",
      duration: "00:58",
      isShort: true,
      source: "youtube",
      youtubeVideoId: "kJQP7kiw5Fk",
      embedUrl: "https://www.youtube-nocookie.com/embed/kJQP7kiw5Fk?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
      tags: ["shorts", "music", "despacito", "viral"],
      channel: lofi._id,
      views: 82000000,
      likes: [admin._id, alice._id],
    },
    {
      title: "Queen - Bohemian Rhapsody Live Stadium Performance #Shorts",
      description: "Freddie Mercury's timeless stadium energy! #shorts #rock #queen #music",
      category: "Music",
      duration: "00:50",
      isShort: true,
      source: "youtube",
      youtubeVideoId: "fJ9rUzIMcZQ",
      embedUrl: "https://www.youtube-nocookie.com/embed/fJ9rUzIMcZQ?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      thumbnailUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
      tags: ["shorts", "queen", "rock", "legend"],
      channel: lofi._id,
      views: 45000000,
      likes: [admin._id, bob._id],
    },
    {
      title: "Virat Kohli's Iconic 82* vs Pakistan - Two Unbelievable 6s #Shorts",
      description: "Shot of the century! Rewind Virat Kohli's legendary straight six off Haris Rauf at MCG. #shorts #cricket #viratkohli",
      category: "Sports",
      duration: "00:55",
      isShort: true,
      source: "youtube",
      youtubeVideoId: "kXYiU_JCYtU",
      embedUrl: "https://www.youtube-nocookie.com/embed/kXYiU_JCYtU?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=kXYiU_JCYtU",
      thumbnailUrl: "https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg",
      tags: ["shorts", "cricket", "viratkohli", "sports"],
      channel: gamerzone._id,
      views: 65000000,
      likes: [admin._id, alice._id, bob._id],
    },
    {
      title: "This AI Robot Just Solved a Rubik's Cube in 0.3 Seconds! 🤖⚡ #Shorts",
      description: "Mindblowing ultra-high speed robotics and computer vision in action! #shorts #robotics #ai",
      category: "Science",
      duration: "00:25",
      isShort: true,
      source: "youtube",
      youtubeVideoId: "3JZ_D3ELwOQ",
      embedUrl: "https://www.youtube-nocookie.com/embed/3JZ_D3ELwOQ?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
      thumbnailUrl: "https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg",
      tags: ["shorts", "ai", "robotics", "speed"],
      channel: techflow._id,
      views: 32000000,
      likes: [admin._id, techflow._id],
    },
    {
      title: "Unbelievable 1v5 Clutch in Valorant Radiant Lobby 🎯🔥 #Shorts",
      description: "Never give up when the spike is ticking! #shorts #gaming #valorant #esports",
      category: "Gaming",
      duration: "00:45",
      isShort: true,
      source: "youtube",
      youtubeVideoId: "JGwWNGJdvx8",
      embedUrl: "https://www.youtube-nocookie.com/embed/JGwWNGJdvx8?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
      thumbnailUrl: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
      tags: ["shorts", "gaming", "valorant", "clutch"],
      channel: gamerzone._id,
      views: 18900000,
      likes: [admin._id, gamerzone._id],
    },
    {
      title: "Mindblowing Smartphone Camera Illusion Trick 📱✨ #Shorts",
      description: "How to shoot cinematic transitions using just your phone! #shorts #filmmaking #tech",
      category: "Technology",
      duration: "00:40",
      isShort: true,
      source: "youtube",
      youtubeVideoId: "9bZkp7q19f0",
      embedUrl: "https://www.youtube-nocookie.com/embed/9bZkp7q19f0?autoplay=1&enablejsapi=1",
      videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      thumbnailUrl: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
      tags: ["shorts", "tech", "mobile", "camera"],
      channel: alice._id,
      views: 24000000,
      likes: [admin._id, alice._id],
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
