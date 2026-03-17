import { NextRequest, NextResponse } from 'next/server'
import { runOsintEnrichment, OsintOptions } from '@/lib/osint'

export async function POST(req: NextRequest) {
  try {
    const options: OsintOptions = await req.json()
    
    // This will now use GITHUB_TOKEN on the server
    const results = await runOsintEnrichment(options)
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('OSINT API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
