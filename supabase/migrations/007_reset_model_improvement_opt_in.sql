update public.profiles
set improve_phelecheck = false,
    updated_at = now()
where improve_phelecheck = true;
