import { NextResponse } from 'next/server'

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
	const exportData = { pnodes, health, risk, stats }

	return new Response(JSON.stringify(exportData, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': 'attachment; filename="dashboard-export.json"',
		},
	})
}
// Placeholder for JSON export endpoint
