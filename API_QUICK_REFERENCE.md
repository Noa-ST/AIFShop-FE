# Admin API Quick Reference

## 🔑 Authentication

All endpoints require `Authorization: Bearer {jwt-token}` header
All endpoints require user to have `Admin` role

## 📦 Response Format

**Success Response:**

```json
{
  "data": [...],
  "totalCount": 100,
  "page": 1,
  "pageSize": 20
}
```

**Error Response:**

```json
{
  "message": "Error description",
  "statusCode": 400
}
```

---

## 👥 User Management Endpoints

### 1. Get All Users

```
GET /api/admin/users?page=1&pageSize=20&role=Customer&search=nguyen
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number (default: 1) |
| pageSize | int | No | Records per page (default: 20) |
| role | string | No | Filter: "Admin", "Seller", or "Customer" |
| isActive | bool | No | Filter: true or false |
| search | string | No | Search email, fullName, or userName |

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "customer@example.com",
      "fullName": "Nguyễn Văn A",
      "userName": "nguyenvan_a",
      "roles": ["Customer"],
      "isActive": true,
      "createdAt": "2025-11-14T10:30:00Z",
      "lastLoginAt": "2025-11-15T08:45:00Z"
    }
  ],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20
}
```

### 2. Get Sellers Only

```
GET /api/admin/users/sellers?page=1&pageSize=20
```

Same response format, pre-filtered to Seller role only.

### 3. Get Customers Only

```
GET /api/admin/users/customers?page=1&pageSize=20
```

Same response format, pre-filtered to Customer role only.

### 4. Update User Status

```
PUT /api/admin/users/{userId}/status
Content-Type: application/json

{
  "isActive": false
}
```

**Response:**

```json
{
  "message": "User status updated successfully",
  "statusCode": 200
}
```

### 5. Update User Role

```
PUT /api/admin/users/{userId}/role
Content-Type: application/json

{
  "role": "Seller"
}
```

**Allowed Roles:**

- Admin
- Seller
- Customer

### 6. Delete User (Soft Delete)

```
DELETE /api/admin/users/{userId}
```

**Response:**

```json
{
  "message": "User deleted successfully",
  "statusCode": 200
}
```

---

## 🔍 Example Requests

### Get first page of customers

```bash
curl -X GET "http://localhost:8080/api/admin/users?page=1&pageSize=20&role=Customer" \
  -H "Authorization: Bearer <token>"
```

### Search for user by email

```bash
curl -X GET "http://localhost:8080/api/admin/users?search=nguyen%40example.com" \
  -H "Authorization: Bearer <token>"
```

### Deactivate user

```bash
curl -X PUT "http://localhost:8080/api/admin/users/user-id-123/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Promote customer to seller

```bash
curl -X PUT "http://localhost:8080/api/admin/users/user-id-123/role" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "Seller"}'
```

### Soft delete user

```bash
curl -X DELETE "http://localhost:8080/api/admin/users/user-id-123" \
  -H "Authorization: Bearer <token>"
```

---

## ⚡ Status Codes

| Code | Meaning      | Cause                      |
| ---- | ------------ | -------------------------- |
| 200  | OK           | Request successful         |
| 400  | Bad Request  | Invalid parameters or body |
| 401  | Unauthorized | Missing or invalid token   |
| 403  | Forbidden    | User is not Admin          |
| 404  | Not Found    | User ID not found          |
| 500  | Server Error | Database or server issue   |

---

## 🎯 Common Workflows

### Workflow 1: Find and deactivate inactive customers

```
1. GET /api/admin/users?role=Customer&isActive=true
2. Search result for target user
3. PUT /api/admin/users/{id}/status with isActive: false
```

### Workflow 2: Promote seller to admin

```
1. GET /api/admin/users/sellers
2. Find user to promote
3. PUT /api/admin/users/{id}/role with role: "Admin"
```

### Workflow 3: Find user by email and get details

```
1. GET /api/admin/users?search=user@example.com
2. Response contains full user details in data array
```

### Workflow 4: Clean up inactive users

```
1. GET /api/admin/users?isActive=false
2. For each user: DELETE /api/admin/users/{id}
```

---

## 🔒 Security Notes

⚠️ **Important:**

- All endpoints require valid JWT token
- All endpoints require Admin role
- Tokens expire after 1 hour (configurable)
- Failed login attempts are throttled
- All actions are audit-logged

---

## 🐛 Error Handling

**Invalid token:**

```json
{
  "message": "Unauthorized: Invalid token",
  "statusCode": 401
}
```

**Not Admin:**

```json
{
  "message": "Forbidden: Admin role required",
  "statusCode": 403
}
```

**User not found:**

```json
{
  "message": "User not found",
  "statusCode": 404
}
```

**Invalid role:**

```json
{
  "message": "Invalid role. Must be Admin, Seller, or Customer",
  "statusCode": 400
}
```

---

## 📊 Pagination Guide

**Get total pages:**

```
totalPages = ceil(totalCount / pageSize)
```

**Example:**

- totalCount: 150
- pageSize: 20
- totalPages: 8 (150 / 20 = 7.5 → 8)

**Valid page range:** 1 to totalPages

---

## 🚀 Frontend Integration Template

```typescript
// API Service
const userApi = {
  async getUsers(page = 1, pageSize = 20, role?, search?) {
    const params = new URLSearchParams({ page, pageSize });
    if (role) params.append("role", role);
    if (search) params.append("search", search);
    const res = await fetch(`/api/admin/users?${params}`);
    return res.json();
  },

  async updateStatus(userId, isActive) {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    return res.json();
  },

  async updateRole(userId, role) {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return res.json();
  },

  async deleteUser(userId) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    return res.json();
  },
};

// React Query Usage
const { data, isLoading, refetch } = useQuery({
  queryKey: ["adminUsers", page, role, search],
  queryFn: () => userApi.getUsers(page, 20, role, search),
});
```

---

## 📋 Rate Limits

- **Default:** No strict rate limiting (configurable)
- **Recommended:** 60 requests/minute per user
- **Bulk operations:** Should use batching API (future)

---

## ✅ Validation Rules

| Field    | Rules                               |
| -------- | ----------------------------------- |
| role     | Must be: Admin, Seller, or Customer |
| isActive | Must be boolean (true/false)        |
| page     | Must be >= 1                        |
| pageSize | Must be between 1 and 100           |
| search   | Max 100 characters                  |
| userId   | Must be valid UUID format           |

---

**Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** PRODUCTION-READY ✅
