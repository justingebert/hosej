import mongoose from "mongoose";

interface IUser extends mongoose.Document{  
    username: string;
    createdAt: Date;
}

const UserSchema = new mongoose.Schema({
    username: {
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