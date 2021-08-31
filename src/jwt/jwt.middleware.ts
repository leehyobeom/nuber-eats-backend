import { Injectable, NestMiddleware } from "@nestjs/common";
import { NestApplication } from "@nestjs/core";
import { NextFunction } from "express";
import { UsersService } from "src/users/users.service";
import { JwtService } from "./jwt.service";


@Injectable()
export class JwtMiddleware implements NestMiddleware{
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UsersService
    ){}
    async use(req:Request,res:Response, next:NextFunction){
        if("x-jwt" in req.headers){
            const token = req.headers["x-jwt"];
            const decoded = this.jwtService.verify(token.toString());
            try {
                    if(typeof decoded === 'object' && decoded.hasOwnProperty('id')){
                        const user = await this.userService.findById(decoded['id'])
                        req['user'] = user;
                    }
                } catch (e) {
                    
                }
        }
        next();
    }
}

// export function jwtMiddleware(req:Request, res:Response, next:NextFunction){
//     console.log(req.headers);
//     next();
// }