begin;
select plan(3);

select has_extension('extensions', 'pgtap', 'pgTAP extension is installed');
select has_schema('tests', 'tests schema exists');
select has_function(
  'tests', 'authenticate_as', array['uuid'],
  'tests.authenticate_as(uuid) exists'
);

select * from finish();
rollback;
