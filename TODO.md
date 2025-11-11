# TODO: Fix Seller Dashboard Stats Bug

## Issue
The Seller Dashboard shows all stats as 0, and there's a bug in the earnings calculation where `totalEarnings` is calculated as the commission amount instead of the seller's actual earnings.

## Tasks
- [x] Fix the seller earnings calculation in `backend/controllers/orderController.js`
- [ ] Test the fix to ensure stats display correctly

## Details
In `getSellerStats` function, change:
```javascript
totalEarnings += itemTotal * (seller.commissionRate / 100);
```
to:
```javascript
totalEarnings += itemTotal - (itemTotal * (seller.commissionRate / 100));
```

This ensures sellers earn the full sale amount minus the platform commission.
