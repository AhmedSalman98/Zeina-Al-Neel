import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * دالة لرفع الصورة إلى Supabase Storage وإرجاع رابطها المباشر
 * @param {File} file - ملف الصورة المراد رفعه
 * @param {string} bucketName - اسم الـ Bucket (الافتراضي Public Bucket)
 */
export async function uploadImage(file, bucketName = 'Public Bucket') {
  try {
    if (!file) return null;

    // 1. إنشاء اسم فريد للملف منعاً للتضارب
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `items/${fileName}`;

    console.log(`Uploading to bucket: ${bucketName}, path: ${filePath}`);

    // 2. رفع الصورة
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image to Supabase:', error);
      alert(`خطأ في الرفع: ${error.message}`); // تنبيه للمستخدم بالخطأ الحقيقي
      return null;
    }

    // 3. الحصول على رابط الصورة المباشر
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return null;
  }
}
