"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function BackButton({ fallback = "/" }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button className="back-button" onClick={goBack}>
      <ArrowRight size={18}/>
      رجوع
    </button>
  );
}
