import { Test } from "@nestjs/testing"
import got from 'got'
import { CONFIG_OPTIONS } from "src/common/common.constants"
import { MailModule } from "./mail.module"
import { MailService } from "./mail.service"
import * as FormData from "form-data";
import { string } from "joi"


jest.mock('got');
jest.mock('form-data');

const MAILGUN_API_KEY = "6674c7eabbb12198fc7e0e728af688f4-156db0f1-1978c544"
const MAILGUN_DOMAIN_NAME = "sandboxf81876de6aea4c1286196d314ecc1bd6.mailgun.org"
const MAILGUN_FROM_EMAIL= "dlgyqja104@naver.com"

describe("MailService",()=>{
    let service: MailService

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers:[MailService,{
                provide: CONFIG_OPTIONS,
                useValue: {
                    apiKey:MAILGUN_API_KEY,
                    domain:MAILGUN_DOMAIN_NAME,
                    fromEmail:MAILGUN_FROM_EMAIL
                }
            }],
        }).compile();
        service = await module.get<MailService>(MailService);
    })
    it('should be defined',()=>{
        expect(service).toBeDefined();
    })

    describe('sendVerificationEmail',()=>{
        const sendVerifictaionEmailArgs ={
            email: 'email',
            code: 'code'
        }
        it('should call sendEmail',()=>{

            jest.spyOn(service, 'sendEmail').mockImplementation(async ()=> true);
            service.sendVerificationEmail(sendVerifictaionEmailArgs.email, sendVerifictaionEmailArgs.code)
            expect(service.sendEmail).toHaveBeenCalledTimes(1);
            expect(service.sendEmail).toHaveBeenCalledWith(
                "Verufy Your Email",
                "nubereats",
                [{key:"userName", value: sendVerifictaionEmailArgs.email},
                {key:"code", value: sendVerifictaionEmailArgs.code}  
            ]);
        })
    })
    describe('sendEmail',()=>{
        it('sendEmail',async ()=>{
            const ok = await service.sendEmail('','',[{key:"one", value:"1"}]);
            const fromSpy = jest.spyOn(FormData.prototype, "append");
            expect(fromSpy).toHaveBeenCalled();
            expect(got.post).toHaveBeenCalledTimes(1);
            expect(got.post).toHaveBeenCalledWith(
                `https://api.mailgun.net/v3/${MAILGUN_DOMAIN_NAME}/messages`,
                expect.any(Object));
            expect(ok).toEqual(true);
        })

        it('fails on error', async () => {
            jest.spyOn(got, 'post').mockImplementation(()=> {
                throw new Error();               
            });
            const ok = await service.sendEmail('','',[{key:"one", value:"1"}]);
            expect(ok).toEqual(false);
        })
    })
})