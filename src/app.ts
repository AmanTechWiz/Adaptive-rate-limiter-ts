import express from "express";
import { rateLimiterMiddleware } from "./middleware/rateLimiterMiddleware";

export const createApp = () => {
    const app = express();
    app.use(express.json());

    app.get("/health",(req,res)=>{
        res.json({status:"ok"});
    })

    app.use("/api",rateLimiterMiddleware);

    app.get("/api/data",(req,res)=>{
        res.json({message: "hello from the rate-limited API."});
    })

    app.get("/api/login",(req,res)=>{
        res.json({message:"Login successful (demo endpoint)"});
    });

    return app;
}