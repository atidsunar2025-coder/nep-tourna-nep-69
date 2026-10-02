# Admin setup

There is intentionally no hard-coded admin password.

1. Create your Supabase project and run `supabase/schema.sql` in the Supabase SQL Editor.
2. Create your administrator account from `/login` using the email/password you choose.
3. In Supabase SQL Editor, grant that account admin access:

```sql
insert into public.admin_users (user_id)
select id from auth.users
where email = 'YOUR_ADMIN_EMAIL';
```

4. Open `/admin/login` on the deployed site and sign in with that account.

The database RLS policies enforce admin-only create/update/delete operations. The browser never receives a service-role key.
