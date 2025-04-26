import { MigrationInterface, QueryRunner } from "typeorm";

export class RecycleBinFeature1745409304624 implements MigrationInterface {
    name = 'RecycleBinFeature1745409304624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`task\` ADD \`completedAt\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD \`isDeleted\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD \`deletedAt\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD \`deletedById\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD \`deletionReason\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD \`cancelledAt\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD \`cancelledById\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD \`cancellationReason\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`task\` CHANGE \`status\` \`status\` enum ('pending', 'in_progress', 'completed', 'cancelled', 'delegated', 'deleted') NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_26b96babe5a5ce54c7b2f10f158\` FOREIGN KEY (\`deletedById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_da1037791781d27fe7c4970bc74\` FOREIGN KEY (\`cancelledById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_da1037791781d27fe7c4970bc74\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_26b96babe5a5ce54c7b2f10f158\``);
        await queryRunner.query(`ALTER TABLE \`task\` CHANGE \`status\` \`status\` enum ('pending', 'in_progress', 'completed', 'cancelled', 'delegated') NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE \`task\` DROP COLUMN \`cancellationReason\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP COLUMN \`cancelledById\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP COLUMN \`cancelledAt\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP COLUMN \`deletionReason\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP COLUMN \`deletedById\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP COLUMN \`deletedAt\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP COLUMN \`isDeleted\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP COLUMN \`completedAt\``);
    }

}
