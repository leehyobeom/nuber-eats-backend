import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { createRestaurantDTO } from "./dtos/create-restaurant.dto";
import { Restaurant } from "./entities/restaurant.entity";

@Resolver(of => Restaurant)
export class RestaurantResolver {
    
    @Query(() => [Restaurant])
    restaurants(@Args('veganOnly') veganOnly:boolean): Restaurant[]{
        console.log(veganOnly);        
        return [];
    }

    @Mutation(returns => Boolean)
    createRestaurant(
        @Args() createRestaurantDTO:createRestaurantDTO
    ): boolean{
        console.log(createRestaurantDTO);
        return true;
    }
}