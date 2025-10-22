import React from 'react';

export default function FiltersSidebar() {
  return (
    <aside className="bg-white rounded-2xl p-4 shadow-sm">
      <h4 className="font-semibold text-lg">Filters</h4>

      <div className="mt-4 space-y-6">
        <section>
          <h5 className="font-medium mb-2">Categories</h5>
          <ul className="text-sm text-slate-600 space-y-2">
            <li className="flex items-center justify-between py-2 border-b border-slate-100">T-shirts</li>
            <li className="flex items-center justify-between py-2 border-b border-slate-100">Shorts</li>
            <li className="flex items-center justify-between py-2 border-b border-slate-100">Shirts</li>
            <li className="flex items-center justify-between py-2 border-b border-slate-100">Hoodie</li>
            <li className="flex items-center justify-between py-2">Jeans</li>
          </ul>
        </section>

        <section>
          <h5 className="font-medium mb-2">Price</h5>
          <div className="p-3 bg-slate-50 rounded">$50 - $200</div>
        </section>

        <section>
          <h5 className="font-medium mb-2">Colors</h5>
          <div className="flex gap-2 flex-wrap">
            {['#22c55e','#ef4444','#f97316','#facc15','#06b6d4','#6366f1','#ec4899','#ffffff','#000000'].map(c => (
              <button key={c} aria-label={`Color ${c}`} style={{background: c}} className={`w-7 h-7 rounded-full border ${c === '#ffffff' ? 'border-slate-200' : 'border-transparent'}`} />
            ))}
          </div>
        </section>

        <section>
          <h5 className="font-medium mb-2">Size</h5>
          <div className="flex flex-wrap gap-2">
            {['XX-Small','X-Small','Small','Medium','Large','X-Large'].map(s => (
              <button key={s} className="px-3 py-1 rounded-full bg-slate-100 text-sm">{s}</button>
            ))}
          </div>
        </section>

        <div>
          <button className="w-full py-3 rounded-full bg-slate-900 text-white font-semibold">Apply Filter</button>
        </div>
      </div>
    </aside>
  );
}
