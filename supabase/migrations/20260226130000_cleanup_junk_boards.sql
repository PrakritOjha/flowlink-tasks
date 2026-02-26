-- One-time cleanup: delete auto-created "My First Board" boards for invited users
-- coresuite (b4bb0e6b...) and sccout (edb1464e...)
-- CASCADE on columns/tasks/dependencies will clean up child data

DELETE FROM public.boards
WHERE name = 'My First Board'
  AND owner_id IN (
    'b4bb0e6b-f2a1-4be0-b979-9a70e577b1c5',
    'edb1464e-6e72-49e4-8430-37298f02e98b'
  );
