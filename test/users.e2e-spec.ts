import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

const GRAPQL_ENDPOINT = '/graphql';
const testUser = {
  EMAIL: 'dlgyqja104@naver.com',
  PASSWORD: '1234',
};

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let userRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;

  const baseTest = () => request(app.getHttpServer()).post(GRAPQL_ENDPOINT); 
  const publicTest = (query: string) => baseTest().send({query});
  const privateTest = (query: string) =>
    baseTest()
      .set('X-JWT', jwtToken)
      .send({query})

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification));
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    const mutation_createAccount = `
      mutation{
        createAccount(
          input:{
            email:"${testUser.EMAIL}"
            password:"${testUser.PASSWORD}"
            role:Owner
          }){
          ok
          error
        }
      }`

    it('should create account', () => {

      return publicTest(mutation_createAccount)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {

      return publicTest(mutation_createAccount)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe(
            'There is a user with that email alerady',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPQL_ENDPOINT)
        .send({
          query: `
        mutation{
          login(input:{
            email:"${testUser.EMAIL}"
            password:"${testUser.PASSWORD}"
        }){
          ok
          error
          token
        }
      }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should not be able to login whith wrong credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPQL_ENDPOINT)
        .send({
          query: `
        mutation{
          login(input:{
            email:"${testUser.EMAIL}"
            password:"Wrong password"
        }){
          ok
          error
          token
        }
      }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toEqual('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('UserProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await userRepository.find();
      userId = user.id;
    });

    it("should see a user's profile", async () => {
      
      return await request(app.getHttpServer())
        .post(GRAPQL_ENDPOINT)
        .set(`X-JWT`, jwtToken)
        .send({
          query: `
          {
            userProfile(userId:1){
              ok
              error
              user{
                id
              }
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {          
          const {
            body: {
              data: {
                userProfile: {
                ok,
                error,
                user:{
                  id
                }
                }
              },
            },
          } = res;
          expect(ok).toBe(true)
          expect(error).toBe(null)
          expect(id).toBe(userId)
        })
    });
    it('should not find a profile', async () => {

      return await request(app.getHttpServer())
        .post(GRAPQL_ENDPOINT)
        .set(`X-JWT`, jwtToken)
        .send({
          query: `
          {
            userProfile(userId:123345){
              ok
              error
              user{
                id
              }
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {          
          const {
            body: {
              data: {
                userProfile: {
                ok,
                error,
                user
                }
              },
            },
          } = res;
          expect(ok).toBe(false)
          expect(error).toBe("User Not Found")
          expect(user).toBe(null)
        })

    });
  });

  describe('me', () => {
    it('should return find my profile', () => {
      return  request(app.getHttpServer())
      .post(GRAPQL_ENDPOINT)
      .set("X-JWT", jwtToken)
      .send({
        query:`{
          me{
            email
          }
        }
        `
      })
      .expect(200)
      .expect(res =>{
        const {
          body:{
            data:{
              me
            }
          }
        } =res;
        expect(me.email).toBe(testUser.EMAIL);
      })
    });

    it("should not allow logged out user",()=>{
      return  request(app.getHttpServer())
      .post(GRAPQL_ENDPOINT)
      .send({
        query:`{
          me{
            email
          }
        }
        `
      })
      .expect(200)
      .expect(res =>{
        const {
          body:{
            errors
          }
        } =res;
        const [error] = errors;
        expect(error.message).toBe("Forbidden resource");
      })
    })

  });

  describe('editProfile', () => {
    const NEW_EMAIL = "dlgyqja104@gmail.com"
    it('should change email', () => {
      return request(app.getHttpServer())
      .post(GRAPQL_ENDPOINT)
      .set("X-JWT", jwtToken)
      .send({
        query:`
        mutation{
          editProfile(input:{
          email:"${NEW_EMAIL}"
        }){
          ok
          error
        }
      }
      `
      })
      .expect(200)
      .expect(res => {
        const {
          body:{
            data:{
              editProfile:{
                ok,
                error
              }
            }
          }
        } = res;        
        expect(ok).toBe(true);
        expect(error).toBe(null);
      })
      .then(()=>{
        return request(app.getHttpServer())
          .post(GRAPQL_ENDPOINT)
          .set("X-JWT", jwtToken)
          .send({
            query:`{
              me{
                email
              }
            }
            `
          })
          .expect(200)
          .expect(res=>{
            const {
              body:{
                data:{
                  me
                }
              }
            } =res;
            expect(me.email).toBe(NEW_EMAIL);
          })
      })
    });
  });

  describe('verifyEmail', () => {

    let verificationCode: string;
    beforeAll(async()=>{
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
      console.log(verification.code);  
    });

    it('should verify email', () => {
      return request(app.getHttpServer())
      .post(GRAPQL_ENDPOINT)
      .send({
        query:`
          mutation{
            verifyEmail(input:{
              code:"${verificationCode}"
            }){
              ok
              error
            }
          }
        `
      })
      .expect(200)
      .expect(res => {
        const {
          body:{
            data:{
              verifyEmail:{
                ok,
                error
              }
            }
          }
        } = res;
        expect(ok).toBe(true);
        expect(error).toBe(null);
      })
    });

    it('should fail on wrong verification code', () => {
      return request(app.getHttpServer())
      .post(GRAPQL_ENDPOINT)
      .send({
        query:`
          mutation{
            verifyEmail(input:{
              code:"Error"
            }){
              ok
              error
            }
          }
        `
      })
      .expect(200)
      .expect(res => {
        const {
          body:{
            data:{
              verifyEmail:{
                ok,
                error
              }
            }
          }
        } = res;
        expect(ok).toBe(false);
        expect(error).toBe('Verification not found');
      })
    });

    
  });

});
