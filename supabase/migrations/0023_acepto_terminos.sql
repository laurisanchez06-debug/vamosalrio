-- Prueba del consentimiento: fecha/hora en que el usuario aceptó los Términos
-- y la Política de Privacidad al registrarse.
alter table public.profiles
  add column if not exists acepto_terminos_at timestamptz;
