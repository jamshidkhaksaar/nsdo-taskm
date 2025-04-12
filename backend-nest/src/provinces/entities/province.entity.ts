import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';

@Entity()
export class Province {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Department, department => department.province)
  departments: Department[];
}