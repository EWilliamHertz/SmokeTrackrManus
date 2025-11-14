# SmokeTrackr TODO

## Core Features
- [x] Database schema for products, purchases, consumption, and settings
- [x] Dashboard with budget tracking and statistics
- [x] Quick consumption logging interface
- [x] Inventory management view
- [x] Purchase logging form
- [x] Product detail view
- [x] Settings page for budget management
- [x] PWA manifest and meta tags
- [x] Mobile-optimized UI with dark theme
- [x] Data persistence and calculations

## New Features
- [x] Import Excel data functionality
- [x] Export data to Excel functionality
- [x] Parse Excel file structure (Consumption, Inventory, Purchase Log, Dashboard)
- [x] Backend procedures for bulk data import

## Bug Fixes
- [x] Fix Excel import functionality

## Analytics Features
- [x] Consumption history page with timeline
- [x] Product consumption summaries
- [x] Period analytics (daily/weekly/monthly)
- [x] Dominant product tracking
- [x] Cost breakdown per product
- [x] Total spending analysis

## Import Improvements
- [x] Auto-create products from purchase/consumption data if missing from inventory

## Import Bug Fixes
- [x] Fix date/time parsing to handle Excel date formats
- [x] Add error handling for invalid date values

## Critical Import Fix
- [x] Test import end-to-end with user's actual Excel file
- [x] Fix all remaining date/time parsing issues
- [x] Verify import creates products, purchases, and consumption correctly

## Backend Import Debugging
- [x] Check server logs for actual import error
- [x] Test tRPC import mutation with parsed data
- [x] Fix backend date validation causing "Invalid time value"
- [x] Convert Excel serial dates to proper ISO format

## Critical Import Issues
- [ ] Debug why only 40/171 consumption entries imported
- [ ] Fix missing products (Marlboro, XQS, Brobergs Arcadia) in consumption
- [ ] Verify all products from purchases are created

## Product Management
- [ ] Add product editing functionality (type, stock, cost, flavor)
- [ ] Add product deletion with confirmation
- [ ] Update product details page with edit form

## Import Improvements
- [ ] Add duplicate detection for imports (check existing data before importing)
- [ ] Show import preview/summary before confirming
- [ ] Add option to clear all data before import

## Inventory Fixes
- [ ] Fix inventory calculations to subtract consumed quantities
- [ ] Ensure manual purchases increase stock correctly
- [ ] Display accurate current stock levels

## Purchase Display Issue
- [x] Fix purchases not showing on Purchases page
- [x] Verify purchase data is being imported correctly
- [x] Check if purchase query is working

## Critical Backend Import Issue
- [ ] Debug why backend only accepts 41/171 consumption entries
- [ ] Check server logs for import errors
- [ ] Test backend import mutation with all 171 entries
- [ ] Fix backend validation rejecting valid entries

## User-Reported Issues
- [x] Add product edit functionality (change type, stock, cost, etc.)
- [x] Add product delete functionality
- [x] Fix missing purchases for Brobergs Arcadia, Nicaragua Short Puritos, Reserve 10th Anniversary Puritos (these products have no purchases in Excel)
- [ ] Improve purchase form to ask for total price + quantity, then auto-calculate price per unit
- [ ] Fix inventory showing "-" stock for products without purchases
- [x] Support both "Consumption" and "Smoke Log" sheet names in import

## New Feature Requests
- [ ] Add start date tracking (account creation, updated to first consumption on import)
- [x] Add date range filtering to dashboard (Today/Week/Month/All Time presets)
- [x] Support decimal quantities (0.3, 0.5) for partial consumption
- [ ] Add dashboard edit mode with drag-and-drop section reordering
- [x] Add consumption entry editing (edit quantity, product, date)
- [x] Add consumption entry deletion
- [x] Create shareable public read-only view with link generation

## Share Feature Enhancement
- [x] Update userSettings schema to store sharePreferences (which tabs to show)
- [x] Add checkboxes in Settings to select visible tabs for share link
- [x] Create full public share view with tabs (Dashboard, History, Inventory, Purchases)
- [x] Filter visible tabs based on user's share preferences
- [x] Show all tabs by default to showcase the full app

## Bug Fixes
- [x] Fix JavaScript error in public share link (ShareView component)

## Inventory Enhancement
- [x] Display stock quantity for each product
- [x] Show total consumed quantity
- [x] Show total purchased quantity
- [x] Add consumption rate or average usage metrics
