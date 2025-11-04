# Discussion & Updates Section - Troubleshooting Guide

## Issue
"Discussion & Updates" section work nahi kar raha hai - comments post/edit/delete nahi ho rahe hain.

## Possible Causes & Solutions

### 1. Database Table Missing or Misconfigured

**Check karne ke liye:**
```bash
# Supabase dashboard mein SQL Editor open karein aur ye query run karein:
```
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'comments'
);
```

**Solution:**
- Agar table nahi hai, to `db/migrations/create_comments_table.sql` file ko Supabase mein run karein
- Ya phir Supabase dashboard → SQL Editor → Run migration

### 2. RLS (Row Level Security) Policies Issue

**Check karne ke liye:**
```sql
-- Check RLS policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'comments';
```

**Solution:**
- Ensure karo ki ye policies exist karein:
  - `Anyone can view comments` (SELECT)
  - `Users can insert their own comments` (INSERT)
  - `Users can update their own comments` (UPDATE)
  - `Superadmins can manage all comments` (ALL)

### 3. Authentication Issue

**Check karne ke liye:**
- Browser console mein errors check karein (F12 → Console)
- Network tab mein API calls check karein

**Common Errors:**
- "Authentication required" - User logged in nahi hai
- "Permission denied" - RLS policy issue hai

**Solution:**
```typescript
// Verify user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### 4. Server Action Failing

**Check karne ke liye:**
- Terminal/console mein server logs check karein
- Browser DevTools → Network → Check failed requests

**Solution:**
```bash
# Development server restart karein
npm run dev
```

### 5. Supabase Client Configuration

**Check karne ke liye:**
```typescript
// src/lib/supabase/server.ts verify karein
```

**Solution:**
- `.env.local` file mein Supabase credentials check karein:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step-by-Step Debugging Process

### Step 1: Database Setup
1. Supabase dashboard open karein
2. SQL Editor mein jao
3. `test_comments.sql` file ka content run karein
4. Results check karein - table exist karta hai ya nahi

### Step 2: Run Migration
Agar table nahi hai:
1. `create_comments_table.sql` file ka content copy karein
2. Supabase SQL Editor mein paste karein
3. Run karein
4. Success message verify karein

### Step 3: Test Comments Functionality
1. Application mein login karein
2. Koi work detail page open karein
3. Browser console open karein (F12)
4. Comment post karne ki koshish karein
5. Console mein errors check karein

### Step 4: Check Server Logs
```bash
# Terminal mein dekho kya errors aa rahe hain
# Development server running hona chahiye
```

### Step 5: Verify Actions
File check karein: `src/app/(main)/dashboard/work/[id]/actions.ts`

Key functions:
- `addComment()` - Comment add karne ke liye
- `editComment()` - Comment edit karne ke liye  
- `deleteComment()` - Comment delete karne ke liye

## Common Error Messages & Solutions

### Error: "Could not post comment: permission denied"
**Cause:** RLS policy issue
**Solution:** 
```sql
-- RLS policies recreate karein
-- create_comments_table.sql run karein
```

### Error: "Authentication required"
**Cause:** User session expired ya invalid
**Solution:**
```typescript
// Logout karke phir se login karein
// Ya session refresh karein
```

### Error: "relation 'public.comments' does not exist"
**Cause:** Comments table create nahi hua
**Solution:**
```sql
-- create_comments_table.sql migration run karein
```

### Error: "Cannot read properties of null"
**Cause:** Comments data null aa raha hai
**Solution:**
```typescript
// CommentsSection component mein null check add karein
{comments && comments.length > 0 ? (
  // render comments
) : (
  // show empty state
)}
```

## Testing Checklist

- [ ] Comments table database mein exist karta hai
- [ ] RLS policies properly configured hain
- [ ] User authenticated hai
- [ ] Server actions properly defined hain
- [ ] Environment variables set hain
- [ ] Development server running hai
- [ ] Browser console mein koi error nahi hai
- [ ] Network requests successful hain (200 status)

## Quick Fix Commands

```bash
# 1. Server restart
npm run dev

# 2. Clear Next.js cache
rm -rf .next
npm run dev

# 3. Check environment variables
cat .env.local

# 4. Verify Supabase connection
# Browser console mein:
# const { data } = await supabase.from('comments').select('count');
# console.log(data);
```

## Contact Points

Agar issue resolve nahi ho raha:
1. Supabase dashboard logs check karein
2. Browser DevTools → Network tab check karein
3. Server terminal logs check karein
4. Database table structure verify karein

## Files to Check

1. `src/components/custom/CommentsSection.tsx` - UI component
2. `src/app/(main)/dashboard/work/[id]/actions.ts` - Server actions
3. `src/app/(main)/dashboard/work/[id]/WorkDetailClient.tsx` - Parent component
4. `db/migrations/create_comments_table.sql` - Database schema
5. `.env.local` - Environment configuration
