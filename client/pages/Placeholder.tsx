import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Placeholder({
  title = "Đang xây dựng",
}: {
  title?: string;
}) {
  return (
    <section className="py-24">
      <div className="container mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-semibold"
        >
          {title}
        </motion.h1>
        <p className="mt-4 text-slate-600 max-w-xl mx-auto">
          Hãy tiếp tục yêu cầu để hoàn thiện trang này. Các chức năng sẽ được
          thêm theo đặc tả AIFShop.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-full bg-rose-600 text-white hover:bg-rose-700"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </section>
  );
}
