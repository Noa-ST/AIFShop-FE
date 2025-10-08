import { Link } from "react-router-dom";

export type Shop = {
  id: string;
  name: string;
  logo: string;
  description: string;
};

export default function ShopCard({ shop }: { shop: Shop }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-rose-100/60 hover:border-rose-200 transition-colors">
      <div className="flex items-center gap-4">
        <img src={shop.logo} alt={shop.name} className="w-14 h-14 rounded-full object-cover" />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{shop.name}</h3>
          <p className="text-sm text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap" title={shop.description}>{shop.description}</p>
        </div>
        <Link to={`/shops/${shop.id}`} className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm hover:bg-rose-700">Xem shop</Link>
      </div>
    </div>
  );
}
