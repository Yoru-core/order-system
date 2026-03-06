// components/OrderForm.tsx
"use client";
import { stores } from "@/config/store";
import { ChangeEvent, useEffect, useState } from "react";
import wilayasData from '../config/Wilaya_Of_Algeria.json';

type CartItem = {
  id: number;
  image: string;
  name: string;
  price: number;
  quantity: number;
};

type ProductType = {
  id: number;
  image: string
  name: string;
  price: number;
  active: string;
};

export type FormDataType = {
  name: string;
  phone: string;
  items: CartItem[];
  wilaya: string;
  address: string;
  notes: string;
};

export default function OrderForm() {
  const whatsappNumber = stores.whatsappNumber
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    phone: "",
    items: [],
    wilaya: '',
    address: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<ProductType[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Keep only digits
    setFormData({ ...formData, phone: value });

    // Algerian Regex: Starts with 0, then 2-7, followed by 8 digits
    const algerianRegex = /^0[567][0-9]{8}$/




    if (value.length > 0 && !algerianRegex.test(value)) {
      if (value.startsWith("05") || value.startsWith("06") || value.startsWith("07")) {
        // Validating Mobile
        setPhoneError(value.length === 10 ? "" : "يجب أن يكون الرقم مكونًا من 10 أرقام");
      } else {
        setPhoneError("يجب أن يبدأ الرقم بـ 05, 06 او 07 ");
      }
    } else {
      setPhoneError("");
    }
  };
  const currentWilaya = wilayasData.find(w => w.name === selectedWilaya);
  const deliveryPrice = currentWilaya ? currentWilaya["Delivery price"] : 0;

  const total = formData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  ) + deliveryPrice;
  const MAX_PRODUCTS = 4;

  function addProduct(product: ProductType) {
    setFormData((prev) => {
      const existing = prev.items.find((i) => i.id === product.id);

      // If product already exists → just increase quantity
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }

      // Block adding new product if limit reached
      if (prev.items.length >= MAX_PRODUCTS) {
        return prev;
      }

      // Add new product
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: product.id,
            image: product.image,
            name: product.name,
            price: Number(product.price),
            quantity: 1,
          },
        ],
      };
    });
  }
  function removeItem(id: number) {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }
  function decreaseQuantity(id: number) {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.flatMap((item) => {
        if (item.id !== id) return item;

        if (item.quantity === 1) return []; // gone
        return { ...item, quantity: item.quantity - 1 };
      }),
    }));
  }

  useEffect(() => {
    setFiltered(
      products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }, [query, isFocused, products]);

  useEffect(() => {
    fetchProducts();
  }, []);
  async function fetchProducts() {
    try {
      const res = await fetch("/api/get-products");
      const result = await res.json();

      if (result.success) {
        const allRows = result.data;

        if (allRows.length > 0) {
          // Skip header row if it exists
          const dataRows = allRows.slice(1);

          // Map rows to ProductType
          const parsedProducts: ProductType[] = dataRows
            .map((row: any[]) => ({
              id: row[0] || 0, // Assuming first column is id
              image: row[1] || "",
              name: row[2] || "", // Assuming second column is name
              price: row[3] || "", // Assuming third column is price
              active: row[4] || "", // Assuming fourth column is active
            }))
            .filter(
              (product: ProductType) =>
                product.name && product.active === "TRUE", // Only show active products
            );
          setProducts(parsedProducts);
        }
      } else {
        alert("❌ حدث خطأ. حاول مرة أخرى");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("❌ حدث خطأ. حاول مرة أخرى");
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Save to Google Sheets
      await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData }),
      });

      // 2. Generate WhatsApp message
      const itemsText = formData.items
        .map((i) => `• ${i.name} x${i.quantity} = ${i.price * i.quantity} DA`)
        .join("\n");

      const message = `
      🛒 طلب جديد / NOUVELLE COMMANDE
      --------------------------
      👤 Nom et prénom: ${formData.name}
      📞 Numéro de téléphone: ${formData.phone}
      📍 Wilaya: ${formData.wilaya}
      🏠 Address: ${formData.address}
      --------------------------    
      🛒 Produits:
      ${itemsText}
      --------------------------
      Total: ${total} DA

      ${formData.notes ? `Remarques: ${formData.notes}` : "Aucune information supplémentaire"}`;

      // 3. Open WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_self");

      // Success feedback
      alert("✅ تم إرسال الطلب! سيتم فتح واتساب الآن");
    } catch (error) {
      alert("❌ حدث خطأ. حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 min-h-5/6 min-w-2/3">
        {/* LEFT COLUMN: User Details (Glass Panel) */}
        <div className="flex-1 bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-2xl space-y-4">
          <div className="flex flex-col items-center space-y-2 ">
            <div className="flex items-center gap-4">
              <div className="rounded-full border border-white p-1.5 shadow-[0_5px_25px_-5px_rgba(0,0,0,1)]  ">
                <img
                  src="./washing-machine.png"
                  alt="wasing machine svg"
                  width={30}
                  height={30}
                />
              </div>
              <p className="font-bold text-xl text-white">متجر الاجهزة المنزلية</p>
            </div>
            <p className="text-white/80">يرجى ملئ المعلومات و سيتم تأكيد الطلب عبر الواتساب</p>
          </div>
          {/* Name */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex justify-between items-center w-full">
                  <span>

                    Nom et prénom:
                  </span>
                  <span>

                    :الاسم و اللقب
                  </span>
                </div>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className='w-full bg-white/5 border border-white/10 p-2 rounded outline-none text-white'
                placeholder="أحمد"
              />

            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex justify-between items-center w-full">
                  <span>

                    Numéro de téléphone:
                  </span>
                  <span>

                    :رقم الهاتف
                  </span>
                </div>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={handlePhoneChange}
                className='w-full bg-white/5 border border-white/10 p-2 rounded outline-none text-white'
                placeholder="0555123456"
                pattern="^0[2-7][0-9]{8}$"
                maxLength={10}
              />
              {phoneError && <p className="text-red-400 text-xs font-bold text-right mt-1">{phoneError}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex justify-between items-center w-full">
                  <span>
                    Address:
                  </span>
                  <span>
                    :العنوان
                  </span>
                </div>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  required
                  name="wilaya"
                  value={formData.wilaya}
                  onChange={(e) => {
                    setSelectedWilaya(e.target.value)
                    setFormData({ ...formData, wilaya: e.target.value });
                  }
                  }
                  className="cursor-pointer w-full sm:w-48  bg-white/5 border border-white/10 p-2 rounded text-white outline-none"
                >
                  <option className="text-black" value="">Select Wilaya</option>
                  {wilayasData.map((w) => (
                    <option className="text-black " key={w.id} value={w.name}>{w.id} - {w.name}</option>
                  ))}
                </select>

                {/* Address Field - Grows to fill space */}
                <input
                  required
                  type="text"
                  name="address"
                  placeholder="حي 123 بلوك 5"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="flex-1 bg-white/5 border border-white/10 p-2 rounded outline-none text-white"
                />
              </div>
            </div>

            <div className="backdrop-blur-sm p-4 rounded-xl shadow-2xl w-full border border-white/10">
              {/* Header: Search Input and Label */}
              <div className="flex items-center justify-between gap-2 mb-6">

                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="ابحث عن المنتج..."
                    value={query}
                    disabled={products.length === 0}
                    onChange={(e) => setQuery(e.target.value)}
                    className="disabled:cursor-not-allowed w-full outline-none border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white "
                  />
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span>المنتج</span>
                </div>
              </div>


              {/* Results List */}
              {/* Product */}

              {products.length > 0 ? (
                <div className="space-y-3 max-h-40 overflow-y-scroll p-2
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-[#888]
                [&::-webkit-scrollbar-thumb]:rounded-xl">
                  {filtered.map((product) => (
                    <div key={product.id} className="flex items-center justify-between bg-transparent border-b border-white/20 pb-3">
                      <div className="flex items-center gap-4">
                        <img src={product.image} className=" w-12 h-10 bg-white object-contain rounded" />
                        <div className="text-left">
                          <h4 className="text-white text-sm ">{product.name}</h4>
                          <p className="text-white text-xs fo">{product.price} DA × 1</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="text-white font-bold">{product.price} DA</span>
                        <button
                          key={product.id}
                          onClick={() => {
                            addProduct(product);
                            setQuery("");
                          }}
                          className="bg-transparent border border-gray-500 text-white rounded-md w-8 h-8 flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>) : (<>
                  <div role="status" className="flex items-center justify-center gap-4">
                    <svg aria-hidden="true" className="w-6 h-6 text-black animate-spin fill-blue-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                    </svg>
                    <div className="text-white italic text-center">جاري التحميل...</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Cart Summary (Glass Panel) */}
        <div className="w-full md:w-sm bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-white mb-4 border-b border-white/20 py-5 text-xl font-bold">طلبك</h2>
            {/* Quantity */}
            {formData.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 border border-white/20 mb-2 rounded "
              >
                <img src={item.image}
                  className="transition-all duration-250 origin-center hover:scale-[6] hover:z-50 hover:relative w-12 h-12 object-contain bg-white rounded" />
                <div className="text-white">
                  <p className="text-sm font-semibold max-w-28 line-clamp-1 whitespace-normal wrap-break-word"
                    title={item.name}
                  >{item.name}</p>
                  <p className="text-xs opacity-70">
                    {item.price} DA × {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-white">
                  <button
                    type="button"
                    onClick={() => decreaseQuantity(item.id)}
                    className="text-center bg-transparent border border-white text-white rounded-md w-8 h-8 flex items-center justify-center hover:bg-gray-700 cursor-pointer"
                  >
                    −
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        items: prev.items.map((i) =>
                          i.id === item.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i,
                        ),
                      }))
                    }
                    className="text-center bg-transparent border border-white text-white rounded-md w-8 h-8 flex items-center justify-center hover:bg-gray-700 cursor-pointer"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className=" text-red-500 font-bold cursor-pointer "
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex flex-col text-white font-bold text-right gap-2">
              <span className="text-xl ">: المجموع</span>
              <span className="text-xl">{total} DA</span>
            </div>
            {/* <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl transition-all">
              Send via WhatsApp
            </button>
          </div> */}
            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || formData.items.length === 0}
              className="disabled:cursor-not-allowed w-full bg-emerald-400 text-white p-4 rounded-xl transition-all font-bold  hover:bg-green-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "جاري الإرسال..." : " إرسال الطلب عبر واتساب"}
            </button>
            <p className="text-center font-bold text-white">
              📦 سيتم تأكيد الطلب عبر الهاتف أو واتساب قبل التوصيل
            </p>
          </div>
        </div>

      </form ></div >
  );
}
