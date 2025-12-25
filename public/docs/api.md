<h1 style="font-size:3rem; font-weight:800; margin-bottom:1.5rem;">API Documentation</h1>

Xandeum Analytics exposes a set of RESTful API endpoints for accessing real-time and historical data about the Xandeum network, nodes, health, risk, and more. All endpoints return JSON unless otherwise specified.

<br>

---

<br>

# Health

<br>

### `GET /api/health`

Returns the current health status of the Xandeum network, including node counts, network health percentage, and version information.

<br>

**Response Example:**

```json
{
  "status": "ok",
  "network": "xandeum-pnode",
  "backend": { "rpcReachable": true, "latencyMs": 123 },
  "networkSummary": {
    "totalNodes": 210,
    "activeNodes": 200,
    "inactiveNodes": 10,
    "networkHealth": 95
  },
  "version": {
    "local": "1.2.3",
    "majority": "1.2.3",
    "outdatedNodes": 5
  },
  "timestamp": 1700000000
}
```

<br>

---

<br>

## Node Data

<br>

### `GET /api/pnodes`

Returns a list of all pNodes with detailed statistics, geolocation, health, and storage info.

<br>

**Response Example:**

```json
{
  "summary": {
    "totalKnown": 210,
    "active": 200,
    "inactive": 10,
    "networkHealth": 95,
    "lastUpdated": 1700000000,
    "versionDistribution": { "1.2.3": 180, "1.2.2": 30 },
    "countryDistribution": { "US": 100, "DE": 30 },
    "publicNodes": 180,
    "privateNodes": 30,
    "networkStorageTotal": 1234567890,
    "aggregateStorageUsed": 987654321
  },
  "pNodes": [
    {
      "id": "1.2.3.4:9090",
      "version": "1.2.3",
      "lastSeen": 1700000000,
      "status": "active",
      "healthScore": 98,
      "country": "US",
      "city": "New York",
      "isPublic": true,
      "storageCommitted": 1000000000,
      "storageUsed": 800000000,
      "cpuPercent": 12.5,
      "ramUsedBytes": 512000000,
      "ramTotalBytes": 1024000000,
      "uptimeSeconds": 86400
    }
  ]
}
```

### `GET /api/pnodes/snapshots`

Returns historical snapshots of pNode and network health data.

<br>

**Response Example:**

```json
{
  "snapshots": [
    {
      "timestamp": 1700000000,
      "networkHealth": 95,
      "activeNodes": 200,
      "totalNodes": 210,
      "riskScore": 90,
      "riskLevel": "low",
      "outdatedNodes": 5,
      "outdatedPercentage": 2
    }
  ],
  "count": 1
}
```

<br>

---

<br>

## Network

<br>

### `GET /api/network/risk`

Returns a risk assessment for the network, including risk score, level, and reasons.

<br>

**Response Example:**

```json
{
  "scope": "network",
  "risk": { "level": "low", "score": 90 },
  "metrics": {
    "totalNodes": 210,
    "activeNodes": 200,
    "inactiveNodes": 10,
    "inactivePercentage": 5,
    "outdatedNodes": 5,
    "outdatedPercentage": 2,
    "majorityVersion": "1.2.3"
  },
  "reasons": ["No significant risk factors detected"],
  "recommendations": ["No immediate action required"],
  "timestamp": 1700000000
}
```

### `GET /api/network/stats`

Returns aggregated and per-node network statistics (CPU, RAM, traffic, streams).

<br>

**Response Example:**

```json
{
  "summary": {
    "totalNodes": 210,
    "avgCpuPercent": 10.5,
    "avgRamPercent": 45.2,
    "totalPacketsPerSecond": 12345,
    "totalActiveStreams": 120
  },
  "nodes": [
    {
      "address": "1.2.3.4:9090",
      "cpuPercent": 12.5,
      "ramPercent": 50.1,
      "packetsReceived": 1000,
      "packetsSent": 1200,
      "activeStreams": 5
    }
  ]
}
```

<br>

---

<br>

## Snapshots

### `GET /api/snapshots`

Returns all network health snapshots and sync service status.

<br>

**Response Example:**

```json
{
  "snapshots": [
    { "timestamp": 1700000000, "networkHealth": 95, "activeNodes": 200 }
  ],
  "count": 1,
  "syncStatus": { "running": true, "interval": 60000 }
}
```

### `POST /api/snapshots`

Manually trigger a health data sync. Returns sync status and snapshot count.

<br>

**Response Example:**

```json
{
  "success": true,
  "message": "Health data synced successfully",
  "status": { "running": true, "interval": 60000 },
  "totalSnapshots": 42
}
```

<br>

---

<br>

## Sync Service

<br>

### `GET /api/sync/status`

Get the status of the health sync service.

<br>

### `POST /api/sync/control`

Control the health sync service (start, stop, setInterval, syncNow). Requires a JSON body with an `action` field and optional `interval`.

<br>

**Request Example:**

```json
{ "action": "start", "interval": 60000 }
```

<br>

---

<br>

## Data Export

### `GET /api/export/csv`

Exports all node, health, risk, and stats data as a CSV file.

<br>

### `GET /api/export/json`

Exports all node, health, risk, and stats data as a JSON file.

<br>

**Response Example:**

```json
{
  "pnodes": {
    /* ... */
  },
  "health": {
    /* ... */
  },
  "risk": {
    /* ... */
  },
  "stats": {
    /* ... */
  }
}
```

<br>

---

<br>

## Error Handling

All endpoints return a JSON error object with an `error` field and appropriate HTTP status code on failure.

<br>

**Error Example:**

```json
{
  "error": "Failed to fetch pNodes"
}
```
