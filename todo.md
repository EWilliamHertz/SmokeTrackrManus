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

## Share Link Bug Fix (Nov 15)
- [x] Fix "Rendered more hooks than during the previous render" error
- [x] Move all hooks before conditional returns in ShareView
- [x] Fix TypeScript errors (byType, totalPrice vs totalCost)
- [x] Test share link on dev server

## Give Away Feature
- [x] Create giveaways table in database schema
- [x] Add backend procedures for recording giveaways
- [x] Add "Give Away" button to Inventory page
- [x] Create Give Away dialog with product selection and quantity
- [x] Update inventory calculations to subtract giveaways
- [x] Show giveaway history (optional tracking)

## Giveaways History Page
- [x] Create Giveaways.tsx page component
- [x] Display all giveaway transactions with dates, recipients, notes
- [x] Add route for /giveaways
- [x] Add navigation link to Giveaways page
- [x] Show product details for each giveaway
- [x] Sort by date (most recent first)

## Consumption Trends Chart
- [x] Install chart library (recharts)
- [x] Create consumption trends component with line/bar chart
- [x] Add daily and weekly view toggles
- [x] Integrate chart into History page
- [x] Show consumption patterns over time

## Bug Fixes (Nov 15)
- [x] Fix Panetelas showing 1.00000000000000018 instead of correct stock value (rounded to 2 decimals)
- [x] Fix stock calculation formula to handle decimal quantities correctly (Math.round * 100 / 100)
- [x] Add stock validation to prevent negative stock in Give Away feature

## Share Link Improvements
- [x] Add consumption trends chart to ShareView History tab
- [x] Ensure recharts library works on public share links
- [x] Include giveaways data in share router for accurate stock calculations

## Critical Bug - Data Discrepancy (Nov 15)
- [x] Fix data mismatch between personal tracker (116.1) and public share view (148.43)
- [x] Investigate why authenticated dashboard shows different numbers than share view (personal defaults to "This Month", share shows "All Time")
- [x] Add "All Time Data" label to share view header for clarity
- [x] Verified both views query the same database tables correctly

## Time Display Issues
- [x] Fix time display on consumption log entries in History page
- [x] Show proper timestamps for all consumption entries
- [x] Add time display to ShareView consumption entries
- [x] Ensure consistent time formatting across all views

## New Features & Enhancements (Nov 15)
- [x] Add Consumption Insights card to Dashboard showing total items and avg/day
- [x] Add quick quantity buttons (0.3, 0.5, 1, 2) to consumption form
- [x] Fix duplicate "Cigars" label (changed to "Cigarillos")

## Timezone Issue (Nov 15)
- [x] Fix consumption form showing 1 hour earlier than user's current time
- [x] Ensure datetime-local input properly initializes with user's timezone
- [x] Use manual date formatting instead of toISOString() to preserve local timezone

## Pagination Feature (Nov 15)
- [x] Add pagination to History page consumption entries
- [x] Allow users to navigate through all entries (currently limited to 20)
- [x] Add page controls (Previous/Next buttons)
- [x] Show current page and total pages

## Edit Entry Timestamp Bug (Nov 15)
- [x] Fix consumption entry edit changing timestamp when only quantity is modified
- [x] Preserve original consumption date/time during edits
- [x] Ensure datetime-local input shows correct original time in edit dialog
- [x] Changed edit dialog from date-only to datetime-local input

## Inventory Value Tracking (Nov 15)
- [x] Add total value of all consumed products display
- [x] Add total current inventory value display
- [x] Show individual product inventory value (price per unit × stock)
- [x] Calculate values based on purchase prices

## Cost Analytics Tab (Nov 15)
- [x] Create new Cost Analytics page component
- [x] Calculate cost per day (daily average spending)
- [x] Calculate cost per item (average cost per consumption)
- [x] Show cost breakdown by product type (cigars, cigarettes, cigarillos, snus)
- [x] Display monthly cost trends with bar chart
- [x] Rank most expensive products by total spent
- [x] Show cost efficiency metrics (price per unit comparisons)
- [x] Add route and navigation tab for Cost Analytics
- [x] Add pie chart visualization for cost breakdown by type
- [x] Display total consumed cost and total items metrics

## Cost Analytics Enhancements (Nov 15)
- [x] Add time period selector (1/3/7/10/14 days, All-Time)
- [x] Calculate cost per day dynamically based on selected time period
- [x] Show real-time cost metrics for each time period
- [x] Add cost projection for upcoming month based on current rate
- [x] Display budget warning when projected cost exceeds monthly budget
- [x] Update all analytics (cost by type, most expensive products) to respect time filter
- [x] Show days in period for context
- [x] Add visual alerts (red border) when projection exceeds budget

## Consumption Heatmap (Nov 15)
- [x] Create calendar heatmap component showing daily consumption
- [x] Color-code cells based on consumption intensity (green to red gradient)
- [x] Add tooltip showing exact consumption count on hover
- [x] Display current month by default with month navigation
- [x] Add to History page as new visualization option
- [x] Add legend showing intensity scale

## Comparative Analytics (Nov 15)
- [x] Calculate period-over-period percentage changes for key metrics
- [x] Add visual indicators (up/down arrows) with color coding
- [x] Display comparison badges on Cost Analytics cards
- [x] Show trend direction (green for decrease, red for increase in spending)
- [x] Only show comparisons when time period filter is active (not "All-Time")

## Weekly Email Reports (Nov 15)
- [x] Add weeklyReportsEnabled field to database schema
- [x] Add user preference toggle in Settings page
- [x] Update settings router to support weekly reports toggle
- [ ] Create backend scheduled job for email generation (requires external scheduler)
- [ ] Implement email template with cost trends and budget status
