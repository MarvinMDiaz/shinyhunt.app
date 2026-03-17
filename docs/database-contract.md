# Database Contract

## Hunt Progress RPC

```
insert_hunt_progress_event(
  p_hunt_id uuid,
  p_reset_count integer
)
```

- Canonical live RPC
- Uses TOTAL reset count
- Frontend sends the current total count, not a delta

## hunt_progress_events table

| Column      | Type        | Notes                    |
|-------------|-------------|--------------------------|
| id          | UUID        | Primary key              |
| hunt_id     | UUID        | FK to hunts              |
| user_id     | UUID        | FK to auth.users         |
| reset_count | INTEGER     | Total count at event     |
| created_at  | TIMESTAMPTZ | Event timestamp          |

## Important rules

- `reset_delta` is not part of the live design
- Do not introduce `p_reset_delta` without coordinated frontend and DB changes
- If database changes are made manually, they must be reflected in repo docs/migrations

## Notes

- This project previously had drift between code and SQL after a checkpoint revert
- This file exists to prevent future mismatches
