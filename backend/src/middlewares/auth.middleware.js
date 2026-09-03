
import jwt from "jsonwebtoken";
import userModel from "../model/user.model.js";

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "User not authorized"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        const user = await userModel.findById(decoded._id);

        if (!user) {
            return res.status(401).json({
                message: "User not authorized"
            });
        }

        req.user = user;

        next();
    }
    catch (err) {
        console.log("Authentication error:", err);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

export default authMiddleware;
