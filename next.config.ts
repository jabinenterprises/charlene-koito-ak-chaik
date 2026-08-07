import type { NextConfig } from "next";
import os from "os";

function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>([
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "host.docker.internal",
    "host.docker.internal:3000",
  ]);

  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          const ip = net.address;
          origins.add(ip);
          origins.add(`${ip}:3000`);
          origins.add(`${ip}:443`);
          origins.add(`${ip}:80`);
          origins.add(`http://${ip}`);
          origins.add(`https://${ip}`);
          origins.add(`http://${ip}:3000`);
          origins.add(`https://${ip}:3000`);

          const prefix = ip.substring(0, ip.lastIndexOf("."));
          for (let i = 1; i <= 254; i++) {
            const subnetIp = `${prefix}.${i}`;
            origins.add(subnetIp);
            origins.add(`${subnetIp}:3000`);
          }
        }
      }
    }
  } catch {
    // Fallback if OS inspection is unavailable
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  devIndicators: false,
  env: {
    DATABASE_URL:
      process.env.DATABASE_URL ||
      "postgresql://koito_admin:Password2026@kitopostgres-2.cpuq0ym6ydn3.eu-west-1.rds.amazonaws.com:5432/koito_event?sslmode=require",
  },
};

export default nextConfig;
