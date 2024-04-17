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

const user = mongoose.models.user || mongoose.model<IUser>("user", UserSchema);

export default user;
