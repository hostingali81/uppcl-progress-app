# Notification System - End-to-End Test Plan

## Test Scenario
Test that notifications are created and displayed when a comment is posted on a work.

## Prerequisites
1. Two users logged in:
   - **User A** (commenter): Posts a comment on a work
   - **User B** (recipient): Should receive a notification based on hierarchy match

## Test Steps

### Step 1: Verify User B's Profile Matches Work Hierarchy
1. Log in as User B
2. Check their profile fields:
   - `role`: e.g., `circle_head`
   - `circle`: e.g., `ECC AGRA`
3. Note these values

### Step 2: Verify Work Hierarchy
1. Navigate to a work (e.g., Work ID 1)
2. Check the work's hierarchy fields:
   - `civil_circle`: e.g., `ECC Agra`
3. Verify that User B's `circle` matches the work's `civil_circle` (case-insensitive)

### Step 3: Post a Comment as User A
1. Log in as User A
2. Navigate to the work from Step 2
3. Scroll to "Discussion & Updates" section
4. Post a comment: "Test notification - [timestamp]"
5. Submit the comment

### Step 4: Check Server Logs
1. Open the terminal running `npm run dev`
2. Look for console logs:
   ```
   Checking SE <User B Name>: circle '<User B circle>' vs work.civil_circle '<Work circle>'
   Work ID <work_id> - notifying X users + Y mentions
   ```
3. Verify that User B is identified as `shouldNotify = true`

### Step 5: Verify Notification in Database
1. Use the debug API: `http://localhost:3000/api/notifications`
2. Log in as User B
3. Check the response for notifications array
4. Verify a notification exists with:
   - `type`: `comment`
   - `message`: Contains User A's name and the comment text
   - `is_read`: `false`
   - `work_id`: The work ID from Step 2

### Step 6: Check Notification in UI
1. While logged in as User B
2. Navigate to `/notifications` page
3. Verify the notification appears in the list
4. Check that it shows:
   - Badge: "Comment"
   - Message with User A's name
   - Work name
   - "Unread" indicator (blue dot)

### Step 7: Mark as Read
1. Click the checkmark button on the notification
2. Verify the notification is marked as read
3. Refresh the page
4. Verify it no longer shows in "Unread" filter

## Expected Results
- ✅ Notification is created in database
- ✅ Notification appears in `/notifications` page
- ✅ Notification can be marked as read
- ✅ Case-insensitive matching works (e.g., "ECC AGRA" matches "ECC Agra")

## Common Issues

### Issue 1: No notification created
**Symptom**: Server logs show "notifying 0 users"
**Cause**: User hierarchy doesn't match work hierarchy
**Solution**: Verify user's `circle`/`division`/`subdivision`/`region` exactly matches (case-insensitive) the work's corresponding field

### Issue 2: Notification created but not visible
**Symptom**: Debug API shows notification, but UI doesn't
**Cause**: Frontend not refreshing or RLS issue
**Solution**: 
- Check browser console for errors
- Verify RLS policies allow user to read their own notifications
- Hard refresh the page (Ctrl+Shift+R)

### Issue 3: Case sensitivity issues
**Symptom**: "ECC AGRA" doesn't match "ECC Agra"
**Cause**: Using strict equality instead of `areStringsEqual`
**Solution**: Verify `actions.ts` uses `areStringsEqual` for all comparisons
