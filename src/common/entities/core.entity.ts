import { Field, ObjectType} from "@nestjs/graphql";
import { CreateDateColumn, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@ObjectType()
export class CoreEntity{
    @PrimaryGeneratedColumn()
    @Field(type => Number)
    id: number;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt:Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt:Date;
}