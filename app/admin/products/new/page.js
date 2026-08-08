'use client';

import { useState } from 'react';
import { supabase, uploadImage } from '../../../../lib/supabase'; // تم تعديل المسار ليتوافق مع المشروع

export default function AddProductForm() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. دالة رفع الصورة فور اختيارها من الجهاز
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    // رفع الصورة إلى مجلد 'Public Bucket' في Supabase
    const uploadedUrl = await uploadImage(file, 'Public Bucket');

    if (uploadedUrl) {
      setImageUrl(uploadedUrl); // حفظ رابط الصورة المباشر في المتغير
      console.log('تم رفع الصورة بنجاح:', uploadedUrl);
    } else {
      alert('فشل رفع الصورة، يُرجى المحاولة مرة أخرى.');
    }
    setUploading(false);
  };

  // 2. دالة حفظ المنتج بالكامل (مع رابط الصورة) في Supabase أو السيرفر
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('الرجاء رفع صورة للمنتج أولاً!');
      return;
    }

    setLoading(true);

    // إضافة البيانات إلى جدول 'products' في قاعدة بيانات Supabase
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: name,
          price: parseFloat(price),
          description: description,
          image: imageUrl // حفظ رابط الصورة هنا
        }
      ]);

    if (error) {
      alert('حدث خطأ أثناء حفظ المنتج: ' + error.message);
    } else {
      alert('تم إضافة المنتج بنجاح!');
      // تفريغ النموذج
      setName('');
      setPrice('');
      setDescription('');
      setImageUrl('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white shadow rounded-lg space-y-4 my-10" dir="rtl">
      <h2 className="text-xl font-bold mb-4">إضافة منتج جديد</h2>

      {/* اسم المنتج */}
      <div>
        <label className="block mb-1 font-medium">اسم المنتج:</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* السعر */}
      <div>
        <label className="block mb-1 font-medium">السعر:</label>
        <input
          type="number"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* الوصف */}
      <div>
        <label className="block mb-1 font-medium">الوصف:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* ارفاق الصورة */}
      <div>
        <label className="block mb-1 font-medium">صورة المنتج:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={uploading}
          className="w-full text-sm text-gray-500 border p-2 rounded file:ml-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {uploading && <p className="text-sm text-blue-500 mt-2">جاري رفع الصورة إلى Supabase...</p>}

        {imageUrl && (
          <div className="mt-3">
            <p className="text-xs text-green-600 mb-1">معاينة الصورة المرفوعة:</p>
            <img src={imageUrl} alt="Uploaded product" className="w-28 h-28 object-cover rounded border" />
          </div>
        )}
      </div>

      {/* زر الحفظ */}
      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
      </button>
    </form>
  );
}
