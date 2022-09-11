const jwt=require('jsonwebtoken');
const { refresh } = require('../controllers/Authcontroller');
const refreshModel = require('../models/refresh-model');
const AccessToken=process.env.JWT_ACCESS_TOKEN_SECRET;
const RefreshToken=process.env.JWT_REFRESH_TOKEN_SECRET;

class TokenService{
    
    generateTokens(payload){
        const accessToken=jwt.sign(payload,AccessToken,{
            expiresIn:'1h'
        });

        const refreshToken=jwt.sign(payload,RefreshToken,{
            expiresIn:'1y'
        })
        return {accessToken,refreshToken};
    }

    async storeRefreshTokens(token,userId){
        try{
            await refreshModel.create({
                token,
                userId,
            })
        }catch(err){
            console.log(err.message);
        }
    }

    async verifyAccessToken(token){
        return jwt.verify(token,AccessToken);
    }

    async verifyRefreshToken(token){
         return jwt.verify(token,RefreshToken)
    }

    async findRefreshTokenDB(userId,reftoken){
       return await refreshModel.findOne({userId:userId,token:reftoken});

    }

    async updateRefreshTokenDB(reftoken,id){
        return await refreshModel.updateOne({userId:id},{
            token:reftoken
        })
    }

    async removeToken(rftoken){
        await refreshModel.deleteOne({token:rftoken});
    }

}

module.exports=new TokenService();