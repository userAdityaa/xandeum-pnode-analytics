"use client"
import { useSidebar } from "@/components/ui/sidebar";

export default function AboutPage() {
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
        <h1 className="text-5xl font-bold mb-8">About Xandeum Analytics</h1>
        <p className="text-lg mb-6">
          <span className="font-semibold">Xandeum Analytics</span> is a modern analytics and monitoring platform for the Xandeum decentralized storage network. It is designed to provide node operators, developers, and the community with actionable insights into the health, performance, and distribution of the network. The platform aggregates real-time and historical data from hundreds of pNodes, offering a transparent view of network activity and trends.
        </p>
        <h2 className="text-2xl font-bold mt-10 mb-4">Key Features</h2>
        <ul className="list-disc pl-6 space-y-2 text-base mb-8">
          <li><span className="font-semibold">Network Overview:</span> Visualize the current state of the Xandeum network, including total nodes, active/inactive status, and health metrics.</li>
          <li><span className="font-semibold">Node Analysis:</span> Drill down into individual pNode statistics, such as CPU, RAM, storage usage, uptime, and version distribution.</li>
          <li><span className="font-semibold">Geographical Distribution:</span> Explore interactive maps and charts showing the global spread of nodes and their country-level distribution.</li>
          <li><span className="font-semibold">Performance Trends:</span> Track network and node performance over time with historical charts for resource usage, version adoption, and network health.</li>
          <li><span className="font-semibold">Risk & Health Assessment:</span> Automated risk scoring and health analysis based on node activity, version freshness, and network participation.</li>
          <li><span className="font-semibold">Snapshots & History:</span> Access and analyze network snapshots for historical data and trend analysis.</li>
          <li><span className="font-semibold">Data Export:</span> Export network and node data in CSV or JSON format for external analysis or reporting.</li>
        </ul>
        <h2 className="text-2xl font-bold mt-10 mb-4">How It Works</h2>
        <p className="mb-6">
          Xandeum Analytics collects data from the Xandeum network using a combination of direct node queries, API endpoints, and scheduled background sync jobs. The backend aggregates and processes this data to compute health scores, risk levels, and performance metrics. The frontend presents this information through interactive dashboards, charts, and tables, making it easy to monitor the network in real time or review historical trends.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base mb-8">
          <li><span className="font-semibold">API Integration:</span> The platform exposes RESTful API endpoints for accessing node stats, health, risk, and export data, enabling integration with external tools and scripts.</li>
          <li><span className="font-semibold">Automated Sync:</span> Background jobs ensure that node and network data are kept up to date, with regular refresh intervals for accuracy.</li>
          <li><span className="font-semibold">Custom Visualizations:</span> Rich data visualizations help users quickly identify trends, outliers, and potential issues in the network.</li>
        </ul>
        <h2 className="text-2xl font-bold mt-10 mb-4">Who Is It For?</h2>
        <ul className="list-disc pl-6 space-y-2 text-base mb-8">
          <li><span className="font-semibold">Node Operators:</span> Monitor your node’s health, uptime, and performance in the context of the wider network.</li>
          <li><span className="font-semibold">Developers:</span> Access detailed network data and API endpoints for building integrations or conducting research.</li>
          <li><span className="font-semibold">Community & Researchers:</span> Gain insights into the growth, distribution, and stability of the Xandeum network.</li>
        </ul>
        <h2 className="text-2xl font-bold mt-10 mb-4">Architecture Overview</h2>
        <ul className="list-disc pl-6 space-y-2 text-base mb-8">
          <li><span className="font-semibold">Frontend:</span> Built with Next.js and React, providing a fast, interactive, and responsive user experience.</li>
          <li><span className="font-semibold">Backend:</span> Node.js APIs aggregate and process data from the Xandeum network, with Prisma for database access and background sync jobs for data freshness.</li>
          <li><span className="font-semibold">Data Layer:</span> Utilizes scheduled syncs and direct node queries to ensure up-to-date and accurate analytics.</li>
        </ul>
        <h2 className="text-2xl font-bold mt-10 mb-4">Open Source & Community</h2>
        <p className="mb-6">
          Xandeum Analytics is an open-source project, developed and maintained by the Xandeum community. Contributions, feedback, and feature requests are welcome. The platform is designed to be transparent, extensible, and community-driven, supporting the growth and resilience of the Xandeum ecosystem.
        </p>
        <h2 className="text-2xl font-bold mt-10 mb-4">Get Involved</h2>
        <p>
          To contribute, report issues, or request features, please visit our repository or join the community discussions. Your participation helps make Xandeum Analytics better for everyone!
        </p>
      </div>
    </div>
  );
}
