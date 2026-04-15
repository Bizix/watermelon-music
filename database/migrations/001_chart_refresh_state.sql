create table if not exists public.chart_refresh_state (
    genre_code text primary key references public.genres(code) on delete cascade,
    status text not null default 'idle',
    reason text,
    last_started_at timestamptz,
    last_finished_at timestamptz,
    last_success_at timestamptz,
    last_error text,
    updated_at timestamptz not null default now()
);

create index if not exists chart_refresh_state_status_idx
    on public.chart_refresh_state (status, updated_at desc);
