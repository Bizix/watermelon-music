# Database Migrations

Apply migrations in lexical order against the Supabase/Postgres database.

Conventions:
- Use a new numbered SQL file for every schema or policy change.
- Keep migrations additive and idempotent when practical.
- Update `database/schema.sql` after each completed schema wave so it remains the checked-in snapshot of the live schema.

This wave introduces:
- durable chart refresh state storage
- playlist/user/song row-level security policies for direct frontend Supabase access
