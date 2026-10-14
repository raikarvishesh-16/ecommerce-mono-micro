// Initial seed data shared between monolith and microservices database instances (INR Currency)

const initialProducts = [
  {
    id: "prod-1",
    name: "Aether Pro Wireless ANC Headphones",
    category: "Audio",
    price: 24999,
    rating: 4.9,
    reviewsCount: 128,
    stock: 24,
    description: "Flagship hybrid active noise cancelling over-ear headphones with custom titanium dynamic drivers, lossless spatial audio, and 45-hour battery life.",
    features: ["Hybrid ANC", "45h Battery", "Lossless Audio", "Memory Foam Cushions"],
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-2",
    name: "Chronos OLED Smartwatch v3",
    category: "Wearables",
    price: 18499,
    rating: 4.8,
    reviewsCount: 94,
    stock: 18,
    description: "Next-gen titanium smartwatch featuring sapphire crystal glass, continuous ECG monitoring, multi-band GPS, and 7-day battery life.",
    features: ["Titanium Chassis", "ECG Sensor", "Dual-Band GPS", "50m Water Resist"],
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-3",
    name: "Nebula UltraWide Curved Monitor 34\"",
    category: "Computing",
    price: 54999,
    rating: 4.7,
    reviewsCount: 82,
    stock: 8,
    description: "WQHD 3440x1440 curved gaming and workstation display with 165Hz refresh rate, 1ms response time, 98% DCI-P3 color gamut, and Thunderbolt 4 hub.",
    features: ["34\" Curved 1500R", "165Hz Refresh", "Thunderbolt 4 Hub", "HDR 600"],
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-4",
    name: "Kinesis Pro Mechanical Keyboard",
    category: "Computing",
    price: 12999,
    rating: 4.9,
    reviewsCount: 215,
    stock: 35,
    description: "Custom hot-swappable mechanical keyboard with lubed linear switches, aluminum unibody construction, sound-dampening silicone foam, and RGB underglow.",
    features: ["Hot-Swappable", "CNC Aluminum Case", "PBT Keycaps", "Tri-Mode Wireless"],
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-5",
    name: "Lumina Ambient Smart Light Bar",
    category: "Smart Home",
    price: 7499,
    rating: 4.6,
    reviewsCount: 67,
    stock: 42,
    description: "Dynamic screen-sync ambient light bar with 16 million colors, dual zone controls, smart assistant voice integration, and circadian rhythm scheduling.",
    features: ["Screen Sync", "Matter & Zigbee Support", "16M Colors", "Touch Controls"],
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-6",
    name: "Apex Precision Ergonomic Mouse",
    category: "Computing",
    price: 6999,
    rating: 4.7,
    reviewsCount: 142,
    stock: 29,
    description: "Sculpted ergonomic vertical wireless mouse designed to alleviate wrist strain, equipped with a 26K DPI optical sensor and ultra-quiet switches.",
    features: ["57° Ergonomic Angle", "26,000 DPI Sensor", "Hyper-fast Scroll", "USB-C Fast Charge"],
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80"
  }
];

const initialUsers = [
  {
    id: "user-demo",
    name: "Alex Mercer",
    email: "alex@example.com",
    role: "Architect / Shopper",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    balance: 250000.00
  }
];

module.exports = { initialProducts, initialUsers };
