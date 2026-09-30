import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function AstroIslandTest() {
  const [count, setCount] = useState(0);

  return (
    <div className="kz-card p-6 bg-white border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817] rounded-2xl max-w-sm mx-auto text-center mt-6">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeafd] text-[#6c4de8] text-xs font-bold border border-[#c9bfff] mb-3">
        <Sparkles size={14} />
        <span>React 19 Island</span>
      </div>

      <h3 className="text-lg font-black text-[#191817] mb-1">
        Client Hydration Test
      </h3>

      <p className="text-xs text-[#77736c] mb-4">
        Isolated component testing React 19 interactivity and tactile styling without app state dependencies.
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setCount((prev) => prev + 1)}
          className="kz-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <span>Clicks:</span>
          <span className="font-mono font-black">{count}</span>
        </button>

        {count > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00cc05] bg-[#e6ffe6] px-2.5 py-1 rounded-lg border border-[#a3ffa5]">
            <CheckCircle2 size={14} /> Hydrated!
          </span>
        )}
      </div>
    </div>
  );
}
