export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/70">
      <div className="container mx-auto py-8 text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} AIFShop. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-rose-600">
            Chính sách
          </a>
          <a href="#" className="hover:text-rose-600">
            Điều khoản
          </a>
          <a href="#" className="hover:text-rose-600">
            Liên hệ
          </a>
        </div>
      </div>
    </footer>
  );
}
