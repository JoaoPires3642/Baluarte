import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <SignIn />
    </div>
  )
}
