import { ArgsType, Field, InputType, OmitType, PartialType } from "@nestjs/graphql";
import { IsBoolean, IsString, Length } from "class-validator";
import { number } from "joi";
import { Restaurant } from "../entities/restaurant.entity";
import { CreateRestaurantDTO } from "./create-restaurant.dto";



@InputType()
class UpdateRestaurantInputType extends PartialType(CreateRestaurantDTO){}

@InputType()
export class UpdateRestaurantDTO {

    @Field(type => Number)
    id: number;

    @Field(type => UpdateRestaurantInputType)
    data: UpdateRestaurantInputType
}