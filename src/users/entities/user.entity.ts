import { Field, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { CoreEntity } from "src/common/entities/core.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity } from "typeorm";
import * as bcrypt from "bcrypt"
import { InternalServerErrorException } from "@nestjs/common";
import { IsEmail, IsEnum, IsString } from "class-validator";

enum UserRole {
    Client,
    Owner,
    Delivery
};

registerEnumType(UserRole,{name: 'UserRole'});

@InputType({ isAbstract: true}) // GraphQL
@ObjectType() // GraphQL
@Entity() //TypeORM
export class User extends CoreEntity{

    @Column({unique:true})
    @Field(type => String)
    @IsEmail()
    email: string;

    @Column({select: false})
    @Field(type => String)
    password: string;

    @Column({default:false})
    @Field(type => Boolean)
    emailVerified: boolean

    @Column({type: 'enum', enum: UserRole})
    @Field(type => UserRole)
    @IsEnum(UserRole)
    role:UserRole;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void>{
        if(this.password){
            try {
                this.password = await bcrypt.hash(this.password, 10); 
            } catch (error) {
                throw new InternalServerErrorException();           
            }
        }
    }

    async checkPassword(aPassword:string): Promise<boolean>{
        try {
           const ok = await bcrypt.compare(aPassword, this.password);
           return ok
        } catch (error) {
           return false
        }
    }
}