import React from "react";
import { useNavigate } from "react-router-dom";
import { GlobalCategoryForm } from "./GlobalCategoryForm";

export default function CreateGlobalCategory() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/admin/global-categories");
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tạo Danh mục Global mới</h1>
          <p className="text-muted-foreground mt-2">
            Tạo một danh mục global mới cho hệ thống. Danh mục này sẽ có thể
            được sử dụng bởi tất cả các shop.
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <GlobalCategoryForm onSuccess={handleSuccess} mode="embedded" />
        </div>
      </div>
    </div>
  );
}
