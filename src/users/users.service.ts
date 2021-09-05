import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
import { User } from "./entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "src/jwt/jwt.service";
import { EditPrifileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { PrivateKeyInput } from "crypto";
import { IS_EMAIL } from "class-validator";
import { Verification } from "./entities/verification.entity";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";
import { throws } from "assert";
import { CoreOutput } from "src/common/dtos/core.dto";
import { UserProfileOutput } from "./dtos/user-profile.dto";
import { MailService } from "src/mail/mail.service";


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) 
        private readonly users: Repository<User>,
        @InjectRepository(Verification) 
        private readonly verification: Repository<Verification>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService
    ){
    }

    async createAccount({email, password, role}: CreateAccountInput) : Promise<CreateAccountOutput>{
        try {
            const exists = await this.users.findOne({email})
            
            if(exists){
                return {ok: false, error: 'There is a user with that email alerady'};
            }
            const user = await this.users.save(this.users.create({email, password, role}));
            const verification = await this.verification.save(this.verification.create({
                user: user
            }));

            this.mailService.sendVerificationEmail(user.email, verification.code);
            return {ok: true}
        } catch (error) {
           return {ok:false, error: "Couldn't create account"};
        }
        // check new user
        // create user & hash the password
    }

    async login({email, password} : LoginInput) : Promise<LoginOutput>{
        //make a JWT and give it the user
        try {
            //find the user with the email
            const user = await this.users.findOne({email},{select:['id','password']});
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

    async findById(id:number): Promise<UserProfileOutput>{
        try {
            const user = await this.users.findOne({ id });
            if(!user){
                throw Error();
            }
            return {
                ok: Boolean(user),
                user: user
            }
        } catch (e) {
            return {
                ok:false,
                error: "User Not Found"
            }
        }
    }

    async editProfile(userId:number ,{email, password}:EditPrifileInput): Promise<EditProfileOutput>{
        const user = await this.users.findOne(userId);
        try {
            if(email){
                user.email = email
                user.emailVerified = false
                await this.verification.delete({ user: { id: user.id } });
                const verification = await this.verification.save(
                    this.verification.create({user})
                );
                this.mailService.sendVerificationEmail(user.email, verification.code);
            }
            if(password){
                user.password = password
            } 
            await this.users.save(user);
            return {
                ok:true
            }        
        } catch (error) {
            return {
                ok:false,
                error
            }
        }
    }

    async verifyEmail({code}:VerifyEmailInput): Promise<VerifyEmailOutput>{
        try {
            const verification = await this.verification.findOne(
                {code},
                {relations:['user']}
                );
            if(verification){
                verification.user.emailVerified = true;
                await this.users.save(verification.user);
                await this.verification.delete(verification.id);
                return {
                    ok:true
                }       
            }
            return {ok:false, error: 'Verification not found'};
        } catch (e) {       
            return {
                ok:false,
                error:e
            }
        }
    }
}