begin;
alter table public.ala
    alter column pais drop default,
    alter column estado drop default,
    alter column cidade drop default,
    alter column fuso_horario drop default;
commit;
