# Xandeum Analytics

Xandeum Analytics is a comprehensive analytics and monitoring platform for the Xandeum decentralized storage network. It empowers node operators, developers, and the community with actionable insights into network health, performance, and distribution.

## Features

- **Node Analysis:** Explore detailed statistics and trends for pNodes and the overall network.
- **Network Health:** Monitor the health and synchronization status of the network in real time.
- **Snapshots & History:** Access and analyze network snapshots for historical data and trend analysis.
- **API Access & Export:** Export data in CSV and JSON formats for further analysis or integration.
- **Geographical Distribution:** Interactive maps and charts showing the global spread of nodes.
- **Performance Trends:** Track network and node performance over time.
- **Risk & Health Assessment:** Automated risk scoring and health analysis based on node activity, version freshness, and network participation.

## Upcoming Features

- Custom alerting and notifications for node/network events
- User accounts and saved dashboards
- Advanced filtering and comparison tools
- More granular API endpoints and webhooks

## System Architecture

```
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
```

### Key Components

- **API Layer:** RESTful endpoints for health, stats, nodes, risk, export, and sync.
- **Data Sync:** Background jobs for periodic data collection and aggregation.
- **Analytics Engine:** Computes health, risk, and performance metrics.
- **Frontend Dashboard:** Interactive UI for visualizing network and node data.
- **Database:** Stores node metadata, snapshots, geolocation, and sync status.

### Example API Endpoints

| Endpoint           | Method | Description                   |
| ------------------ | ------ | ----------------------------- |
| `/api/pnodes`      | GET    | Node info, stats, geolocation |
| `/api/stats`       | GET    | Aggregated network stats      |
| `/api/snapshots`   | GET    | List health snapshots         |
| `/api/snapshots`   | POST   | Manually trigger health sync  |
| `/api/sync`        | GET    | Health sync service status    |
| `/api/history`     | GET    | Historical trend data         |
| `/api/export/json` | GET    | Export all analytics as JSON  |
| `/api/export/csv`  | GET    | Export all analytics as CSV   |

## Tech Stack

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js (API Routes in Next.js), Prisma ORM, PostgreSQL, Custom background sync jobs

## Deployment & Hosting

- Deployed on Vercel (Frontend & API)
- Database hosted on managed PostgreSQL (e.g., Supabase, Railway)
- Supports CI/CD for automated deployments

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up your environment variables:**

   - Copy `.env.example` to `.env` and fill in the required values (database URL, etc).

3. **Run the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Contributing

Xandeum Analytics is open-source and community-driven. Contributions, feedback, and feature requests are welcome! Please open an issue or pull request.
