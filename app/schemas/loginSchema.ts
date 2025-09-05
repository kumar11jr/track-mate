import {z} from "zod";

const loginSchema = z.object({
    email : z.string().regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,{message:"Invalid email address"}),
    password : z.string().min(6,{message:"Password should be at least 6 characters long"})
})

export default loginSchema;