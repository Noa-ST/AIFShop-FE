import ProductCard from "@/components/ProductCard";
import FiltersSidebar from "@/components/FiltersSidebar";

// Mock data used for UI-only frontend development (no network calls)
const mockProducts = [
  {
    id: "p1",
    name: "Gradient Graphic T-shirt",
    price: 145,
    oldPrice: null,
    rating: 3.5,
    productImages: [{ id: "i1", url: "https://www.gmcompanystore.com/cdn/shop/files/7462-MilGrnFst-5-DM130MilGrnFstFlatFront2-1200Wcopy.png?v=1755026253&width=2048" }],
  },
  {
    id: "p2",
    name: "Polo with Tipping Details",
    price: 180,
    oldPrice: null,
    rating: 4.5,
    productImages: [{ id: "i2", url: "https://7d6c0583.aerocdn.com/image-factory/e401c795f3d03d0af5be9bfa81d26770724b40e5~1336x1598:upscale/images/products/YTw0e8TJsty3S8LEjRaE4ujyYAXQhH73NdVPTf4k.jpg" }],
  },
  {
    id: "p3",
    name: "Black Striped T-shirt",
    price: 120,
    oldPrice: 150,
    rating: 5.0,
    productImages: [{ id: "i3", url: "https://crocodile.in/cdn/shop/files/2_bec645d6-85f6-4a38-b7fa-4e7904aca666.jpg?v=1723798755&width=1080" }],
  },
  // ...more mock items to fill the grid
  { id: "p4", name: "Skinny Fit Jeans", price: 240, oldPrice: 260, rating: 3.5, productImages: [{ id: 'i4', url: 'https://img01.ztat.net/article/spp-media-p1/85488fe3c0674d918ea80bdc447d1b6f/7e195736cbdc494396f3f9538faf1268.jpg?imwidth=1800' }] },
  { id: "p5", name: "Checkered Shirt", price: 180, rating: 4.5, productImages: [{ id: 'i5', url: 'https://static.massimodutti.net/assets/public/2198/a473/493c48eea16e/b251e1c84ea8/05100799701-o7/05100799701-o7.jpg?ts=1747897315493' }] },
  { id: "p6", name: "Sleeve Striped T-shirt", price: 130, oldPrice: 160, rating: 4.5, productImages: [{ id: 'i6', url: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/468879/item/goods_57_468879_3x4.jpg' }] },
  { id: "p7", name: "Vertical Striped Shirt", price: 212, oldPrice: 232, rating: 5.0, productImages: [{ id: 'i7', url: 'https://d1pdzcnm6xgxlz.cloudfront.net/tops/8905875389903-9.jpg' }] },
  { id: "p8", name: "Courage Graphic T-shirt", price: 145, rating: 4.0, productImages: [{ id: 'i8', url: 'https://cdn.media.amplience.net/s/hottopic/31436641_hi' }] },
  { id: "p9", name: "Loose Fit Bermuda Shorts", price: 80, rating: 3.0, productImages: [{ id: 'i9', url: 'https://i5.walmartimages.com/seo/UTSJKR-Women-s-Baggy-Bermuda-Cargo-Shorts-with-Pockets-High-Waist-Drawstring-Wide-Leg-Denim-Jean-Shorts-Summer-Loose-Fit-Shorts-Black-XXL_62738c2b-63f7-4259-a31d-a8b5096acce2.9012c23d9c30b48d12e3f3497aa9297d.jpeg' }] },
];

export default function ProductList() {
  const products = mockProducts;

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <nav className="text-sm text-slate-500 mb-4">Home &gt; Casual</nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">Casual</h1>
          <div className="text-sm text-slate-500">Showing 1-10 of 100 Products &nbsp; Sort by: <span className="font-medium text-slate-900">Most Popular</span></div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <FiltersSidebar />
          </div>

          <div className="col-span-12 lg:col-span-9">
            <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full border">&larr; Previous</button>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 rounded bg-slate-100">1</button>
                <button className="px-3 py-2 rounded">2</button>
                <span className="px-2">...</span>
                <button className="px-3 py-2 rounded">10</button>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full border">Next &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
