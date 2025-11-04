/**
 * Comments Functionality Debug Script
 * Browser console mein paste karke run karein
 * 
 * Usage:
 * 1. Work detail page open karein
 * 2. Browser console open karein (F12)
 * 3. Is script ko copy-paste karke run karein
 */

async function debugComments() {
    console.log('🔍 Starting Comments Debug...\n');
    
    // Check 1: Supabase client available hai?
    console.log('1️⃣ Checking Supabase client...');
    if (typeof window !== 'undefined' && window.supabase) {
        console.log('✅ Supabase client found');
    } else {
        console.log('❌ Supabase client not found in window');
        console.log('ℹ️  This is normal for server-side rendering');
    }
    
    // Check 2: Current user authenticated hai?
    console.log('\n2️⃣ Checking authentication...');
    try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
            const userData = await response.json();
            console.log('✅ User authenticated:', userData);
        } else {
            console.log('❌ User not authenticated');
        }
    } catch (error) {
        console.log('⚠️  Could not check auth:', error.message);
    }
    
    // Check 3: Comments section visible hai?
    console.log('\n3️⃣ Checking Comments Section UI...');
    const commentsSection = document.querySelector('[class*="CommentsSection"]');
    const commentTextarea = document.querySelector('textarea[placeholder*="comment"]');
    const postButton = document.querySelector('button:has-text("Post Comment")');
    
    if (commentTextarea) {
        console.log('✅ Comment textarea found');
    } else {
        console.log('❌ Comment textarea not found');
    }
    
    // Check 4: Existing comments
    console.log('\n4️⃣ Checking existing comments...');
    const commentElements = document.querySelectorAll('[class*="comment"]');
    console.log(`Found ${commentElements.length} comment elements in DOM`);
    
    // Check 5: Network requests
    console.log('\n5️⃣ Testing comment submission...');
    console.log('ℹ️  Try posting a comment and watch Network tab');
    console.log('ℹ️  Look for POST requests to /dashboard/work/[id]');
    
    // Check 6: Console errors
    console.log('\n6️⃣ Checking for errors...');
    console.log('ℹ️  Check Console tab for any red error messages');
    
    // Summary
    console.log('\n📊 Debug Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Next Steps:');
    console.log('1. Check Network tab when posting comment');
    console.log('2. Look for error messages in Console');
    console.log('3. Verify Supabase connection in Network tab');
    console.log('4. Check server terminal for backend errors');
    console.log('\n💡 Common Issues:');
    console.log('- RLS policies not configured');
    console.log('- User not authenticated');
    console.log('- Comments table missing in database');
    console.log('- Server action failing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the debug
debugComments();

// Export for manual testing
window.debugComments = debugComments;
console.log('💡 Tip: Run debugComments() anytime to re-check');
