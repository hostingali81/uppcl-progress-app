# Implementation Checklist - Activity Progress Sync

## ✅ Pre-Implementation (Complete)

- [x] Database migration file created
- [x] TypeScript types defined
- [x] Server actions created
- [x] Schedule actions updated
- [x] UI component created
- [x] Utility scripts created
- [x] Documentation written

## 📋 Implementation Steps (To Do)

### Step 1: Database Setup
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Open file: `db/migrations/create_work_activities_table.sql`
- [ ] Copy entire content
- [ ] Paste in SQL Editor
- [ ] Click "Run" button
- [ ] Verify: Check if `work_activities` table created

**Verification Query:**
```sql
SELECT * FROM work_activities LIMIT 1;
```

### Step 2: Initialize Activities for Existing Works
- [ ] Create a one-time API route or script
- [ ] Import: `import { initializeAllWorkActivities } from '@/lib/initialize-activities'`
- [ ] Call: `await initializeAllWorkActivities()`
- [ ] Check console logs for results
- [ ] Verify: Check if activities populated

**Verification Query:**
```sql
SELECT work_id, COUNT(*) as activity_count 
FROM work_activities 
GROUP BY work_id;
```

### Step 3: Add Progress Form to Work Detail Page
- [ ] Find work detail page component
- [ ] Import: `import { ActivityProgressForm } from '@/components/custom/ActivityProgressForm'`
- [ ] Add component in appropriate section
- [ ] Test: Open work detail page
- [ ] Verify: Form shows activities

**Example Integration:**
```typescript
// In work detail page
<Tabs>
  <TabsContent value="progress">
    <ActivityProgressForm 
      workId={work.id}
      onProgressUpdate={() => router.refresh()}
    />
  </TabsContent>
</Tabs>
```

### Step 4: Testing

#### Test 1: Activity Progress Update
- [ ] Open work detail page
- [ ] Find ActivityProgressForm
- [ ] Update a sub-activity progress (e.g., B1: 100%)
- [ ] Click "Save Progress"
- [ ] Verify: Success message appears
- [ ] Verify: Parent activity progress auto-calculated
- [ ] Check: Main activity shows updated average

#### Test 2: Schedule Sync
- [ ] Go to Schedule page (Gantt chart)
- [ ] Verify: Progress bars show correct values
- [ ] Edit an activity in Gantt chart
- [ ] Save schedule
- [ ] Go back to progress form
- [ ] Verify: Changes reflected in activities

#### Test 3: Parent Auto-calculation
- [ ] Update multiple sub-activities:
  - B1: 100%
  - B2: 80%
  - B3: 60%
- [ ] Save progress
- [ ] Check parent activity B
- [ ] Verify: Shows average (80%)

#### Test 4: Database Trigger
- [ ] Run SQL query:
```sql
-- Update a sub-activity
UPDATE work_activities 
SET progress_percentage = 75 
WHERE activity_code = 'b1' AND work_id = 1;

-- Check parent updated
SELECT activity_code, activity_name, progress_percentage 
FROM work_activities 
WHERE work_id = 1 AND is_main_activity = true;
```
- [ ] Verify: Parent progress updated automatically

### Step 5: Integration Points

#### Point 1: Progress Logs
- [ ] When creating progress log
- [ ] Also update activities table
- [ ] Use: `bulkUpdateActivitiesProgress()`

#### Point 2: Dashboard
- [ ] Show activity-wise progress
- [ ] Use: `getWorkActivities()`
- [ ] Display in cards/charts

#### Point 3: Reports
- [ ] Add activity progress report
- [ ] Query work_activities table
- [ ] Show main vs sub-activity progress

## 🔍 Verification Checklist

### Database
- [ ] `work_activities` table exists
- [ ] Trigger `calculate_parent_activity_progress` exists
- [ ] RLS policies applied
- [ ] Indexes created

### Data
- [ ] Activities populated for all works
- [ ] Parent-child relationships correct
- [ ] Progress values in 0-100 range
- [ ] Display order set correctly

### Functionality
- [ ] Sub-activity progress updates
- [ ] Parent progress auto-calculates
- [ ] Schedule syncs with activities
- [ ] Form validation works (0-100%)
- [ ] Loading states work
- [ ] Error handling works

### UI/UX
- [ ] Form displays correctly
- [ ] Main activities read-only
- [ ] Sub-activities editable
- [ ] Save button works
- [ ] Success/error messages show
- [ ] Mobile responsive

## 🐛 Troubleshooting

### Issue: Activities not showing
**Solution:**
```typescript
// Check if initialized
const { data } = await getWorkActivities(workId);
console.log('Activities:', data);

// If empty, initialize
await initializeWorkActivities(workId);
```

### Issue: Parent not auto-calculating
**Solution:**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger 
WHERE tgname = 'on_activity_progress_update';

-- Re-create if missing
-- Run migration again
```

### Issue: Schedule not syncing
**Solution:**
```typescript
// Manually sync
import { syncScheduleWithActivities } from './activities-actions';
await syncScheduleWithActivities(workId);
```

### Issue: Permission denied
**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'work_activities';

-- Grant permissions if needed
GRANT ALL ON work_activities TO authenticated;
```

## 📊 Success Metrics

After implementation, verify:
- [ ] All works have activities initialized
- [ ] Progress updates work smoothly
- [ ] Schedule stays in sync
- [ ] Parent calculations accurate
- [ ] No performance issues
- [ ] Users can update progress easily

## 🎯 Next Steps After Implementation

1. **Monitor Usage**
   - Track how users interact with progress form
   - Check for any errors in logs
   - Gather user feedback

2. **Optimize**
   - Add caching if needed
   - Optimize queries
   - Improve UI based on feedback

3. **Extend**
   - Add activity-wise reports
   - Create progress analytics
   - Add notifications for milestones

## 📝 Notes

- Backup database before running migration
- Test on staging environment first
- Keep old progress_logs table for reference
- Document any custom changes
- Train users on new progress update flow

---

**Ready to implement? Start with Step 1! 🚀**
