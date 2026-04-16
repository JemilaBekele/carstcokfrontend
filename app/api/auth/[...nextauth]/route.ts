import NextAuth from "next-auth";
import authConfig from "@/auth.config";
 
//change

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };