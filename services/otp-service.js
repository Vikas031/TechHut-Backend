const crypto=require('crypto');
const smsSid=process.env.SMS_SID;
const smsAuthToken=process.env.SMS_AUTH_TOKEN;
const twilio=require('twilio')(smsSid,smsAuthToken,{
    lazyLoading:true
})
class OtpService{

    async generateOtp(){
        const otp=crypto.randomInt(1000,9999);
        return otp;
    }

    async sendBySms(phone,otp){
        return await twilio.messages.create({
            to:phone,
            from:process.env.SMS_FROM_NUMBER,
            body:`Your TechHut's OTP is ${otp}`
        })
    }

    verifyOtp(hashedOtp,data){
        let computedHash=this.hashOtp(data);
        return hashedOtp===computedHash;
    }

    hashOtp(otp){
        return crypto.createHmac('sha256',process.env.HASH_SECRET).update(otp).digest('hex');
    }



}

module.exports=new OtpService();