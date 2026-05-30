export const runtime = "edge";
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <SignUp />
    </div>
  )
}
