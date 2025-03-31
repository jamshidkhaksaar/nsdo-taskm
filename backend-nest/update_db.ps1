$sql = Get-Content -Path "src/migrations/UpdateTaskColumns.sql" -Raw
mysql --user=root --password=root --host=localhost --database=taskmanagement --execute="$sql"
