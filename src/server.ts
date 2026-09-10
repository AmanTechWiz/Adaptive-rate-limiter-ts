import { createApp } from "./app";

const PORT = Number(process.env.PORT ?? 3000);

createApp().listen(PORT,()=>{
    console.log(`Server is listening on https://localhost:${PORT}`);
})