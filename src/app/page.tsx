"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShieldAlert,
  ScanLine,
  Link as LinkIcon,
  BarChart3,
  MapPin,
  FileWarning,
  Network,
  Siren,
  ArrowRight,
  ArrowLeft,
  Globe,
  Lock,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate hero text
      gsap.fromTo(
        textRef.current?.querySelectorAll("h1 span") || [],
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        textRef.current?.querySelectorAll("p, button") || [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          delay: 0.5,
          ease: "power3.out",
        }
      );

      // Parallax background
      gsap.to(canvasRef.current, {
        y: -100,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animated mesh gradient
    let time = 0;
    const animate = () => {
      time += 0.005;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.sin(time) * 200,
        canvas.height / 2 + Math.cos(time) * 150,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
      );

      gradient.addColorStop(0, "#0f172a"); // slate-900
      gradient.addColorStop(0.4, "#020617"); // slate-950
      gradient.addColorStop(0.7, "#0f172a");
      gradient.addColorStop(1, "#000000");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle grid lines
      ctx.strokeStyle = "#0ea5e915";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="min-h-screen relative overflow-hidden flex items-center"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ background: "#020617" }}
      />

      <div className="container mx-auto px-6 relative z-10 pt-24">
        <div ref={textRef} className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            <span className="block">Protecting Communities</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              with AI-Powered Intelligence
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl">
            A unified platform for fraud detection, cyber incident analysis,
            and public safety reporting. Empowering law enforcement and citizens alike.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <CTAButton
              primary
              text="Launch Dashboard"
              icon={<ArrowRight className="w-5 h-5" />}
            />
            <CTAButton
              text="Learn More"
              icon={<ArrowDown className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
      >
        <ArrowDown className="w-8 h-8" />
      </motion.div>
    </section>
  );
};

const ArrowDown = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);

const CTAButton = ({
  primary = false,
  text,
  icon,
  onClick,
}: {
  primary?: boolean;
  text: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`
      px-8 py-4 rounded-xl font-semibold flex items-center gap-3 
      transition-all duration-300
      ${
        primary
          ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-[0_0_20px_rgba(8,145,178,0.5)]"
          : "bg-slate-900/50 border border-slate-700 text-gray-200 hover:border-cyan-500"
      }
    `}
  >
    {text}
    {icon}
  </motion.button>
);

// --- Features Section ---

const features = [
  {
    icon: <ShieldAlert className="w-8 h-8 text-cyan-400" />,
    title: "Fraud Network Intelligence",
    description:
      "Visualize and analyze complex fraud networks with interactive graph representations.",
    color: "from-cyan-600 to-blue-700",
  },
  {
    icon: <ScanLine className="w-8 h-8 text-emerald-400" />,
    title: "Counterfeit Scanner",
    description:
      "Detect fake currency and documents using AI-powered visual recognition.",
    color: "from-emerald-600 to-green-700",
  },
  {
    icon: <LinkIcon className="w-8 h-8 text-rose-500" />,
    title: "Phishing Disassembler",
    description:
      "Analyze malicious URLs and SMS to identify and neutralize phishing attempts.",
    color: "from-rose-600 to-red-700",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-yellow-400" />,
    title: "Incident Data Visualization",
    description:
      "Explore cyber incident data with beautiful, interactive charts and graphs.",
    color: "from-yellow-600 to-orange-700",
  },
  {
    icon: <MapPin className="w-8 h-8 text-amber-400" />,
    title: "Geospatial Mapping",
    description:
      "Map fraud and incident hotspots with interactive, real-time maps.",
    color: "from-amber-600 to-orange-700",
  },
  {
    icon: <FileWarning className="w-8 h-8 text-cyan-300" />,
    title: "Citizen Incident Report",
    description:
      "Allow citizens to securely report incidents and contribute to public safety.",
    color: "from-cyan-600 to-teal-700",
  },
];

const Features = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feature-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-24 md:py-32 bg-slate-950"
      id="features"
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Powerful Features for Public Safety
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Our platform integrates cutting-edge AI and visualization tools to
            combat modern threats.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <SpotlightCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Spotlight Card Component
const SpotlightCard = ({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) => {
  const router = useRouter();

  return (
    <motion.div
      className="feature-card relative group"
      whileHover={{ y: -10 }}
    >
      <div
        className="
          relative overflow-hidden rounded-2xl p-8 
          bg-gradient-to-b from-slate-900/80 to-slate-950/80 
          border border-slate-800 hover:border-slate-600
          shadow-xl transition-all duration-300
        "
      >
        {/* Background Gradient Overlay */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-br ${feature.color} transition-opacity duration-500`}
        />

        {/* Spotlight Effect */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100">
          <div
            className="absolute inset-px rounded-2xl"
            style={{
              background: `radial-gradient(600px circle at var(--x, 100px) var(--y, 100px), rgba(255,255,255,0.06), transparent 40%)`,
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center justify-center p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            {feature.icon}
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
          <p className="text-gray-400 leading-relaxed mb-6">
            {feature.description}
          </p>
          
          <button
            onClick={() => router.push(`/?module=${index === 0 ? 'fraud-network' : index === 3 ? 'incident-data-visualization' : 'live-call-shield'}`)}
            className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Explore <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Stats Section ---

const stats = [
  { label: "Incidents Analyzed", value: "10,000+", icon: <TrendingUp className="w-6 h-6 text-cyan-400" /> },
  { label: "Fraud Rings Detected", value: "150+", icon: <Network className="w-6 h-6 text-rose-500" /> },
  { label: "Citizen Reports", value: "5,000+", icon: <Globe className="w-6 h-6 text-emerald-400" /> },
  { label: "Threats Neutralized", value: "95%", icon: <Zap className="w-6 h-6 text-yellow-400" /> },
];

const Stats = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stat-item",
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-6" ref={containerRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-item text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800"
            >
              <div className="flex justify-center mb-4">{stat.icon}</div>
              <h3 className="text-4xl font-extrabold text-white mb-2">{stat.value}</h3>
              <p className="text-gray-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- CTA Section ---

const FinalCTA = () => {
  const router = useRouter();
  return (
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8">
            Ready to enhance public safety?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join law enforcement agencies and citizens in creating safer communities.
          </p>
          <CTAButton
            primary
            text="Get Started Now"
            icon={<ArrowRight className="w-5 h-5" />}
            onClick={() => router.push("/?module=dashboard")}
          />
        </motion.div>
      </div>
    </section>
  );
};

// --- Footer ---

const Footer = () => (
  <footer className="py-10 bg-black border-t border-slate-900">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-cyan-400" />
          <span className="text-lg font-bold text-slate-200">Public Safety Command Center</span>
        </div>
        <div className="text-sm text-gray-500">
          &copy; 2024 Et AI. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);

// --- Main Page Component ---

export default function Home() {
  const router = useRouter();
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const module = searchParams.get("module");
    if (module) {
      setShowDashboard(true);
    }
  }, []);

  // Helper to handle spotlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".feature-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty("--x", `${x}px`);
        (card as HTMLElement).style.setProperty("--y", `${y}px`);
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (showDashboard) {
    // Import dynamically if needed, or just render Dashboard component
    const Dashboard = require("./dashboard").default;
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/60 border-b border-slate-800/50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
              Public Safety
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors font-medium">
              Features
            </a>
            <button
              onClick={() => setShowDashboard(true)}
              className="px-5 py-2 rounded-full bg-cyan-600 text-white font-semibold hover:bg-cyan-500 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Hero />
        <Features />
        <Stats />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
