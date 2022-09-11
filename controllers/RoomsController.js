const roomService = require("../services/room-service");
const RoomDto =require('../dtos/room.dto')
class RoomsController{
    async create(req,res){
        const {Topic,roomType}=req.body;

        if(!Topic||!roomType){
            return res.status(400).json({message:'All Field are required'})
        }

        const room =await roomService.create(
            {
                topic:Topic,
                roomType,
                ownerId:req.user._id,
            }
        )

        return res.json(new RoomDto(room));
    }

    async getRooms(req,res){
        const rooms=await roomService.getAllRooms(['open']);
        const allRooms=rooms.map(room=>new RoomDto(room));
        return res.json(allRooms);
    }

    async show(req,res){
        const room =await roomService.getRoom(req.params.roomId);
        return res.json(room)
    }
}

module.exports=new RoomsController