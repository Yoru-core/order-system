// config/stores.ts
// export interface Store {
//   slug: string
//   name: string
//   nameAr: string
//   whatsappNumber: string // Format: 213555123456 (country code + number)
//   products: string[]
//   sheetId: string
// }
//
export const stores = {
  slug: "Home-appliances-store",
  name: "Home appliances store",
  nameAr: "متجر الاجهزة المنزلية",
  whatsappNumber: "+213558447356",
  logoURL:
    "https://img.freepik.com/free-vector/instagram-shop-logo-design_23-2149750743.jpg?semt=ais_user_personalization&w=740&q=80",
};
// Add more stores...
//
// export function getStoreBySlug(slug: string): Store | undefined {
//   return stores.find(store => store.slug === slug)
// }

//
// ## **Google Sheets Setup (5 Minutes)**
//
// 1. **Create a Google Sheet** for each store with headers:
//
//    Timestamp | Name | Phone | Product | Quantity | Address | Notes | Status
//
// 2. **Create Service Account:**
//    - Go to Google Cloud Console
//    - Create new project
//    - Enable Google Sheets API
//    - Create Service Account
//    - Download JSON key
//    - Share your Google Sheet with the service account email
//
// 3. **Add to `.env.local`:**
// GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
// GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
