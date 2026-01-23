// app/api/submit-order/route.ts
import { NextResponse } from 'next/server'
import { appendOrder } from '@/lib/googleSheets'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate
    if (!body.name || !body.phone || !body.product) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to Google Sheets
    await appendOrder(body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit order' },
      { status: 500 }
    )
  }
}