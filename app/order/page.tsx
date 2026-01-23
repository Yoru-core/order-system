// components/OrderForm.tsx
'use client'

import { useState } from 'react'

interface OrderFormProps {
  products: string[]
}

export default function OrderForm({ products }: OrderFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    product: '',
    quantity: 1,
    address: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const whatsappNumber = '+213558447356'
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
      const message = `🛒 طلب جديد / NEW ORDER

الاسم / Name: ${formData.name}
الهاتف / Phone: ${formData.phone}
المنتج / Product: ${formData.product}
الكمية / Quantity: ${formData.quantity}
${formData.address ? `العنوان / Address: ${formData.address}` : ''}
${formData.notes ? `ملاحظات / Notes: ${formData.notes}` : ''}`

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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          الاسم / Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="أحمد"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1">
          رقم الهاتف / Phone *
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="0555123456"
        />
      </div>

      {/* Product */}
      <div>
        <label className="block text-sm font-medium mb-1">
          المنتج / Product *
        </label>
        <input
          type="text"
          required
          value={formData.product}
          onChange={(e) => setFormData({ ...formData, product: e.target.value })}
          className="w-full p-3 border rounded-lg"
        />
        {/* <select
          required
          value={formData.product}
          onChange={(e) => setFormData({ ...formData, product: e.target.value })}
          className="w-full p-3 border rounded-lg"
        >
          <option value="">اختر المنتج / Select Product</option>
           {products.map((product) => (
            <option key={product} value={product}>{product}</option>
          ))} 
        </select> */}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium mb-1">
          الكمية / Quantity
        </label>
        <input
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* Address (optional) */}
      <div>
        <label className="block text-sm font-medium mb-1">
          العنوان / Address (اختياري/optional)
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="حي 123 بلوك 5"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">
          ملاحظات / Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full p-3 border rounded-lg"
          rows={3}
          placeholder="أي تفاصيل إضافية..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400"
      >
        {isSubmitting ? 'جاري الإرسال...' : '📱 إرسال الطلب عبر واتساب'}
      </button>
    </form>
  )
}