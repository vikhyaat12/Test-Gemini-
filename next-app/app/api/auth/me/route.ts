import { requireUser, json } from "@/lib/http";
export async function GET(){const user=await requireUser();return user?json({user:{id:user.id,name:user.name,email:user.email,role:user.role}}):json({user:null});}
