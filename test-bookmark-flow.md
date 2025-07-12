# Bookmark Functionality Test Guide

## Fixed Issues

### 1. Double-tap Detection Problems
**Problem**: Double-tap was only showing yellow highlight without displaying bookmark dialog
**Solution**: 
- Replaced `useState` with `useRef` for tap timing variables
- Fixed async state update issues that were causing timing problems
- Removed debug alerts that were interrupting the double-tap flow

### 2. Duplicate Notes Issue
**Problem**: Double-tap was causing duplicate entries in "today's notes"
**Solution**:
- Improved timeout clearing logic to prevent single-tap handlers from firing after double-tap
- Better separation between single-tap and double-tap event handling

### 3. Stories Page Alert Issue
**Problem**: "このサイトを離れますか？" alert when selecting story titles
**Solution**:
- Modified ExitCalendarHandler to exclude /stories and /reading paths
- Fixed unwanted beforeunload event triggering during navigation

## Test Flow

### Basic Bookmark Creation
1. Navigate to `/reading` or `/stories` and select a story
2. Start reading
3. **Double-tap** any word in the English text
4. Should see bookmark dialog: "「word」の位置でしおりを作成します。ここで一時中断しますか？"
5. Click "はい" to create bookmark
6. Should navigate to `/choose` page

### Resume Reading
1. On `/choose` page, should see red "前回の続きを読む" button
2. Click the resume button
3. Should navigate to reading page with `resume=1` parameter
4. Should see blur effect and resume dialog
5. Click "読書を再開する" to continue reading
6. Text should unblur and scroll to bookmark position

### Test on Mobile
1. Use mobile device or browser mobile mode
2. Test double-tap detection (300ms timing window)
3. Verify single-tap still works for word meaning lookup
4. Confirm no duplicate entries in "今日のマイノート"

## Technical Implementation

### Key Components
- `BookmarkDialog.tsx`: Modal for bookmark confirmation
- `ResumeDialog.tsx`: Modal for resume confirmation
- `ReadingClient.tsx`: Main implementation with double-tap detection

### State Management
- Bookmark data stored in `localStorage` as `reading_bookmark`
- Format: `{ slug: string, level: number, tokenIndex: number }`
- Token indexing for precise position tracking

### Double-tap Detection
- Uses `useRef` for immediate value updates (not async like `useState`)
- 300ms window for double-tap detection
- Touch duration > 100ms and movement < 10px validation
- Timeout clearing to prevent single-tap after double-tap

## Browser Testing

### Desktop Testing
1. Open `/reading` page
2. Double-click any word
3. Should see bookmark dialog

### Mobile Testing
1. Open in mobile browser or DevTools mobile mode
2. Double-tap any word (within 300ms)
3. Should see bookmark dialog without duplicate notes

## Debug Tools

### Test Page
- Open `bookmark-test.html` in browser for isolated testing
- Shows detailed logs of tap events and timing
- Useful for debugging double-tap detection issues

### Console Logs
- Look for "🔍 ダブルタップ判定" messages
- Check timing differences and target element matching
- "🎯 ダブルタップ実行中..." confirms successful detection