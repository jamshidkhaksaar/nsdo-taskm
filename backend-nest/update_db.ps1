$sql = Get-Content -Path "src/migrations/UpdateTaskStatusEnum.sql" -Raw
$password = "root"

# Execute the SQL
mysql --user=root --password=$password --host=localhost --database=taskmanagement --execute="$sql" 