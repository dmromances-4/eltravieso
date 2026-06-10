"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function StarRating({ slug, initialAvg = 0, initialCount = 0 }: {
  slug: string;
  initialAvg?: number;
  initialCount?: number;
}) {
  const { data: session } = useSession();
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [hover, setHover] = useState(0);

  const rate = async (score: number) => {
    if (!session?.user) return;
    const res = await fetch(`/api/media/${slug}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    const data = await res.json();
    if (res.ok) {
      setAvg(data.rating.avg);
      setCount(data.rating.count);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!session?.user}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => rate(star)}
            className="text-2xl disabled:cursor-not-allowed"
            aria-label={`${star} estrellas`}
          >
            <span className={(hover || Math.round(avg)) >= star ? "text-electric-yellow" : "text-slate-600"}>★</span>
          </button>
        ))}
      </div>
      <span className="text-sm text-slate-400">
        {avg > 0 ? `${avg.toFixed(1)} · ${count} votos` : "Sin valoraciones"}
      </span>
    </div>
  );
}
