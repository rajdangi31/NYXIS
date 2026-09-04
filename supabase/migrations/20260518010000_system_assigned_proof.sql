alter table public.hunter_contexts
  alter column proof_preference drop not null,
  alter column proof_preference set default 'SYSTEM_ASSIGNED';

update public.hunter_contexts
set proof_preference = 'SYSTEM_ASSIGNED'
where proof_preference is null
   or proof_preference in ('TEXT', 'URL', 'PHOTO', 'METRIC');
