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
