import {redirect} from "next/navigation";import {requireUser} from "@/lib/http";import EmployeeAccess from "@/app/components/EmployeeAccess";
export default async function Page(){const user=await requireUser(["admin","employee"]);if(!user)redirect("/admin");return <EmployeeAccess name={user.name}/>}
