# 🏗️ SYSTEM ARCHITECTURE DIAGRAM

## Complete Admin Dashboard Architecture

```
╔════════════════════════════════════════════════════════════════════════════╗
║                         ADMIN DASHBOARD SYSTEM                             ║
║                          (November 14, 2025)                               ║
╚════════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER (Admin Login)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  http://localhost:5173/admin/users  or  http://localhost:5173/admin/reviews
│  │                                                                     │   │
│  │  Admin sends JWT token with all requests                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                    HTTP Requests (with JWT token)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND - React 18 + TypeScript                         │
│                      (http://localhost:5173)                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  App.tsx                                                            │  │
│  │  ├── Route: /admin/users → UserManagement.tsx ✅                  │  │
│  │  ├── Route: /admin/reviews → Reviews.tsx ✅                       │  │
│  │  └── AdminLayout wraps all admin pages                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  UserManagement.tsx (580 lines)                                    │  │
│  │  ├── useQuery: fetchUsers (React Query)                           │  │
│  │  ├── useMutation: updateStatus, updateRole, deleteUser          │  │
│  │  ├── UI Components                                               │  │
│  │  │   ├── Stats Cards (Total, Active, Sellers, Customers)       │  │
│  │  │   ├── Search & Filter Controls                              │  │
│  │  │   ├── User Table (with 🔒🔓 ✏️ 🗑️ buttons)               │  │
│  │  │   ├── Role Change Dialog                                    │  │
│  │  │   ├── Pagination Controls                                   │  │
│  │  │   └── Toast Notifications                                   │  │
│  │  └── API Service Methods                                        │  │
│  │      ├── getUsers()                                             │  │
│  │      ├── updateUserStatus()                                     │  │
│  │      ├── updateUserRole()                                       │  │
│  │      └── deleteUser()                                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Reviews.tsx (existing)                                           │  │
│  │  ├── UI Components                                               │  │
│  │  │   ├── Pending Reviews Table                                  │  │
│  │  │   ├── Approve/Reject Buttons (✓ ✗)                         │  │
│  │  │   ├── Reject Reason Dialog                                  │  │
│  │  │   └── Pagination (10 per page)                              │  │
│  │  └── API Calls                                                 │  │
│  │      ├── GET pending reviews                                   │  │
│  │      ├── PUT approve                                           │  │
│  │      └── PUT reject                                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Libraries:                                                                │
│  • React 18.3.1 - UI framework                                           │
│  • React Query - Data fetching & caching                                 │
│  • React Router 6 - Navigation                                           │
│  • Tailwind CSS 3 - Styling                                              │
│  • shadcn/ui - Pre-built components                                      │
│  • Lucide React - Icons                                                  │
│  • TypeScript - Type safety                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                        API Calls (fetch)
                    GET /api/admin/users?...
                    PUT /api/admin/users/.../status
                    PUT /api/admin/users/.../role
                    DELETE /api/admin/users/...
                    GET /api/Admin/reviews/pending
                    PUT /api/Admin/reviews/.../approve
                    PUT /api/Admin/reviews/.../reject
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 BACKEND - ASP.NET Core 8 (C#)                              │
│                   (http://localhost:8080/api)                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  AdminController.cs (180 lines) ✅ NEW                              │  │
│  │                                                                     │  │
│  │  [ApiController]                                                  │  │
│  │  [Route("api/admin")]                                             │  │
│  │  [Authorize(Roles = "Admin")]  ← Security Gate                    │  │
│  │  public class AdminController                                     │  │
│  │  {                                                               │  │
│  │      ├── GET /users                → GetUsers()               │  │
│  │      │   Query: page, pageSize, role, isActive, search        │  │
│  │      │   Returns: PagedResult<UserDto>                        │  │
│  │      │                                                         │  │
│  │      ├── GET /users/sellers        → GetSellers()            │  │
│  │      │   Returns: PagedResult<UserDto>                        │  │
│  │      │                                                         │  │
│  │      ├── GET /users/customers      → GetCustomers()          │  │
│  │      │   Returns: PagedResult<UserDto>                        │  │
│  │      │                                                         │  │
│  │      ├── PUT /users/{id}/status    → UpdateUserStatus()      │  │
│  │      │   Body: { isActive: bool }                            │  │
│  │      │   Returns: ServiceResponse                            │  │
│  │      │                                                         │  │
│  │      ├── PUT /users/{id}/role      → UpdateUserRole()        │  │
│  │      │   Body: { role: string }                              │  │
│  │      │   Returns: ServiceResponse                            │  │
│  │      │                                                         │  │
│  │      ├── DELETE /users/{id}        → DeleteUser()            │  │
│  │      │   Returns: ServiceResponse                            │  │
│  │      │                                                         │  │
│  │      └── (Review endpoints - existing)                       │  │
│  │  }                                                             │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                 ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  IUserService (30 lines) ✅ NEW                                    │  │
│  │                                                                     │  │
│  │  public interface IUserService                                    │  │
│  │  {                                                               │  │
│  │      Task<PagedResult<object>> GetUsersAsync(                  │  │
│  │          int page, int pageSize,                               │  │
│  │          string? role, bool? isActive, string? search)        │  │
│  │                                                                │  │
│  │      Task<ServiceResponse> UpdateUserStatusAsync(             │  │
│  │          string userId, bool isActive)                        │  │
│  │                                                                │  │
│  │      Task<ServiceResponse> UpdateUserRoleAsync(               │  │
│  │          string userId, string newRole)                       │  │
│  │                                                                │  │
│  │      Task<ServiceResponse> DeleteUserAsync(                   │  │
│  │          string userId)                                       │  │
│  │  }                                                             │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                 ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  UserService.cs (150 lines) ✅ NEW                                 │  │
│  │                                                                     │  │
│  │  public class UserService : IUserService                          │  │
│  │  {                                                               │  │
│  │      private UserManager<ApplicationUser> _userManager          │  │
│  │      private RoleManager<IdentityRole> _roleManager             │  │
│  │      private IUnitOfWork _uow                                    │  │
│  │                                                                 │  │
│  │      GetUsersAsync()                                            │  │
│  │      ├── Filter by role: UserManager.GetUsersInRoleAsync()    │  │
│  │      ├── Filter by status: u.IsActive == isActive              │  │
│  │      ├── Filter by search: email/fullName/userName             │  │
│  │      ├── Sort: OrderByDescending(u => u.CreatedAt)             │  │
│  │      ├── Paginate: Skip/Take                                    │  │
│  │      └── Return with roles for each user                       │  │
│  │                                                                 │  │
│  │      UpdateUserStatusAsync()                                    │  │
│  │      ├── Find user by ID                                       │  │
│  │      ├── Toggle IsActive flag                                  │  │
│  │      └── Update via UserManager                                │  │
│  │                                                                 │  │
│  │      UpdateUserRoleAsync()                                      │  │
│  │      ├── Find user by ID                                       │  │
│  │      ├── Validate role exists                                  │  │
│  │      ├── Remove old roles                                      │  │
│  │      └── Add new role                                          │  │
│  │                                                                 │  │
│  │      DeleteUserAsync()                                          │  │
│  │      ├── Find user by ID                                       │  │
│  │      ├── Set IsActive = false (Soft Delete)                   │  │
│  │      └── Update via UserManager                                │  │
│  │  }                                                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                 ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ServiceContainer.cs (MODIFIED)                                    │  │
│  │                                                                     │  │
│  │  services.AddScoped<IUserService, UserService>();  ✅ NEW        │  │
│  │                                                                     │  │
│  │  (Other existing service registrations...)                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Framework:                                                                │
│  • ASP.NET Core 8 - REST API framework                                    │
│  • Entity Framework Core 8 - ORM                                          │
│  • Identity Framework - Authentication/Authorization                      │
│  • AutoMapper - DTO mapping                                               │
│  • C# 12 - Language                                                       │
│  • SQL - Database queries                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                    SQL Queries via EF Core
                    DbContext, DbSet queries
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE - PostgreSQL                              │
│                    (Cloud: Render or local instance)                       │
│                                                                             │
│  ┌──────────────────────────┐      ┌──────────────────────────┐           │
│  │  AspNetUsers             │      │  AspNetRoles             │           │
│  │  ─────────────────────── │      │  ─────────────────────── │           │
│  │  Id (PK)                 │      │  Id (PK)                 │           │
│  │  Email                   │      │  Name (Admin/Seller/..) │           │
│  │  UserName                │      │  NormalizedName          │           │
│  │  FullName ✅ NEW          │      │  ConcurrencyStamp        │           │
│  │  IsActive ✅ NEW          │      └──────────────────────────┘           │
│  │  CreatedAt               │                                              │
│  │  LastLoginAt             │      ┌──────────────────────────┐           │
│  │  PasswordHash            │      │  AspNetUserRoles         │           │
│  │  ConcurrencyStamp        │      │  ─────────────────────── │           │
│  └──────────────────────────┘      │  UserId (FK)             │           │
│            │                        │  RoleId (FK)             │           │
│            │                        └──────────────────────────┘           │
│            └──── 1:Many ────────────────────┘                             │
│                                                                             │
│  User ↔ Role Relationship:                                                │
│  • One user can have multiple roles                                       │
│  • Queried via UserManager.GetRolesAsync()                               │
│  • Set via UserManager.AddToRoleAsync()                                  │
│  • Removed via UserManager.RemoveFromRoleAsync()                         │
│                                                                             │
│  Note: Reviews table also exists (not shown) with Product/User FK        │
└─────────────────────────────────────────────────────────────────────────────┘


═════════════════════════════════════════════════════════════════════════════

                         DATA FLOW DIAGRAM

═════════════════════════════════════════════════════════════════════════════

SCENARIO 1: Admin Views Users List
─────────────────────────────────────────────────────────────────────────────

1. Admin navigates to /admin/users
   ↓
2. UserManagement.tsx mounts
   ↓
3. useQuery hook triggers fetchUsers()
   ↓
4. Fetch to GET /api/admin/users?page=1&pageSize=20
   ↓ (includes JWT token in Authorization header)
   ↓
5. AdminController.GetUsers() executes
   ├─ Verify [Authorize(Roles = "Admin")] ✅
   ├─ Call IUserService.GetUsersAsync()
   ├─ UserService filters/paginates data
   ├─ Query AspNetUsers table from database
   ├─ Get roles for each user
   └─ Return PagedResult<object> with 20 users
   ↓
6. Frontend receives response
   ├─ React Query caches results (30s)
   ├─ Component re-renders with data
   ├─ Display user table with actions
   ├─ Display pagination controls
   └─ Show stats (total, active, sellers, customers)


SCENARIO 2: Admin Changes User Status
─────────────────────────────────────────────────────────────────────────────

1. Admin clicks 🔒 (lock) button on active user
   ↓
2. handleStatusToggle() called with userId and currentStatus
   ↓
3. useMutation triggers updateUserStatus(userId, false)
   ↓
4. Fetch to PUT /api/admin/users/{userId}/status
   ├─ Body: { isActive: false }
   └─ JWT token in header
   ↓
5. AdminController.UpdateUserStatus() executes
   ├─ Verify [Authorize] ✅
   ├─ Call IUserService.UpdateUserStatusAsync()
   ├─ UserService finds user by ID
   ├─ Set IsActive = false
   ├─ Update via UserManager
   └─ Return ServiceResponse
   ↓
6. Frontend mutation succeeds
   ├─ Show toast: "User deactivated"
   ├─ Refetch user list
   ├─ User now shows 🔓 (unlock) icon
   └─ Status badge changes to "Không hoạt động"


SCENARIO 3: Admin Changes User Role
─────────────────────────────────────────────────────────────────────────────

1. Admin clicks ✏️ (edit) button
   ↓
2. Dialog opens with role dropdown
   ↓
3. Admin selects new role (e.g., "Seller")
   ↓
4. Admin clicks "Xác nhận" (confirm)
   ↓
5. handleConfirmRoleChange() called
   ↓
6. useMutation triggers updateUserRole(userId, "Seller")
   ↓
7. Fetch to PUT /api/admin/users/{userId}/role
   ├─ Body: { role: "Seller" }
   └─ JWT token in header
   ↓
8. AdminController.UpdateUserRole() executes
   ├─ Verify [Authorize] ✅
   ├─ Call IUserService.UpdateUserRoleAsync()
   ├─ UserService finds user by ID
   ├─ Validate role exists in AspNetRoles
   ├─ Remove old roles
   ├─ Add new role (Seller)
   ├─ Update user roles in AspNetUserRoles table
   └─ Return ServiceResponse
   ↓
9. Frontend mutation succeeds
   ├─ Show toast: "Role updated"
   ├─ Refetch user list
   ├─ User badge now shows "Seller" (blue)
   └─ Dialog closes


═════════════════════════════════════════════════════════════════════════════

                      FILE STRUCTURE (Updated)

═════════════════════════════════════════════════════════════════════════════

AIFshop-BE/ (Backend)
├── eCommerceApp.Host/
│   └── Controllers/
│       └── AdminController.cs ✅ NEW (6 endpoints)
│
├── eCommerceApp.Aplication/
│   ├── Services/
│   │   ├── Interfaces/
│   │   │   └── IUserService.cs ✅ NEW
│   │   └── Implementations/
│   │       └── UserService.cs ✅ NEW
│   │
│   ├── DependencyInjection/
│   │   └── ServiceContainer.cs ✏️ MODIFIED (DI registration)
│   │
│   └── DTOs/
│       └── PagedResult.cs (using Data property)
│
└── Program.cs & appsettings.json


AIFShop-FE/ (Frontend)
├── client/
│   ├── pages/
│   │   ├── Admin/
│   │   │   ├── UserManagement.tsx ✏️ MODIFIED (API integration)
│   │   │   └── Reviews.tsx (existing)
│   │   └── ...
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── AdminLayout.tsx ✏️ MODIFIED
│   │   └── ui/
│   │       ├── Table.tsx
│   │       ├── Button.tsx
│   │       ├── Dialog.tsx
│   │       ├── Badge.tsx
│   │       └── ...
│   │
│   ├── App.tsx ✏️ MODIFIED (routes)
│   ├── main.tsx
│   └── ...
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts


═════════════════════════════════════════════════════════════════════════════

✅ System is COMPLETE and PRODUCTION READY!
```
