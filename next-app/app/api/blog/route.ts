import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";
export async function GET(){const user=await requireUser();return json({posts:await store.posts.list(user?.role==="admin")});}
export async function POST(request:Request){if(!await requireUser(["admin"]))return json({error:"Unauthorized"},401);const b=await request.json().catch(()=>null);const title=safeText(b?.title,180),slug=safeText(b?.slug,160).replace(/[^a-z0-9]+/gi,"-").toLowerCase();if(!title||!slug)return json({error:"Title and slug are required."},422);return json({post:await store.posts.save({title,slug,excerpt:safeText(b?.excerpt,320),body:safeText(b?.body,20000),published:Boolean(b?.published)})},201);}
