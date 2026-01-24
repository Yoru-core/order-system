// components/OrderForm.tsx
'use client'
import { useEffect, useState } from 'react'

type ProductType = {
  id: number;
  name: string;
  price: string;
  active: string;
}

type FormDataType = {
  name: string;
  phone: string;
  product: string;
  quantity: number;
  address: string;
  notes: string;
}

export default function OrderForm() {
  const whatsappNumber = '+213558447356'
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    phone: '',
    product: '',
    quantity: 1,
    address: '',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);
  async function fetchProducts() {
    try {
      const res = await fetch('/api/get-products');
      const result = await res.json();

      if (result.success) {
        const allRows = result.data;

        if (allRows.length > 0) {
          // Skip header row if it exists
          const dataRows = allRows.slice(1);

          // Map rows to ProductType
          const parsedProducts: ProductType[] = dataRows.map((row: any[]) => ({
            id: row[0] || 0,           // Assuming first column is id
            name: row[1] || '',        // Assuming second column is name
            price: row[2] || '',       // Assuming third column is price
            active: row[3] || ''       // Assuming fourth column is active
          })).filter((product: ProductType) =>
            product.name && product.active === 'TRUE' // Only show active products
          );

          console.log('Parsed products:', parsedProducts);
          setProducts(parsedProducts);
        }
      } else {
        alert('❌ حدث خطأ. حاول مرة أخرى');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('❌ حدث خطأ. حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
    setIsSubmitting(true)

    try {
      // 1. Save to Google Sheets
      await fetch('/api/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData })
      })

      // 2. Generate WhatsApp message
      const message = `🛒 طلب جديد / NOUVELLE COMMANDE
      Nom et prénom: ${formData.name}
      Numéro de téléphone: ${formData.phone}
      Produit: ${formData.product}
      Quantité: ${formData.quantity}
      Address: ${formData.address}
      ${formData.notes ? `Remarques: ${formData.notes}` : 'Aucune information supplémentaire'}`

      // 3. Open WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_self')

      // Success feedback
      alert('✅ تم إرسال الطلب! سيتم فتح واتساب الآن')

    } catch (error) {
      alert('❌ حدث خطأ. حاول مرة أخرى')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='h-screen w-screen flex flex-col items-center justify-center '>
      <form onSubmit={handleSubmit} className="backdrop-blur-sm  text-white space-y-2 max-w-md mx-auto p-4 border rounded-xl shadow-[0_0_25px_-5px_rgba(0,0,0,1)]" >
        {/* Name */}
        <div className='flex flex-col items-center space-y-2 '>
          <div className='flex items-center gap-4'>
            <div className='backdrop-blur-sm rounded-full border border-white p-1.5 shadow-[0_5px_25px_-5px_rgba(0,0,0,1)]  ' >
              <img src="./washing-machine.png" alt="wasing machine svg" width={30} height={30} />
            </div>
            <p className='font-bold text-xl'>متجر الاجهزة المنزلية</p>
          </div>
          <p>
            يرجى ملئ المعلومات و سيتم تأكيد الطلب عبر الواتساب
          </p>
        </div>

        <div className='border rounded-xl p-4 border-gray-400 shadow-[0_0_25px_-10px_rgba(0,0,0,1)] space-y-2 '>
          <div>
            <label className="block text-sm font-medium mb-1">
              Nom et prénom ( الاسم و اللقب) :
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg border-gray-400 "
              placeholder="أحمد"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Numéro de téléphone (رقم الهاتف) :
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border rounded-lg border-gray-400"
              placeholder="0555123456"
            />
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Produit (المنتج) :
            </label>
            {loading ? <p className='font-bold text-center'>جاري التحميل...</p> :
              <select
                required
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full p-2 border rounded-lg border-gray-400"
              >
                <option className='text-black' value="">اختر المنتج / Select Product</option>
                {products.map((product) => (
                  <option className='text-black' key={product.id} value={product.name}>{product.name} - {product.price}</option>
                ))}
              </select>
            }
          </div>


          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Quantité (الكمية) :
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-lg border-gray-400"
            />
          </div>

          {/* Address (optional) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Address (العنوان) :
            </label>
            <input
              required
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border rounded-lg border-gray-400"
              placeholder="حي 123 بلوك 5"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Remarques (ملاحظات) :
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded-lg border-gray-400"
              rows={3}
              placeholder="أي تفاصيل إضافية..."
            />
          </div>

          {/* Submit */}
          <p className='text-center'>⚠️ سيتم تأكيد الطلب عبر الهاتف أو واتساب قبل التوصيل ⚠️</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'جاري الإرسال...' : '📱 إرسال الطلب عبر واتساب'}
          </button>
        </div>
      </form >
    </div>
  )
}