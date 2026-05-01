import LoginForm from '@/components/forms/LoginForm'

type LoginPageProps = {
  searchParams?: Promise<{
    from?: string
  }>
}

export default async function Login({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return <LoginForm redirectTo={params?.from} />
}
