"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function OffersPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("applications")
        .select("*")
        .in("status", ["offer", "offered"])
        .order("applied_at", { ascending: false });

      setItems(data || []);
    }

    load();
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-semibold">Offers</h1>
      <p className="mt-2 text-sm text-white/40">
        Candidates who received offers.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/35">
            No offers found.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="border-b border-white/[0.06] px-5 py-4"
            >
              <p className="text-sm">{item.candidate_id}</p>
              <p className="mt-1 text-xs text-white/35">
                Job: {item.job_id}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
