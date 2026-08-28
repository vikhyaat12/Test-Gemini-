import { json } from "@/lib/http";
export async function POST(){const response=json({ok:true});response.cookies.set("qc_session","",{httpOnly:true,path:"/",maxAge:0});return response;}
