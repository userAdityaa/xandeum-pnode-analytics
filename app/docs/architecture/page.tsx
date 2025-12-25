"use client";
import { useSidebar } from "@/components/ui/sidebar";
import Image from "next/image";

export default function ArchitecturePage() {
  const { state } = useSidebar();
  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{
        marginLeft: state === "expanded" ? "14rem" : "6rem",
        transition: "margin-left 300ms ease-in-out"
      }}
    >
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">System Architecture</h1>
        <h2 className="text-2xl font-semibold mb-4">Architecture Diagram</h2>
        <pre className="mb-8 rounded-lg border border-[#23272e] bg-[#18181b] p-4 overflow-x-auto text-xs">
{`
+---------------------+         +---------------------+         +---------------------+
|   Peer Node Layer   |         |   Sync Services     |         |     Database        |
|---------------------|         |---------------------|         |---------------------|
|  pNode 1            |         |  Node Stats Sync    |         |  PostgreSQL         |
|  pNode 2            |<------->|  Storage Sync       |<------->|  (Prisma ORM)       |
|  ...                |  PRPC   |  Health Sync        |         |  nodeStats          |
|  pNode N            | Gossip  +---------------------+         |  podStorage         |
+---------------------+         |  API Layer          |         |  snapshot           |
                                |  (Next.js API)      |         |  geoLocation        |
                                +---------------------+         +---------------------+
                                         |
                                         v
                                +---------------------+
                                |   Frontend (Next.js)|
                                |   Analytics Dash    |
                                +---------------------+
`}
        </pre>
        <h2 className="text-2xl font-semibold mb-4">Component Table</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full text-sm border border-[#23272e]">
            <thead>
              <tr className="bg-[#18181b]">
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Layer</th>
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Component</th>
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">Peer Network</td><td className="px-3 py-2 border-b border-[#23272e]">pNodes</td><td className="px-3 py-2 border-b border-[#23272e]">Distributed nodes exposing RPC endpoints for stats and storage.</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">Sync Services</td><td className="px-3 py-2 border-b border-[#23272e]">Node Stats Sync</td><td className="px-3 py-2 border-b border-[#23272e]">Periodically fetches real-time stats from all public nodes.</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">Sync Services</td><td className="px-3 py-2 border-b border-[#23272e]">Storage Sync</td><td className="px-3 py-2 border-b border-[#23272e]">Periodically fetches storage/credit data from all nodes.</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">Sync Services</td><td className="px-3 py-2 border-b border-[#23272e]">Health Sync</td><td className="px-3 py-2 border-b border-[#23272e]">Aggregates network health/risk metrics and stores periodic snapshots.</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">API Layer</td><td className="px-3 py-2 border-b border-[#23272e]">Next.js API Routes</td><td className="px-3 py-2 border-b border-[#23272e]">Serves analytics, node, storage, health, and export endpoints.</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">Database</td><td className="px-3 py-2 border-b border-[#23272e]">PostgreSQL (Prisma)</td><td className="px-3 py-2 border-b border-[#23272e]">Stores node stats, storage, health snapshots, and geolocation cache.</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">Frontend</td><td className="px-3 py-2 border-b border-[#23272e]">Next.js Dashboard</td><td className="px-3 py-2 border-b border-[#23272e]">Visualizes real-time and historical analytics, charts, and tables.</td></tr>
            </tbody>
          </table>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Data Flow (Step-by-Step)</h2>
        <ol className="list-decimal pl-6 mb-8 space-y-1">
          <li><b>Peer Node Discovery:</b> Sync services use PRPC to discover and communicate with all pNodes.</li>
          <li><b>Periodic Data Sync:</b> Node Stats Sync fetches stats (CPU, RAM, streams, etc.) every 20s. Storage Sync fetches storage/credit data every 30s. Health Sync aggregates health/risk metrics every 2min.</li>
          <li><b>Database Upsert:</b> All fetched data is upserted into PostgreSQL tables via Prisma ORM.</li>
          <li><b>API Layer:</b> Next.js API routes serve live/cached data to frontend and external consumers.</li>
          <li><b>Frontend Dashboard:</b> Fetches data from API, renders charts, tables, and analytics for users.</li>
        </ol>
        <h2 className="text-2xl font-semibold mb-4">Key Tables & Data</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full text-sm border border-[#23272e]">
            <thead>
              <tr className="bg-[#18181b]">
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Table</th>
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Key Fields</th>
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">nodeStats</td><td className="px-3 py-2 border-b border-[#23272e]">address, cpu, ram, etc.</td><td className="px-3 py-2 border-b border-[#23272e]">Real-time stats for each public node</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">podStorage</td><td className="px-3 py-2 border-b border-[#23272e]">address, storage, credits</td><td className="px-3 py-2 border-b border-[#23272e]">Storage and credit data for each node</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">snapshot</td><td className="px-3 py-2 border-b border-[#23272e]">timestamp, health, risk</td><td className="px-3 py-2 border-b border-[#23272e]">Periodic health/risk snapshots</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">geoLocation</td><td className="px-3 py-2 border-b border-[#23272e]">ip, country, city, lat/lon</td><td className="px-3 py-2 border-b border-[#23272e]">Geolocation cache for node IPs</td></tr>
            </tbody>
          </table>
        </div>
        <h2 className="text-2xl font-semibold mb-4">API Endpoints (Examples)</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full text-sm border border-[#23272e]">
            <thead>
              <tr className="bg-[#18181b]">
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Endpoint</th>
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Method</th>
                <th className="px-3 py-2 border-b border-[#23272e] text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">/api/pnodes</td><td className="px-3 py-2 border-b border-[#23272e]">GET</td><td className="px-3 py-2 border-b border-[#23272e]">Node info, stats, geolocation, storage</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">/api/stats</td><td className="px-3 py-2 border-b border-[#23272e]">GET</td><td className="px-3 py-2 border-b border-[#23272e]">Aggregated network stats</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">/api/snapshots</td><td className="px-3 py-2 border-b border-[#23272e]">GET</td><td className="px-3 py-2 border-b border-[#23272e]">List health snapshots</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">/api/snapshots</td><td className="px-3 py-2 border-b border-[#23272e]">POST</td><td className="px-3 py-2 border-b border-[#23272e]">Manually trigger health sync</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">/api/sync</td><td className="px-3 py-2 border-b border-[#23272e]">GET</td><td className="px-3 py-2 border-b border-[#23272e]">Health sync service status</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">/api/history</td><td className="px-3 py-2 border-b border-[#23272e]">GET</td><td className="px-3 py-2 border-b border-[#23272e]">Historical trend data</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">/api/export/json</td><td className="px-3 py-2 border-b border-[#23272e]">GET</td><td className="px-3 py-2 border-b border-[#23272e]">Export all analytics as JSON</td></tr>
              <tr><td className="px-3 py-2 border-b border-[#23272e]">/api/export/csv</td><td className="px-3 py-2 border-b border-[#23272e]">GET</td><td className="px-3 py-2 border-b border-[#23272e]">Export all analytics as CSV</td></tr>
            </tbody>
          </table>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Additional Details</h2>
        <ul className="list-disc pl-6 mb-8 space-y-1">
          <li><b>Geolocation:</b> Node IPs are resolved and cached for country/city info.</li>
          <li><b>Credits:</b> Pod credits are fetched from an external service and merged with storage data.</li>
          <li><b>Singletons:</b> Sync services and stores are implemented as singletons for serverless efficiency.</li>
        </ul>
        <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
        <div className="mb-8">
          <h3 className="text-xl font-bold mt-4 mb-2">Frontend</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Next.js (React)</li>
            <li>TypeScript</li>
            <li>Tailwind CSS</li>
            <li>Lucide Icons</li>
          </ul>
          <h3 className="text-xl font-bold mt-6 mb-2">Backend</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Node.js (API Routes in Next.js)</li>
            <li>Prisma ORM</li>
            <li>PostgreSQL (Database)</li>
            <li>Custom background sync jobs</li>
          </ul>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Key Components</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><b>API Layer:</b> RESTful endpoints for health, stats, nodes, risk, export, and sync.</li>
          <li><b>Data Sync:</b> Background jobs for periodic data collection and aggregation from the Xandeum network.</li>
          <li><b>Analytics Engine:</b> Computes health, risk, and performance metrics from raw node data.</li>
          <li><b>Frontend Dashboard:</b> Interactive UI for visualizing network and node data, built with React and Next.js.</li>
          <li><b>Database:</b> Stores node metadata, snapshots, geolocation, and sync status.</li>
        </ul>
        <h2 className="text-2xl font-semibold mb-4 mt-8">Deployment & Hosting</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Deployed on Vercel (Frontend & API)</li>
          <li>Database hosted on managed PostgreSQL (e.g., Supabase, Railway, or similar)</li>
          <li>Supports CI/CD for automated deployments</li>
        </ul>
        <div className="mt-10 text-sm text-gray-400">For more details, see the repository README or contact the maintainers.</div>
      </div>
    </div>
  );
}
