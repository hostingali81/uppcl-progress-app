-- Normalize MB Status values
UPDATE works 
SET mb_status = 'Running' 
WHERE LOWER(mb_status) = 'running';

UPDATE works 
SET mb_status = 'Final' 
WHERE LOWER(mb_status) = 'final';

-- Normalize TECO Status values
UPDATE works 
SET teco_status = 'Done' 
WHERE LOWER(teco_status) = 'done';

UPDATE works 
SET teco_status = 'Not Done' 
WHERE LOWER(teco_status) IN ('not done', 'notdone', 'pending');

-- Normalize FICO Status values
UPDATE works 
SET fico_status = 'Done' 
WHERE LOWER(fico_status) = 'done';

UPDATE works 
SET fico_status = 'Not Done' 
WHERE LOWER(fico_status) IN ('not done', 'notdone', 'pending');
