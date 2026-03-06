import { FormDataType } from "@/app/page1";
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function appendOrder(orderData: FormDataType) {
  const itemsText = orderData.items
    .map((i) => `• ${i.name} x${i.quantity} = ${i.price * i.quantity} DA`)
    .join("\n");
  const total = orderData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const timestamp = new Date().toLocaleString("en-GB", {
    timeZone: "Africa/Algiers",
  });
  const values = [
    [
      orderData.name,
      orderData.phone,
      itemsText,
      orderData.wilaya,
      orderData.address,
      orderData.notes || "",
      total,
      timestamp,
      "New", // Status
    ],
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ORDER_DB_ID,
    range: "A1:G1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

export async function fetchProducts() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_PRODUCTS_DB_ID,
    range: "A:E",
  });
  return res.data.values;
}
