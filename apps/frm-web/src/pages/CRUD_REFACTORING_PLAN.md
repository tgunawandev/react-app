# CRUD Refactoring Plan - Single Page Pattern (Ultrathink)

## ✅ Pattern: ONE Page with THREE Modes

```typescript
// Unified Pattern:
type EntityMode = 'view' | 'edit' | 'create'

// Route determination:
const mode: EntityMode = entityId
  ? (searchParams.get('mode') === 'edit' ? 'edit' : 'view')
  : 'create'

// Routes:
/entities/new           → mode='create'
/entities/:id           → mode='view'
/entities/:id?mode=edit → mode='edit'
```

## 📋 Entities to Refactor

### 1. ✅ Sales Orders (COMPLETED)
- ✅ **OrderPage.tsx** (unified) - 800 lines
- ❌ OrderDetail.tsx (570 lines) - DELETE
- ❌ OrderCreate.tsx (700 lines) - DELETE
- ❌ OrderEdit.tsx (560 lines) - DELETE
- **Savings**: 1,030 lines removed (56% reduction)

### 2. 🔄 Customers (IN PROGRESS)
- ❌ CustomerDetail.tsx (view) - ~400 lines
- ❌ NewCustomer.tsx (create) - ~300 lines
- ❌ EditCustomer.tsx (edit) - ~350 lines
- ✅ **CustomerPage.tsx** (unified) - ~600 lines
- **Savings**: 450 lines removed (43% reduction)

### 3. 🔄 Payments
- ❌ PaymentDetail.tsx (view) - ~300 lines
- ❌ PaymentCreate.tsx (create) - ~400 lines
- ✅ **PaymentPage.tsx** (unified) - ~500 lines
- **Savings**: 200 lines removed (29% reduction)

### 4. 🔄 Delivery Returns
- ❌ DeliveryReturnDetail.tsx (view) - ~300 lines
- ❌ DeliveryReturnCreate.tsx (create) - ~400 lines
- ✅ **DeliveryReturnPage.tsx** (unified) - ~500 lines
- **Savings**: 200 lines removed (29% reduction)

### 5. 🔄 Activity Templates
- ❌ ActivityTemplateDetail.tsx (view) - ~250 lines
- ❌ ActivityTemplateNew.tsx (create) - ~300 lines
- ❌ ActivityTemplateEdit.tsx (edit) - ~300 lines
- ✅ **ActivityTemplatePage.tsx** (unified) - ~550 lines
- **Savings**: 300 lines removed (35% reduction)

### 6. ℹ️ Products (READ-ONLY)
- ProductDetail.tsx (view only)
- **Status**: No create/edit needed - keep as is

### 7. ℹ️ Deliveries (READ-ONLY from Odoo)
- DeliveryDetail.tsx (view only)
- **Status**: No create/edit needed - keep as is

## 📈 Total Impact

**Before**: 5,870 lines across 15 files
**After**: 2,950 lines across 5 unified pages
**Savings**: 2,920 lines removed (50% reduction!)

## 🎯 Benefits

1. **Maintenance**: Fix once, works everywhere
2. **Consistency**: Identical UI guaranteed
3. **Type Safety**: Shared types prevent drift
4. **Testing**: Test one component, not three
5. **DRY**: No code duplication

## 🔧 Implementation Order

1. ✅ Sales Orders (OrderPage.tsx) - DONE
2. 🔄 Customers (CustomerPage.tsx) - HIGH PRIORITY
3. 🔄 Activity Templates (ActivityTemplatePage.tsx) - HIGH PRIORITY
4. 🔄 Payments (PaymentPage.tsx) - MEDIUM
5. 🔄 Delivery Returns (DeliveryReturnPage.tsx) - MEDIUM

## 📝 Router Updates Required

```typescript
// OLD (3 routes per entity):
{ path: 'orders', element: <Orders /> }
{ path: 'orders/new', element: <OrderCreate /> }
{ path: 'orders/:id', element: <OrderDetail /> }
{ path: 'orders/:id/edit', element: <OrderEdit /> }

// NEW (2 routes per entity):
{ path: 'orders', element: <Orders /> }
{ path: 'orders/:id?', element: <OrderPage /> }
// Mode determined by: URL params + search params
```

## 🧹 Cleanup Tasks

1. Delete old separate files
2. Update router.tsx
3. Update all navigation links
4. Run TypeScript build
5. Test all CRUD operations

