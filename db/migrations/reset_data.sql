    -- Reset all data except superadmin users
    -- This will delete all works, progress logs, payment logs, comments, and attachments
    -- Only superadmin profiles will be retained

    -- Delete all data from dependent tables first
    DELETE FROM attachments;
    DELETE FROM comments;
    DELETE FROM payment_logs;
    DELETE FROM progress_logs;
    DELETE FROM works;

    -- Delete all non-superadmin profiles
    DELETE FROM profiles WHERE role != 'superadmin';

    -- Reset sequences (optional - to start IDs from 1 again)
    ALTER SEQUENCE works_id_seq RESTART WITH 1;
    ALTER SEQUENCE attachments_id_seq RESTART WITH 1;
    ALTER SEQUENCE comments_id_seq RESTART WITH 1;
    ALTER SEQUENCE payment_logs_id_seq RESTART WITH 1;
    ALTER SEQUENCE progress_logs_id_seq RESTART WITH 1;
