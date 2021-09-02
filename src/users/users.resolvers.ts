import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { AuthGuard } from "src/auth/auth.guard";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { EditPrifileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
import { UserProfileInput, UserProfileOutput } from "./dtos/user-profile.dto";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

@Resolver(of => User)
export class  UsersResolver {
    constructor( private readonly userService: UsersService){}
    @Query(returns => Boolean)
    hi(){
        return true;
    }

    @Query(returns => User)
    @UseGuards(AuthGuard)
    me(
        @AuthUser() authUser: User
    ){
        return authUser;
    }

    @Mutation(returns => CreateAccountOutput)
    createAccount(@Args("input") createAccountInput: CreateAccountInput): Promise<CreateAccountOutput>{
            return this.userService.createAccount(createAccountInput);
    }

    @Mutation(returns => LoginOutput)
    login(@Args("input") loginInput: LoginInput): Promise<LoginOutput>{
            return this.userService.login(loginInput);
    }

    @UseGuards(AuthGuard)
    @Query(returns => UserProfileOutput)
    userProfile(@Args() {userId}:UserProfileInput): Promise<UserProfileOutput>{
        return this.userService.findById(userId);
    }

    @UseGuards(AuthGuard)
    @Mutation(returns => EditProfileOutput)
    editProfile(
        @AuthUser() authUser: User,
        @Args("input") editProfileInput: EditPrifileInput
        ): Promise<EditProfileOutput>{   
        return this.userService.editProfile(authUser.id, editProfileInput);
 
    }

    @Mutation(returns => VerifyEmailOutput)
    verifyEmail(@Args('input') verifyEmailinput:VerifyEmailInput):Promise<VerifyEmailOutput>{
           return this.userService.verifyEmail({...verifyEmailinput})
    }
}