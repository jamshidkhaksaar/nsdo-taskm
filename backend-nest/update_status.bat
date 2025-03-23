@echo off
mysql -u root -proot -h localhost -D taskmanagement < src/migrations/UpdateTaskStatusEnum.sql 