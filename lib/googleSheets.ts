import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

export async function appendOrder( orderData: any) { 
  const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Algiers' })
  const values = [[
    orderData.name,
    orderData.phone,
    orderData.product,
    orderData.quantity,
    orderData.address || '',
    orderData.notes || '',
    timestamp,
    'New' // Status
  ]]

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'A1:F1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  })
}