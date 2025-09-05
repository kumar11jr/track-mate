import {z} from 'zod';

const signUpSchema = z.object({
    name : z.string().min(3,{message:"Name should be at least 3 characters long"}),
    email : z.string().regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,{message:"Invalid email address"}),
    password : z.string().min(6,{message:"Password should be at least 6 characters long"})
})

export default signUpSchema;