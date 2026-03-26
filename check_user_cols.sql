-- Verificador de Colunas em Tempo Real
CREATE OR REPLACE FUNCTION public.check_columns()
RETURNS TEXT AS $$
DECLARE
    r RECORD;
    cols TEXT := '';
BEGIN
    FOR r IN SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND table_schema = 'public' LOOP
        cols := cols || r.column_name || ', ';
    END LOOP;
    RETURN cols;
END;
$$ LANGUAGE plpgsql;

SELECT public.check_columns();
