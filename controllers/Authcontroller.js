const otpService = require('../services/otp-service');
const UserService=require('../services/user-service')
const tokenService = require('../services/token-service');
const OtpService=require('../services/otp-service')
const User_dtos=require('../dtos/user-dto');
const userService = require('../services/user-service');
class Authcontroller{

    async sendOtp(req,res){
        //logic
        const {phone}=req.body;
        if(!phone){
            res.status(400).json({message:'Phone Field is Required'});
        }
        const otp=await OtpService.generateOtp();
        const ttl=1000*60*10;//2 min time
        const expires=Date.now()+ttl;
        const data=`${phone}.${otp}.${expires}`;
        const hash =OtpService.hashOtp(data); //hashed info
        

        //send otp
        try{
            // await otpService.sendBySms(phone,otp);
            return res.json({
                hash:`${hash}.${expires}`,
                phone,
                otp
            })
        }catch(err){
            console.log(err);
            res.status(500).json({message:'OTP sending failed'})
        }
       

        //sms service using twilio
        res.json({hash});
    }

    async verifyOtp(req,res){

        const {otp,hash,phone}=req.body;
        if(!otp || !hash || !phone){
            res.status(400).json({message:"All Fields are Required"});
        }
        
        const [hashedOtp ,expires]=hash.split('.');
        if(Date.now()> +expires){
            res.status(400).json({message:'Otp Expired'});
        }

        const data=`${phone}.${otp}.${expires}`;
        const isValid=otpService.verifyOtp(hashedOtp,data);
        if(!isValid){
            return res.status(400).json({message:"Invalid Otp"})
        }

        let user;
       
        try{
            user =await UserService.findUser({phone:phone});
            if(!user){
                user=await UserService.createUser({phone});
            }
        }catch(err){
            console.log(err)
            return res.status(500).json({message:'DB Error'})
        }

        //JWT(jason web token) TOKEN
        const {accessToken,refreshToken}=tokenService.generateTokens({_id:user._id,activated:false});

        await tokenService.storeRefreshTokens(refreshToken,user._id);
        res.cookie('refreshtoken',refreshToken,{
            maxAge:1000*60*60*24*30,
            sameSite: 'none',
            secure:true,
        })
        res.cookie('accesstoken',accessToken,{
            maxAge:1000*60*60*24*30,
            sameSite: 'none',
            secure:true,
        })
        const User=new User_dtos(user);
        return res.json({auth:true,user:User})
    }

    async refresh(req,res){
        //get refresh token from cookie
        
        const { refreshtoken: rftokenFromCookie } = req.cookies;
        

        //check if refresh token is valid or not
        let userData;
        try{
            userData=await tokenService.verifyRefreshToken(rftokenFromCookie)
        }catch(err){
            return res.status(401).json({message:"Invalid Refresh Token"})
        }

        //check if refresh token is in db or not
        try{
        const token= await tokenService.findRefreshTokenDB(userData._id,rftokenFromCookie);
        if(!token){
            return res.status(401).json({message:"Invalid Token"})
        }
        }catch(err){
            return res.status(500).json({message:"Internal Error"});
        }
        
        //check if valid user
        const user=await userService.findUser({_id:userData._id});
        if(!user){
            return res.status(404).json({message:"No user"})
        }

        //generate new tokens access+refresh
        const {refreshToken:reftoken,accessToken:acctoken} =await tokenService.generateTokens({_id:userData._id})

        //updata refresh token in db
        try{
            await tokenService.updateRefreshTokenDB(reftoken,userData._id);
        }catch(err){
            return res.status(500).json({message:"Internal Error"})
        }
        //put it in cookie
        res.cookie('refreshtoken',reftoken,{
            maxAge:1000*60*60*24*30,
            sameSite: 'none',
            secure:true,
        })
        res.cookie('accesstoken',acctoken,{
            maxAge:1000*60*60*24*30,
            sameSite: 'none',
            secure:true,
        })
        const User=new User_dtos(user);
        res.json({auth:true,user:User})
    }

    async logout(req,res){
        //delete refreshtoken from db
        const {refreshToken} =req.cookies;
        tokenService.removeToken(refreshToken);
        
        //delete cookies
        res.clearCookie('refreshtoken');
        res.clearCookie('accesstoken');

        res.json({user:null,auth:false})
    }
}

module.exports=new Authcontroller();