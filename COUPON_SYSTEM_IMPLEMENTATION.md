### Coupon System Implementation Summary

## Overview
A complete coupon redemption system has been implemented, allowing organizers to create discount codes that users can apply during event registration.

## Database Changes

**New Tables Created:**
1. **`coupons`** - Stores coupon codes with discount information
   - `code` (text, unique) - The coupon code
   - `event_id` (text) - Associated event
   - `organizer_id` (text) - Who created the coupon
   - `discount_type` (text) - 'percentage' or 'fixed_amount'
   - `discount_value` (integer) - Discount percentage or fixed amount
   - `max_redemptions` (integer) - How many times it can be used
   - `used_count` (integer) - Current redemption count
   - `is_active` (boolean) - Enable/disable coupon
   - `expires_at` (timestamptz) - Optional expiration date
   - `description` (text) - User-facing description

2. **`coupon_redemptions`** - Tracks individual coupon usage
   - `coupon_id` (uuid) - References coupons table
   - `ticket_id` (uuid) - References tickets table
   - `discount_amount` (integer) - Amount discounted for this ticket

**Migration File:**
- `supabase/migrations/021_create_coupons_table.sql`

## New API Endpoints

### 1. **POST /api/organizer/coupons** - Create Coupon
**Request:**
```json
{
  "code": "SUMMER2025",
  "eventId": "event-123",
  "organizerId": "organizer-secret",
  "discountType": "percentage",
  "discountValue": 20,
  "maxRedemptions": 100,
  "expiresAt": "2025-12-31T23:59:59Z",
  "description": "Early bird offer"
}
```

### 2. **GET /api/organizer/coupons** - List Coupons
**Query Parameters:**
- `eventId` - Filter by event
- `organizerId` - Filter by organizer

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "SUMMER2025",
    "discount_type": "percentage",
    "discount_value": 20,
    "used_count": 15,
    "max_redemptions": 100,
    "is_active": true,
    ...
  }
]
```

### 3. **PUT /api/organizer/coupons** - Update Coupon
**Request:**
```json
{
  "id": "coupon-uuid",
  "isActive": false,
  "description": "Updated description"
}
```

### 4. **DELETE /api/organizer/coupons** - Delete Coupon
**Query Parameter:**
- `id` - Coupon ID to delete

### 5. **POST /api/organizer/validate-coupon** - Validate Coupon
**Request:**
```json
{
  "code": "SUMMER2025",
  "eventId": "event-123"
}
```

**Response:**
```json
{
  "valid": true,
  "couponId": "uuid",
  "code": "SUMMER2025",
  "discountType": "percentage",
  "discountValue": 20,
  "description": "Early bird offer",
  "remaining": 85
}
```

### 6. **POST /api/organizer/redeem-coupon** - Redeem Coupon
**Request:**
```json
{
  "code": "SUMMER2025",
  "ticketId": "ticket-uuid",
  "originalPrice": 1000
}
```

**Response:**
```json
{
  "success": true,
  "discountAmount": 200,
  "finalPrice": 800,
  "couponCode": "SUMMER2025"
}
```

## UI Components

### 1. **CouponManager Component** (`components/CouponManager.tsx`)
A complete coupon management interface for organizers:
- Create new coupons with validation
- List all active/inactive coupons
- View usage statistics (used/max redemptions)
- Toggle coupon active/inactive status
- Delete coupons
- Copy coupon code to clipboard
- Show expiration dates and descriptions

**Features:**
- Real-time validation
- Percentage vs Fixed Amount support
- Redemption limit tracking
- Expiration date support
- Bulk management interface

### 2. **Organizer Dashboard Updates** (`pages/organizer.tsx`)
- Added "Coupons" tab alongside "Details" and "Certificates"
- Floating button bar with two buttons:
  - 🎫 Coupons button (Ticket icon)
  - 🏆 Certificates button (Award icon)
- Full coupon management interface integrated

### 3. **Event Registration Page Updates** (`pages/event/[id].tsx`)
- Added coupon code input section
- Real-time coupon validation on "Apply" button click
- Visual feedback with success/error messages
- Displays discount information (% or ₹ amount)
- Coupon code sent with payment verification

## Workflow

### For Organizers:
1. Go to Organizer Dashboard
2. Select an event
3. Click the 🎫 Coupons button
4. Click "New Coupon"
5. Fill coupon details:
   - Coupon Code (e.g., "SUMMER2025")
   - Discount Type (Percentage or Fixed Amount)
   - Discount Value
   - Max Redemptions
   - Optional: Expiration Date
   - Optional: Description
6. Click "Create Coupon"
7. Manage coupons with activate/deactivate/delete

### For Users:
1. Go to event registration page
2. Fill in personal details
3. See "Have a Coupon Code?" section
4. Enter coupon code and click "Apply"
5. See discount applied
6. Complete payment with discount
7. Receive ticket

## Key Features

✅ **Percentage Discounts** - Apply percentage off the ticket price
✅ **Fixed Amount Discounts** - Apply fixed ₹ amount off
✅ **Redemption Limits** - Control how many times a coupon can be used
✅ **Expiration Dates** - Set optional expiration for time-limited offers
✅ **Active/Inactive Toggle** - Enable/disable without deleting
✅ **Real-time Validation** - Users get instant feedback
✅ **Usage Tracking** - See used_count vs max_redemptions
✅ **Descriptions** - Add notes visible to users
✅ **Event-Specific** - Each event has its own coupons
✅ **Organizer Control** - Full CRUD operations

## Database Migration Steps

**IMPORTANT:** You must apply the migration to activate this feature.

1. Open Supabase Dashboard → SQL Editor
2. Run the SQL from `supabase/migrations/021_create_coupons_table.sql`
3. Verify with:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('coupons', 'coupon_redemptions');
```

## Testing Checklist

- [ ] Create a coupon with percentage discount
- [ ] Create a coupon with fixed amount discount
- [ ] Test coupon validation on registration page
- [ ] Apply valid coupon - should show discount
- [ ] Try invalid coupon - should show error
- [ ] Check redemption limits work
- [ ] Test coupon expiration
- [ ] Toggle coupon active/inactive
- [ ] Check used_count increments on redemption
- [ ] Verify coupon code case-insensitivity

## Future Enhancements

- Coupon usage analytics and reporting
- Bulk coupon generation
- QR code generation for coupons
- Coupon templates/categories
- Email coupon distribution
- Referral coupon system
- Tiered discounts based on quantity
