import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAccountInput } from "./dtos/create-account.dto";
import { LoginInput } from "./dtos/login.dto";
import { User } from "./entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "src/jwt/jwt.service";
import { EditPrifileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { PrivateKeyInput } from "crypto";
import { IS_EMAIL } from "class-validator";


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) 
        private readonly users: Repository<User>,
        private readonly jwtService: JwtService
    ){
    }

    async createAccount({email, password, role}: CreateAccountInput) : Promise<{ok:boolean, error?:string}>{
        try {
            const exists = await this.users.findOne({email})
            if(exists){
                return {ok: false, error: 'There is a user with that email alerady'};
            }
            await this.users.save(this.users.create({email, password, role}));
            return {ok: true}
        } catch (error) {
           return {ok:false, error: "Couldn't create account"};
        }
        // check new user
        // create user & hash the password
    }

    async login({email, password} : LoginInput) : Promise<{ok:boolean; error?:string; token?:string}>{
        //make a JWT and give it the user
        try {

            //find the user with the email
            const user = await this.users.findOne({email});
            if(!user){
                return{
                    ok: false,
                    error: "User not found"
                }
            }
            //check if the password is correct
            const passwordCorrect = await user.checkPassword(password);
            if(!passwordCorrect){
                return{
                    ok: false,
                    error: "Wrong password"
                }
            }
            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                token
            };

        } catch (error) {
            return {
                ok: false,
                error
            }
        }
    }

    async findById(id:number): Promise<User>{
        return this.users.findOne({ id });
    }

    async editProfile(userId:number ,{email, password}:EditPrifileInput): Promise<User>{
        const user = await this.users.findOne(userId);
        if(email){
            user.email = email
        }
        if(password){
            user.password = password
        }
        return this.users.save(user);
    }
}