import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { string } from "joi";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";
import { SHARE_ENV } from "worker_threads";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { UsersService } from "./users.service";

const mockRepository = () =>({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
})

const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn()
}

const mockMailService = {
    sendEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
}

type MockRepository<T = any> = Partial<Record<keyof Repository<User>, jest.Mock>>;

describe("UserService",()=>{

let service: UsersService;
let usersRepository: MockRepository<User>;
let verificationRepository: MockRepository<Verification>;
let mailservice: MailService;

beforeAll(async () => {
    const module = await Test.createTestingModule({
        providers: [UsersService, {
            provide: getRepositoryToken(User),
            useValue: mockRepository(),
        },
        {
            provide: getRepositoryToken(Verification),
            useValue: mockRepository(),
        },
        {
            provide: JwtService,
            useValue: mockJwtService,
        },
        {
            provide: MailService,
            useValue: mockMailService,
        }
    ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
    mailservice = module.get<MailService>(MailService);
})

it('should be defined',()=>{
    expect(service).toBeDefined();
})

describe('createAccount',()=>{
    const createAccountAgs = {
        email:"",
        password:"",
        role:0
    }
    it("should fail if user exists",async ()=>{
        usersRepository.findOne.mockResolvedValue({
            id:1,
            email:"sadfasdf"
        });
        const result = await service.createAccount(createAccountAgs)
        expect(result).toMatchObject({ok: false, error: 'There is a user with that email alerady'})
    })

    it("should create a new user",async ()=>{
        usersRepository.findOne.mockResolvedValue(undefined);
        usersRepository.create.mockReturnValue(createAccountAgs);
        usersRepository.save.mockResolvedValue(createAccountAgs);
        verificationRepository.create.mockReturnValue({user:createAccountAgs});
        verificationRepository.save.mockResolvedValue({
            email:"dlgyqja104@naver.com",
            code:"123123"
        });
        const result = await service.createAccount(createAccountAgs)
        expect(usersRepository.create).toHaveBeenCalledTimes(1);
        expect(usersRepository.create).toHaveBeenCalledWith(createAccountAgs);
        expect(usersRepository.save).toHaveBeenCalledTimes(1);
        expect(usersRepository.save).toHaveBeenCalledWith(createAccountAgs);
        expect(verificationRepository.create).toHaveBeenCalledTimes(1);
        expect(verificationRepository.create).toHaveBeenCalledWith({
            user:createAccountAgs
        });
        expect(verificationRepository.save).toHaveBeenCalledTimes(1);
        expect(verificationRepository.save).toHaveBeenCalledWith({user:createAccountAgs});
        expect(mailservice.sendVerificationEmail).toHaveBeenCalledTimes(1);
        expect(mailservice.sendVerificationEmail).toHaveBeenCalledWith(expect.any(String), expect.any(String));
        expect(result).toEqual({ok:true});
    })
    it('should fail on exception', async () => {
        usersRepository.findOne.mockRejectedValue(new Error());
        const result = await service.createAccount(createAccountAgs);
        expect(result).toMatchObject({ok:false, error: "Couldn't create account"});
    })
})

it.todo('login');
it.todo('findById');
it.todo('editProfile');
it.todo('verifyEmail');

})
