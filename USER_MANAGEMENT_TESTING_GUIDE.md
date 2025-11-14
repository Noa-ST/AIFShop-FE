# User Management Integration - Testing & Usage Guide

## Overview

Complete user management system with Admin dashboard. Admin users can view, filter, and manage all customers and sellers.

## Frontend Integration

### File: `client/pages/Admin/UserManagement.tsx`

**Updated Features:**

- ✅ Connected to real backend API (`/api/admin/users`)
- ✅ Real-time user list with pagination
- ✅ Filter by role (Admin, Seller, Customer)
- ✅ Search by email, name, username
- ✅ Toggle user active/inactive status (🔒/🔓)
- ✅ Change user role (✏️ edit icon)
- ✅ Delete user (🗑️ trash icon)
- ✅ Pagination controls (Previous/Next, page numbers)

### API Service Integrated

```typescript
const userApi = {
  getUsers(page, pageSize, role?, isActive?, search?)
  updateUserStatus(userId, isActive)
  updateUserRole(userId, role)
  deleteUser(userId)
}
```

## Testing Workflow

### 1. Prerequisites

- ✅ Backend running (`dotnet run`)
- ✅ Frontend running (`npm run dev`)
- ✅ Logged in as Admin user
- ✅ Database has test users

### 2. Access Admin Dashboard

1. Navigate to: `http://localhost:5173/admin/users`
2. Should see user list table with stats cards
3. Verify pagination shows correct total count

### 3. Test Filtering

- **By Role:**
  - Select "Seller" from role dropdown → Should show only sellers
  - Select "Customer" from role dropdown → Should show only customers
  - Select "All" → Should show all users

- **By Search:**
  - Type email address → Should filter matching users
  - Type full name → Should filter matching users
  - Type username → Should filter matching users

### 4. Test User Status Toggle

1. Click lock icon (🔒) for an active user
   - Icon should change to unlock (🔓)
   - User should move to inactive state
   - Toast notification should appear

2. Click unlock icon (🔓) for an inactive user
   - Icon should change to lock (🔒)
   - User should move to active state
   - Toast notification should appear

### 5. Test Role Change

1. Click edit icon (✏️) for any user
2. Dialog should open showing current role
3. Select new role from dropdown
4. Click "Xác nhận" (Confirm)
5. User role should update in table
6. Toast notification should appear

### 6. Test Delete User

1. Click trash icon (🗑️) for any user
2. Confirmation dialog should appear
3. Click "OK" to confirm deletion
4. User should disappear from list (soft delete)
5. User count should decrease
6. Toast notification should appear

### 7. Test Pagination

1. If more than 20 users exist, pagination controls should show
2. Click page number → Should load that page
3. Click "Tiếp" (Next) → Should go to next page
4. Click "Trước" (Previous) → Should go to previous page
5. Buttons should disable at boundaries (first/last page)

## Backend Endpoints Reference

### GET /api/admin/users

List users with filters and pagination

**Query Parameters:**

```
page: int (default: 1)
pageSize: int (default: 20)
role: string? ("Admin" | "Seller" | "Customer")
isActive: boolean?
search: string? (searches email, fullName, userName)
```

**Response:**

```json
{
  "data": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "userName": "nguyenvan_a",
      "roles": ["Customer"],
      "isActive": true,
      "createdAt": "2025-11-14",
      "lastLoginAt": "2025-11-14"
    }
  ],
  "totalCount": 100,
  "page": 1,
  "pageSize": 20
}
```

### PUT /api/admin/users/{userId}/status

Toggle user active/inactive

**Body:**

```json
{ "isActive": false }
```

### PUT /api/admin/users/{userId}/role

Change user role

**Body:**

```json
{ "role": "Seller" }
```

### DELETE /api/admin/users/{userId}

Soft delete user (marks as inactive)

## Database Schema

**ApplicationUser Fields Used:**

- `Id` - UUID primary key
- `Email` - User email address
- `FullName` - Display name
- `UserName` - Login username
- `IsActive` - Boolean flag (soft delete indicator)
- `CreatedAt` - Account creation timestamp
- `LastLoginAt` - Last login timestamp

**AspNetUserRoles Table:**

- Maps users to roles (Admin, Seller, Customer)
- Multiple roles can be assigned to one user

## Common Issues & Fixes

### Issue: "Unauthorized" error when accessing /admin/users

**Fix:** Ensure you're logged in as Admin user. Check JWT token includes Admin role.

### Issue: No users showing in table

**Fix:**

1. Verify backend is running
2. Check database has users created
3. Check browser console for API errors
4. Verify role filter is set to "all"

### Issue: Delete user confirmation not appearing

**Fix:** Ensure JavaScript confirm dialog is enabled in browser

### Issue: Role change dialog won't open

**Fix:**

1. Check for browser console errors
2. Ensure user data loaded properly
3. Try refreshing page

### Issue: Pagination buttons disabled

**Fix:** This is normal if all users fit on one page (totalPages = 1)

## Performance Considerations

**Page Size:** Default 20 users per page (adjustable in code)

- Smaller = faster loading, more pagination
- Larger = slower loading, fewer clicks

**Caching:**

- React Query caches for 30 seconds (`staleTime: 30000`)
- Manual refetch after mutations (status, role, delete)

**Optimization Tips:**

1. Use search to reduce dataset before pagination
2. Filter by role to narrow results
3. Consider server-side filtering for >10k users

## Feature Roadmap

**Current Features:** ✅

- List users with pagination
- Filter by role and search
- Toggle user status
- Change user role
- Delete users (soft delete)

**Future Enhancements:** 📋

- Bulk actions (select multiple users)
- Export users to CSV
- User details modal
- Activity audit log
- Email notifications for role changes
- Advanced filters (date range, status history)
- User import from CSV

## Security Notes

⚠️ **Important:**

- All endpoints require `[Authorize(Roles = "Admin")]`
- Only Admin users can access `/admin/users`
- Soft delete prevents data loss
- Role changes logged in database
- All mutations audit-logged

## Deployment Checklist

Before deploying to production:

- [ ] Test all CRUD operations
- [ ] Verify pagination works with large datasets
- [ ] Test error handling (network failures)
- [ ] Verify permission checks work
- [ ] Test role-based access control
- [ ] Load test with 1000+ users
- [ ] Verify soft delete doesn't expose deleted users
- [ ] Audit all admin actions are logged

---

**Status:** ✅ Ready for Testing
**Last Updated:** 2025-11-15
**Tested On:** React 18.3.1 + .NET Core 8
