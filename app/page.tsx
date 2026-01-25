// components/OrderForm.tsx
'use client'
import { useEffect, useState } from 'react'

type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
}


type ProductType = {
  id: number;
  name: string;
  price: number;
  active: string;
}

export type FormDataType = {
  name: string;
  phone: string;
  items: CartItem[]
  address: string;
  notes: string;
}

export default function OrderForm() {
  const whatsappNumber = '+213558447356'
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    phone: '',
    items: [],
    address: '',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<ProductType[]>([]);
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState<ProductType[]>([])

  const total = formData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const MAX_PRODUCTS = 4

  function addProduct(product: ProductType) {
    setFormData(prev => {
      const existing = prev.items.find(i => i.id === product.id)

      // If product already exists → just increase quantity
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i =>
            i.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        }
      }

      // Block adding new product if limit reached
      if (prev.items.length >= MAX_PRODUCTS) {
        return prev
      }

      // Add new product
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1
          }
        ]
      }
    })
  }
  function removeItem(id: number) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }
  function decreaseQuantity(id: number) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.flatMap(item => {
        if (item.id !== id) return item

        if (item.quantity === 1) return [] // gone
        return { ...item, quantity: item.quantity - 1 }
      })
    }))
  }

  useEffect(() => {
    if (!query) {
      setFiltered([])
      return
    }

    setFiltered(
      products
        .filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6) // hard limit for sanity
    )
  }, [query, products])

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

          setProducts(parsedProducts);
        }
      } else {
        alert('❌ حدث خطأ. حاول مرة أخرى');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('❌ حدث خطأ. حاول مرة أخرى');
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Save to Google Sheets
      await fetch('/api/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData })
      })

      // 2. Generate WhatsApp message
      const itemsText = formData.items
        .map(i => `• ${i.name} x${i.quantity} = ${i.price * i.quantity} DA`)
        .join('\n')

      const message = `🛒 طلب جديد / NOUVELLE COMMANDE
      Nom et prénom: ${formData.name}
      Numéro de téléphone: ${formData.phone}
      Address: ${formData.address}
      Produits:
      ${itemsText}
      
      Total: ${total} DA

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

        <div className='space-y-2 '>
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
              Produit (المنتج) يمكنك اختيار 4 منتجات مختلفة فقط :
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ابحث عن المنتج..."
                className="w-full p-2 border rounded-lg text-black"
              />

              {filtered.length > 0 && (
                <div className="absolute z-10 w-full bg-white text-black rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
                  {filtered.map(product => (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => {
                        addProduct(product)
                        setQuery('')
                        setFiltered([])
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    >
                      {product.name} — {product.price} DA
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Quantity */}
          {formData.items.map(item => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b pb-2"
            >
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm opacity-70">
                  {item.price} DA × {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decreaseQuantity(item.id)}
                  className="px-2 py-1 rounded border"
                >
                  −
                </button>

                <span>{item.quantity}</span>

                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      items: prev.items.map(i =>
                        i.id === item.id
                          ? { ...i, quantity: i.quantity + 1 }
                          : i
                      )
                    }))
                  }
                  className="px-2 py-1 rounded border"
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="ml-2 text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}



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
          {/* Submit */}
          <p className='text-center'>⚠️ سيتم تأكيد الطلب عبر الهاتف أو واتساب قبل التوصيل ⚠️</p>
          <button
            type="submit"
            disabled={isSubmitting || formData.items.length === 0}
            className="w-full bg-green-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'جاري الإرسال...' : '📱 إرسال الطلب عبر واتساب'}
          </button>
        </div>
      </form >
    </div>
  )
}
