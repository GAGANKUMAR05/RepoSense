import userModel from "../model/user.model.js";
import bcryptjs from  'bcryptjs'
import jwt from 'jsonwebtoken'

const registerController = async(req,res)=>{
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if(!username || !email || !password)
    {
        return res.status(400).json({
            message:"Enter valid details"
        })
    }

    if (username.length > 40 || password.length < 8 || password.length > 200 || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: "Use a valid email, a username under 40 characters, and a password of at least 8 characters." });
    }

    const userAlreadyExist = await userModel.findOne({
        $or: [{ username }, { email }]
    });

    if(userAlreadyExist)
    {
        return res.status(401).json({
            message:"user already exsists"
        })
    }

    const hashpass = await bcryptjs.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password:hashpass
    })

    const token = jwt.sign({
        _id: user._id,
        username: user.username
    },process.env.JWT_SECRET_KEY)

    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({
        message:"User registered successfully",
        user:{
            username,
            id:user._id,
            email
        }
    })
};

const loginController = async(req,res)=>{
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if( !email || !password)
        {
            return res.status(401).json({
                message:"Enter valid details"
            })
        }

    const user = await userModel.findOne({
        email
    })

    if(!user)
    {
        return res.status(401).json({
            message:"User not found"
        })
    }

    const isPasswordValid =  await bcryptjs.compare(password,user.password)

    if(!isPasswordValid)
    {
        return res.status(401).json({
            message:"Password is incorrect"
        })
    }

    const token = jwt.sign({
        _id: user._id,
        username: user.username
    },process.env.JWT_SECRET_KEY)

    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({
        message:"User logged in successfully",
        user:{
            id:user._id,
            username:user.username,
            email
        }
    })

};


const logoutController = async (req, res) => {

    res.clearCookie("token");

    res.status(200).json({
        message: "User logged out successfully"
    });
};

const meController = async(req,res)=>{
    const user = req.user;
    res.status(201).json({
        user:{
            username : user.username,
            _id : user._id,
            email : user.email
        }
    })

};


export {
    registerController,
    loginController,
    logoutController,
    meController
}
