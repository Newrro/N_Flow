import type { NextConfig } from "next";
import os from "os";

const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
};

const localIPs = getLocalIPs();
const port = process.env.PORT || "3000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...localIPs,
    'smart-parts-take.loca.lt', 
    '*.loca.lt', 
    'serveo.net', 
    '*.serveo.net', 
    'serveousercontent.com', 
    '*.serveousercontent.com'
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        ...localIPs,
        ...localIPs.map(ip => `${ip}:${port}`),
        'smart-parts-take.loca.lt', 
        '*.loca.lt', 
        'serveo.net', 
        '*.serveo.net', 
        'serveousercontent.com', 
        '*.serveousercontent.com'
      ],
    },
  },
};

export default nextConfig;
