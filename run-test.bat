@echo off
echo Configurando banco de testes PostgreSQL...

docker exec -i baluarte-db psql -U postgres -c "DROP DATABASE IF EXISTS baluarte_test;" 2>nul
docker exec -i baluarte-db psql -U postgres -c "DROP USER IF EXISTS test;" 2>nul
docker exec -i baluarte-db psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';" 2>nul
docker exec -i baluarte-db psql -U postgres -c "CREATE DATABASE baluarte_test OWNER test;" 2>nul
docker exec -i baluarte-db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE baluarte_test TO test;" 2>nul
docker exec -i baluarte-db psql -U postgres -d baluarte_test -c "GRANT ALL ON SCHEMA public TO test;" 2>nul
docker exec -i baluarte-db psql -U postgres -d baluarte_test -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test;" 2>nul
docker exec -i baluarte-db psql -U postgres -d baluarte_test -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test;" 2>nul

echo Banco de testes configurado com sucesso!
echo Rodando testes...

cd Baluarte-core
call mvnw.cmd clean test -Dtest=FlywayMigrationStartupTest

cd ..
pause