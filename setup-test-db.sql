SET client_min_messages TO WARNING;
DROP DATABASE IF EXISTS baluarte_test;
DROP USER IF EXISTS test;
CREATE USER test WITH PASSWORD 'test';
CREATE DATABASE baluarte_test OWNER test;
\c baluarte_test
GRANT ALL ON SCHEMA public TO test;
GRANT ALL ON ALL TABLES IN SCHEMA public TO test;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO test;