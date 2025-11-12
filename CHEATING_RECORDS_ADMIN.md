# Admin Cheating Records Viewer

## Overview
The admin panel now includes a dedicated **"Cheating Records"** tab where administrators can monitor and view all instances of cheating detected during contests.

## Features

### 1. **Cheating Records Tab**
- Access via the admin dashboard at `/admin`
- Third tab in the navigation (alongside "Registered Teams" and "Problem Management")
- Real-time data fetching from Firestore

### 2. **Statistics Dashboard**
Displays summary cards showing:
- **Total Incidents**: Overall count of all cheating violations
- **Incidents by Type**: Breakdown of each cheating type with color-coded badges:
  - 🔵 Tab Switch (Blue)
  - 🔴 Window Blur (Red)
  - 🟢 Right Click (Green)
  - 🟡 Copy Attempt (Yellow)
  - 🟣 Fullscreen Exit (Purple)
- **Top Flagged Team**: Team with the most cheating incidents

### 3. **Advanced Filtering**
Filter records by:
- **Team Code**: Find all incidents for a specific team
- **Email**: Find all incidents for a specific user
- **Cheating Type**: Filter by type of violation
- **Live Updates**: Filters apply automatically as you type

### 4. **Records Table**
Comprehensive table displaying:
- **Team Code**: Unique team identifier
- **Email**: User's email address
- **Cheating Type**: Badge showing type of violation (color-coded)
- **Timestamp**: When the violation occurred
- **Recorded At**: Server-side timestamp (prevents tampering)

## API Endpoints Used

### GET `/api/admin/cheating-records`
Fetches all cheating records sorted by most recent
- **Response**: Array of all cheating incidents with metadata

### GET `/api/admin/cheating-records/team/:teamCode`
Filters records by team code (optional endpoint)

### GET `/api/admin/cheating-records/email/:email`
Filters records by email (optional endpoint)

### GET `/api/admin/cheating-statistics`
Generates statistical summary including:
- Total incidents count
- Breakdown by cheating type
- Breakdown by team code
- Breakdown by email
- Top teams with most incidents

## Data Structure

Each cheating record contains:
```javascript
{
  id: string,              // Unique record ID
  teamCode: string,        // Team identifier
  email: string,           // User email
  cheatingType: string,    // Type of violation (5 types possible)
  timestamp: Date,         // When violation occurred
  recordedAt: Date         // Server-side timestamp
}
```

## Cheating Types Tracked

| Type | Description | Badge Color |
|------|-------------|-------------|
| `tab_switch` | User switched to another tab | Blue |
| `window_blur` | Browser window lost focus | Red |
| `right_click` | Right-click attempt on contest page | Green |
| `copy_attempt` | Copy action detected | Yellow |
| `fullscreen_exit` | User exited fullscreen mode | Purple |

## UI Components

### Summary Cards
- Display key statistics with large numbers
- Color-coded for easy visual scanning
- Update in real-time when filters change

### Filter Section
- Three input fields for independent filtering
- Refresh button to manually reload data
- All filters work together (AND logic)

### Records Table
- Responsive design with horizontal scrolling on mobile
- Hover effect for better readability
- Color-coded badges for quick type identification
- Sortable by timestamp (most recent first)

## Usage Instructions

### 1. Navigate to Cheating Records
```
1. Go to Admin Dashboard (/admin)
2. Click "Cheating Records" tab
3. Wait for data to load
```

### 2. Filter Records
```
1. Enter Team Code (e.g., "TEAM001") in the team code filter
2. OR Enter Email (e.g., "user@example.com") in the email filter
3. OR Select Cheating Type from dropdown
4. Results update automatically
```

### 3. Review Statistics
```
1. Check summary cards at top of page
2. Identify teams with most violations
3. Understand distribution of violation types
```

### 4. Investigate Specific User
```
1. Enter user's email in email filter
2. View all violations for that user
3. Check patterns and frequency
```

## Example Scenarios

### Scenario 1: Find all violations by a team
1. Filter by Team Code: "TEAM001"
2. View all incidents for that team
3. Check types and frequencies to understand pattern

### Scenario 2: Find widespread tab switching
1. Select Cheating Type: "Tab Switch"
2. See which teams/users are prone to this violation
3. Identify if it's isolated or widespread

### Scenario 3: Monitor specific user
1. Enter email in filter
2. View entire history of violations
3. Determine if user should be disqualified

## Technical Implementation

### Frontend
- **File**: `views/admin.ejs`
- **Scripts**: `public/js/admin.js`
- New functions:
  - `loadCheatingRecords()` - Fetches all data
  - `displayCheatingStatistics()` - Renders summary cards
  - `displayCheatingRecordsTable()` - Renders records table
  - Filter event listeners for real-time updates

### Backend
- **File**: `appadmin.js`
- New endpoints:
  - GET `/api/admin/cheating-records` - All records
  - GET `/api/admin/cheating-records/team/:teamCode` - Team-filtered
  - GET `/api/admin/cheating-records/email/:email` - Email-filtered
  - GET `/api/admin/cheating-statistics` - Analytics

### Database
- **Collection**: `cheating_records` (Firestore)
- **Storage**: Server-side timestamps prevent tampering
- **Ordering**: Records ordered by `recordedAt` DESC (most recent first)

## Performance Notes

- Data fetches in parallel (records + statistics)
- Client-side filtering for responsiveness
- Firestore indexes on `teamCode` and `email` for fast queries
- Large datasets handled with overflow scrolling

## Future Enhancements

Potential features to add:
- [ ] Pagination for large datasets (1000+ records)
- [ ] Export records to CSV/PDF
- [ ] Detailed incident timeline per user
- [ ] Ban/disqualify team action
- [ ] Email notifications for admin on new violations
- [ ] Date range filtering
- [ ] Detailed incident investigation panel
- [ ] Automatic pattern detection (e.g., X violations = auto-disqualify)

## Troubleshooting

### Records not loading?
1. Check browser console for errors
2. Verify admin authentication
3. Ensure Firestore is connected
4. Check network tab for API response

### Filters not working?
1. Ensure filters are properly typed
2. Try clicking "Refresh" button
3. Clear filters and reload page
4. Check browser console

### Statistics showing zero?
1. Ensure contests are active and users are cheating
2. Check if `cheating_records` collection exists
3. Verify records are being written to database
4. Check server logs in terminal

## Security Notes

- All endpoints require admin authentication
- Server-side timestamps prevent client-side tampering
- Firestore security rules restrict access to admin users
- Records are immutable once created (append-only log)

---

**Last Updated**: November 13, 2025
**Version**: 1.0
