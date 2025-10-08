import { motion } from "framer-motion";
import ProductCard, { Product } from "@/components/ProductCard";
import ShopCard, { Shop } from "@/components/ShopCard";

const heroImg =
  "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1600&auto=format&fit=crop";

const featuredCategories = [
  {
    key: "dress",
    name: "Váy",
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "shoes",
    name: "Giày",
    image:
      "https://images.unsplash.com/photo-1520256862855-398228c41684?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "bag",
    name: "Túi xách",
    image:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0a1?q=80&w=1200&auto=format&fit=crop",
  },
];

const products: Product[] = [
  {
    id: "p1",
    name: "Đầm lụa cổ điển",
    price: 1299000,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p2",
    name: "Giày cao gót ánh kim",
    price: 1599000,
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p3",
    name: "Túi xách da mini",
    price: 1899000,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p4",
    name: "Áo khoác dạ cao cấp",
    price: 2399000,
    image:
      "https://images.unsplash.com/photo-1542060748-10c28b62716f?q=80&w=1200&auto=format&fit=crop",
  },
];

const shops: Shop[] = [
  {
    id: "s1",
    name: "Lumière Boutique",
    logo: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300&auto=format&fit=crop",
    description: "Thời trang nữ cao cấp, tinh tế và hiện đại.",
  },
  {
    id: "s2",
    name: "Vogue Atelier",
    logo: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=300&auto=format&fit=crop",
    description: "BST xu hướng, phụ kiện độc đáo, chất liệu cao cấp.",
  },
];

export default function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto grid md:grid-cols-2 gap-10 py-16 md:py-24 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-serif text-4xl md:text-5xl leading-tight text-slate-900"
            >
              Khám phá bộ sưu tập mới
            </motion.h1>
            <p className="mt-4 text-slate-600 text-base md:text-lg max-w-xl">
              Phong cách tinh tế cho mùa mới. Chọn lựa những thiết kế thời
              thượng, chất liệu cao cấp và phom dáng hiện đại.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <a
                href="#featured"
                className="px-6 py-3 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
              >
                Mua ngay
              </a>
              <a
                href="/products"
                className="px-6 py-3 rounded-full border border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Xem sản phẩm
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[24px] shadow-[0_40px_80px_-40px_rgba(225,29,72,0.35)]">
              <img
                src={heroImg}
                alt="Fashion hero"
                className="w-full h-[420px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <div className="container mx-auto">
          <h2 className="font-semibold text-xl mb-4">Danh mục nổi bật</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredCategories.map((c) => (
              <div
                key={c.key}
                className="group relative overflow-hidden rounded-2xl"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-medium">
                  {c.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shops */}
      <section className="py-16">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-xl">Cửa hàng nổi bật</h2>
            <a href="/shops" className="text-rose-600 hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {shops.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="featured" className="py-16 bg-[#FFF7F9]">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-xl">Sản phẩm nổi bật</h2>
            <a href="/products" className="text-rose-600 hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
