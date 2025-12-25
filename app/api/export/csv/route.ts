import { NextResponse } from 'next/server'

function toCSV(obj: any): string {
	if (Array.isArray(obj)) {
		if (obj.length === 0) return ''
		const keys = Object.keys(obj[0])
		const rows = obj.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))
		return keys.join(',') + '\n' + rows.join('\n')
	}
	if (typeof obj === 'object' && obj !== null) {
		const keys = Object.keys(obj)
		const values = keys.map(k => JSON.stringify(obj[k] ?? ''))
		return keys.join(',') + '\n' + values.join(',')
	}
	return String(obj)
}

export async function GET() {
	// Fetch all required endpoints
	const [pnodesRes, healthRes, riskRes, statsRes] = await Promise.all([
		fetch(process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + '/api/pnodes' : 'http://localhost:3000/api/pnodes'),
		fetch(process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + '/api/health' : 'http://localhost:3000/api/health'),
		fetch(process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + '/api/network/risk' : 'http://localhost:3000/api/network/risk'),
		fetch(process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + '/api/stats' : 'http://localhost:3000/api/stats'),
	])
	const [pnodes, health, risk, stats] = await Promise.all([
		pnodesRes.json(),
		healthRes.json(),
		riskRes.json(),
		statsRes.json(),
	])

	// Format nodes table as in the screenshot
	const nodeRows = (pnodes.pNodes || []).map((node: any) => ({
		address: node.id || '',
		ip: node.id ? node.id.split(':')[0] : '',
		port: node.id ? node.id.split(':')[1] : '',
		pubkey: node.pubkey || '',
		version: node.version || '',
		status: node.status || '',
		isOnline: node.status && node.status.startsWith('online') ? 'TRUE' : 'FALSE',
		hasPublicRpc: node.isPublic ? 'TRUE' : 'FALSE',
		uptime: node.uptimeSeconds ? formatUptime(node.uptimeSeconds) : '',
		country: node.country || '',
		city: node.city || '',
		lastSeen: node.lastSeen ? new Date(node.lastSeen * 1000).toISOString() : '',
	}))

	function formatUptime(seconds: number) {
		if (!seconds || isNaN(seconds)) return '';
		const d = Math.floor(seconds / (3600 * 24));
		const h = Math.floor((seconds % (3600 * 24)) / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		let str = '';
		if (d > 0) str += `${d}d `;
		if (h > 0) str += `${h}h `;
		if (m > 0) str += `${m}m`;
		return str.trim();
	}

	// CSV header as in screenshot
	const nodeHeaders = [
		'address', 'ip', 'port', 'pubkey', 'version', 'status', 'isOnline', 'hasPublicRpc', 'uptime', 'country', 'city', 'lastSeen'
	];
	let csv = nodeHeaders.join(',') + '\n';
	csv += nodeRows.map((row: Record<string, any>) => nodeHeaders.map(h => JSON.stringify(row[h] ?? '')).join(',')).join('\n');

	// Optionally, add a blank line and then summary sections for health, risk, stats
	csv += '\n\nHEALTH\n' + toCSV(health);
	csv += '\n\nRISK\n' + toCSV(risk);
	csv += '\n\nSTATS\n' + toCSV(stats);

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': 'attachment; filename="dashboard-export.csv"',
		},
	})
}
