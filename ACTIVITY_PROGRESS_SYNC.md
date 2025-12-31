# Activity Progress Sync Implementation Guide

## Overview
Is feature se progress update aur Gantt chart schedule automatically sync ho jayenge. Jab bhi koi activity ki progress update hogi, wo schedule me bhi reflect hogi.

## Database Changes

### New Table: `work_activities`
```sql
- id: Primary key
- work_id: Foreign key to works table
- activity_code: Unique code (e.g., 'a', 'b1', 'c3')
- activity_name: Activity ka naam
- parent_activity_id: Parent activity reference (for sub-activities)
- is_main_activity: Main activity hai ya sub-activity
- start_date, end_date, duration: Schedule information
- progress_percentage: Current progress (0-100)
- display_order: Display order in list
```

### Auto-calculation Feature
- Jab sub-activity ki progress update hoti hai
- Automatically parent activity ki progress calculate hoti hai (average of all sub-activities)
- Database trigger se automatic calculation hoti hai

## Implementation Steps

### 1. Run Database Migration
```bash
# Supabase Dashboard me SQL Editor me ye file run karein:
db/migrations/create_work_activities_table.sql
```

### 2. Initialize Activities from Schedule
```typescript
import { initializeActivitiesFromSchedule } from './activities-actions';

// Ek baar run karein har work ke liye
await initializeActivitiesFromSchedule(workId);
```

### 3. Use ActivityProgressForm Component
```typescript
import { ActivityProgressForm } from '@/components/custom/ActivityProgressForm';

// Work detail page me add karein
<ActivityProgressForm 
  workId={workId} 
  onProgressUpdate={() => {
    // Refresh data after update
  }}
/>
```

## How It Works

### Progress Update Flow
1. User sub-activity ki progress update karta hai
2. `bulkUpdateActivitiesProgress()` function call hota hai
3. Database me sub-activity progress update hoti hai
4. Database trigger automatically parent activity progress calculate karta hai
5. `syncScheduleWithActivities()` schedule_data ko update karta hai
6. Gantt chart me updated progress show hoti hai

### Schedule Update Flow
1. User Gantt chart me activity drag/edit karta hai
2. `saveScheduleData()` function schedule_data save karta hai
3. Automatically `work_activities` table bhi update hoti hai
4. Progress sync rehti hai

### Load Schedule Flow
1. `loadScheduleData()` function schedule_data fetch karta hai
2. `work_activities` table se latest progress fetch hoti hai
3. Schedule data me progress merge hoti hai
4. Updated data return hota hai

## API Functions

### Server Actions

#### `getWorkActivities(workId)`
- Work ki saari activities fetch karta hai
- Returns: `{ success: true, data: WorkActivity[] }`

#### `updateActivityProgress(activityId, progress, workId)`
- Single activity ki progress update karta hai
- Automatically parent progress calculate hota hai
- Schedule sync hota hai

#### `bulkUpdateActivitiesProgress(workId, updates[])`
- Multiple activities ki progress ek saath update karta hai
- Format: `[{ activityCode: 'b1', progress: 75 }]`

#### `syncScheduleWithActivities(workId)`
- Activities table se schedule_data sync karta hai
- Automatically call hota hai progress update ke baad

#### `initializeActivitiesFromSchedule(workId)`
- Schedule_data se activities table populate karta hai
- Ek baar run karna hai har work ke liye

## Usage Examples

### Example 1: Progress Update Form
```typescript
const handleProgressUpdate = async () => {
  const updates = [
    { activityCode: 'b1', progress: 100 },
    { activityCode: 'b2', progress: 75 },
    { activityCode: 'b3', progress: 50 }
  ];
  
  const result = await bulkUpdateActivitiesProgress(workId, updates);
  if (result.success) {
    toast.success('Progress updated!');
  }
};
```

### Example 2: Get Activities with Progress
```typescript
const { data: activities } = await getWorkActivities(workId);

// Main activities (auto-calculated)
const mainActivities = activities.filter(a => a.is_main_activity);

// Sub activities (user can update)
const subActivities = activities.filter(a => !a.is_main_activity);
```

## Benefits

1. **Automatic Sync**: Progress aur schedule hamesha sync rahenge
2. **Auto-calculation**: Parent activity progress automatically calculate hoti hai
3. **Data Integrity**: Ek source of truth for progress data
4. **Better Reporting**: Activities table se easy queries aur reports
5. **Hierarchical Progress**: Main aur sub-activities ka proper tracking

## Migration for Existing Data

Agar aapke paas already works hain with schedule_data:

```typescript
// Har work ke liye run karein
const works = await getAllWorks();
for (const work of works) {
  if (work.schedule_data) {
    await initializeActivitiesFromSchedule(work.id);
  }
}
```

## Notes

- Main activities ki progress manually update nahi kar sakte (auto-calculated)
- Sub-activities ki progress 0-100 range me honi chahiye
- Database trigger automatically parent progress update karta hai
- Schedule save karte waqt activities bhi update hoti hain
- Activities table se better querying aur reporting possible hai

## Troubleshooting

### Activities not syncing?
```typescript
// Manually sync karein
await syncScheduleWithActivities(workId);
```

### Activities not initialized?
```typescript
// Initialize karein
await initializeActivitiesFromSchedule(workId);
```

### Parent progress not updating?
- Check database trigger: `calculate_parent_activity_progress()`
- Verify parent_activity_id correctly set hai
