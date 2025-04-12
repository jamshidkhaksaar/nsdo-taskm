import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class AddProvinceAndFlexibleTaskAssignment1744318018152 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create province table
        await queryRunner.createTable(new Table({
            name: "province",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, isGenerated: true, generationStrategy: "uuid" },
                { name: "name", type: "varchar", isUnique: true },
                { name: "description", type: "varchar", isNullable: true }
            ]
        }), true);

        // 2. Add provinceId to department
        await queryRunner.addColumn("department", new TableColumn({
            name: "provinceId",
            type: "uuid",
            isNullable: true
        }));

        // 3. Add foreign key from department.provinceId to province.id
        await queryRunner.createForeignKey("department", new TableForeignKey({
            columnNames: ["provinceId"],
            referencedTableName: "province",
            referencedColumnNames: ["id"],
            onDelete: "SET NULL"
        }));

        // 4. Add/alter task table for new assignment logic
        await queryRunner.addColumn("task", new TableColumn({
            name: "type",
            type: "varchar",
            isNullable: false,
            default: "'user'"
        }));

        await queryRunner.addColumn("task", new TableColumn({
            name: "assignedToDepartmentIds",
            type: "simple-array",
            isNullable: true
        }));

        await queryRunner.addColumn("task", new TableColumn({
            name: "assignedToProvinceId",
            type: "uuid",
            isNullable: true
        }));

        await queryRunner.addColumn("task", new TableColumn({
            name: "delegatedByUserId",
            type: "uuid",
            isNullable: true
        }));

        // 5. Create join table for assignedToUsers (task_assignees)
        await queryRunner.createTable(new Table({
            name: "task_assignees",
            columns: [
                { name: "task_id", type: "int", isPrimary: true },
                { name: "user_id", type: "uuid", isPrimary: true }
            ],
            foreignKeys: [
                {
                    columnNames: ["task_id"],
                    referencedTableName: "task",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE"
                },
                {
                    columnNames: ["user_id"],
                    referencedTableName: "user",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE"
                }
            ]
        }), true);

        // 6. Add foreign key for delegatedByUserId
        await queryRunner.createForeignKey("task", new TableForeignKey({
            columnNames: ["delegatedByUserId"],
            referencedTableName: "user",
            referencedColumnNames: ["id"],
            onDelete: "SET NULL"
        }));

        // 7. Add foreign key for assignedToProvinceId
        await queryRunner.createForeignKey("task", new TableForeignKey({
            columnNames: ["assignedToProvinceId"],
            referencedTableName: "province",
            referencedColumnNames: ["id"],
            onDelete: "SET NULL"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        const taskTable = await queryRunner.getTable("task");
        const departmentTable = await queryRunner.getTable("department");

        // Remove foreign keys from task
        if (taskTable) {
            for (const fk of taskTable.foreignKeys) {
                if (["delegatedByUserId", "assignedToProvinceId"].some(col => fk.columnNames.includes(col))) {
                    await queryRunner.dropForeignKey("task", fk);
                }
            }
        }

        // Remove foreign key from department
        if (departmentTable) {
            for (const fk of departmentTable.foreignKeys) {
                if (fk.columnNames.includes("provinceId")) {
                    await queryRunner.dropForeignKey("department", fk);
                }
            }
        }

        // Drop columns from task
        await queryRunner.dropColumn("task", "type");
        await queryRunner.dropColumn("task", "assignedToDepartmentIds");
        await queryRunner.dropColumn("task", "assignedToProvinceId");
        await queryRunner.dropColumn("task", "delegatedByUserId");

        // Drop join table
        await queryRunner.dropTable("task_assignees");

        // Drop provinceId from department
        await queryRunner.dropColumn("department", "provinceId");

        // Drop province table
        await queryRunner.dropTable("province");
    }
}
