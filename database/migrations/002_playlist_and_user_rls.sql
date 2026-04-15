alter table if exists public.users enable row level security;
alter table if exists public.playlists enable row level security;
alter table if exists public.playlist_songs enable row level security;
alter table if exists public.songs enable row level security;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'users'
          and policyname = 'users_select_own'
    ) then
        create policy users_select_own
            on public.users
            for select
            to authenticated
            using (auth.uid() = id);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'users'
          and policyname = 'users_update_own'
    ) then
        create policy users_update_own
            on public.users
            for update
            to authenticated
            using (auth.uid() = id)
            with check (auth.uid() = id);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'playlists'
          and policyname = 'playlists_select_own'
    ) then
        create policy playlists_select_own
            on public.playlists
            for select
            to authenticated
            using (auth.uid() = user_id);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'playlists'
          and policyname = 'playlists_insert_own'
    ) then
        create policy playlists_insert_own
            on public.playlists
            for insert
            to authenticated
            with check (auth.uid() = user_id);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'playlists'
          and policyname = 'playlists_update_own'
    ) then
        create policy playlists_update_own
            on public.playlists
            for update
            to authenticated
            using (auth.uid() = user_id)
            with check (auth.uid() = user_id);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'playlists'
          and policyname = 'playlists_delete_own'
    ) then
        create policy playlists_delete_own
            on public.playlists
            for delete
            to authenticated
            using (auth.uid() = user_id);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'playlist_songs'
          and policyname = 'playlist_songs_select_via_own_playlist'
    ) then
        create policy playlist_songs_select_via_own_playlist
            on public.playlist_songs
            for select
            to authenticated
            using (
                exists (
                    select 1
                    from public.playlists
                    where playlists.id = playlist_songs.playlist_id
                      and playlists.user_id = auth.uid()
                )
            );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'playlist_songs'
          and policyname = 'playlist_songs_insert_via_own_playlist'
    ) then
        create policy playlist_songs_insert_via_own_playlist
            on public.playlist_songs
            for insert
            to authenticated
            with check (
                exists (
                    select 1
                    from public.playlists
                    where playlists.id = playlist_songs.playlist_id
                      and playlists.user_id = auth.uid()
                )
            );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'playlist_songs'
          and policyname = 'playlist_songs_update_via_own_playlist'
    ) then
        create policy playlist_songs_update_via_own_playlist
            on public.playlist_songs
            for update
            to authenticated
            using (
                exists (
                    select 1
                    from public.playlists
                    where playlists.id = playlist_songs.playlist_id
                      and playlists.user_id = auth.uid()
                )
            )
            with check (
                exists (
                    select 1
                    from public.playlists
                    where playlists.id = playlist_songs.playlist_id
                      and playlists.user_id = auth.uid()
                )
            );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'playlist_songs'
          and policyname = 'playlist_songs_delete_via_own_playlist'
    ) then
        create policy playlist_songs_delete_via_own_playlist
            on public.playlist_songs
            for delete
            to authenticated
            using (
                exists (
                    select 1
                    from public.playlists
                    where playlists.id = playlist_songs.playlist_id
                      and playlists.user_id = auth.uid()
                )
            );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'songs'
          and policyname = 'songs_select_authenticated'
    ) then
        create policy songs_select_authenticated
            on public.songs
            for select
            to authenticated
            using (true);
    end if;
end $$;
