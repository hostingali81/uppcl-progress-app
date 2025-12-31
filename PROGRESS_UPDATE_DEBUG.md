# Progress Update Debugging Guide

## Issue
Progress update works for work ID 2232 but not for other works.

## Changes Made

### 1. Added Comprehensive Logging

#### UpdateProgressForm.tsx
- Added logging when component mounts to verify workId prop
- Added logging before and after API request
- Added detailed error messages
- Logs will show in browser console

#### API Route (progress-logs/route.ts)
- Added logging for received request parameters
- Added validation for workId and progress
- Added logging for each database operation step
- Added logging for authentication check
- Logs will show in server console (terminal where `npm run dev` is running)

### 2. What to Check

When you test progress update on different works, check:

1. **Browser Console** (F12 → Console tab):
   - Look for `[UpdateProgressForm]` logs
   - Verify the workId is correct
   - Check if the API request is being sent
   - Look for any error messages

2. **Server Console** (Terminal):
   - Look for `[API /progress-logs POST]` logs
   - Verify the workId is received correctly
   - Check if user is authenticated
   - See which step fails (if any)

3. **Network Tab** (F12 → Network tab):
   - Look for the POST request to `/api/progress-logs`
   - Check the request payload (FormData)
   - Check the response status and body

## Common Issues to Look For

### 1. WorkId Type Mismatch
- Ensure workId is a number, not a string
- Check if workId is undefined or null

### 2. Authentication Issues
- User might not be authenticated
- Session might have expired

### 3. Database Permissions
- RLS policies are correct (verified)
- Admin client is being used (bypasses RLS)

### 4. Data Validation
- Progress value must be between 0-100
- WorkId must exist in the database

### 5. Network Issues
- Request might be timing out
- CORS issues (unlikely in same-origin)

## Testing Steps

1. Open browser console (F12)
2. Navigate to a work detail page (e.g., /dashboard/work/2232)
3. Click "Update Progress" button
4. Fill in the form and submit
5. Check both browser console and server console for logs
6. Try the same with a different work ID
7. Compare the logs between working and non-working cases

## Expected Log Flow

### Browser Console:
```
[UpdateProgressForm] Component mounted with props: { workId: 2232, ... }
[UpdateProgressForm] Submitting for workId: 2232
[UpdateProgressForm] Sending request to /api/progress-logs
[UpdateProgressForm] Response status: 200
[UpdateProgressForm] Response data: { progressLogId: 123 }
```

### Server Console:
```
[API /progress-logs POST] Received request: { workId: 2232, progress: 50, ... }
[API /progress-logs POST] User authenticated: { userId: '...', email: '...' }
[API /progress-logs POST] Fetching work details for workId: 2232
[API /progress-logs POST] Current work fetched: { id: 2232, work_name: '...', ... }
[API /progress-logs POST] Inserting progress log
[API /progress-logs POST] Progress log created: { id: 123 }
[API /progress-logs POST] Updating work with new progress
[API /progress-logs POST] Work updated successfully
[API /progress-logs POST] Success! Returning progressLogId: 123
```

## Next Steps

After collecting logs from both working (2232) and non-working cases:

1. Compare the logs to identify where they differ
2. Check if the error occurs at a specific step
3. Verify the data being sent is correct
4. Check database directly if needed

## Quick Fix Attempts

If you find the issue is related to:

### WorkId not being passed correctly:
- Check WorkDetailClient.tsx line where UpdateProgressForm is rendered
- Verify work.id is correct

### Form data not being sent:
- Check FormData construction in handleSubmit
- Verify all required fields are present

### Database operation failing:
- Check Supabase dashboard for error logs
- Verify the work exists in the database
- Check if there are any database constraints being violated

## Contact
If the issue persists after checking logs, share:
1. Browser console logs
2. Server console logs
3. Network tab screenshot
4. The specific work ID that's failing
