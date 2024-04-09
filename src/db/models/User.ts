import mongoose from "mongoose";

interface IUser extends mongoose.Document{
    uid: string;    
    name: string;
    createdAt: Date;
}

const UserSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;