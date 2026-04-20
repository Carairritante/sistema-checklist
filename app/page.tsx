import { redirect } from 'next/navigation'

// O middleware já cuida dos redirects — esta página nunca deve renderizar
export default function Home() {
  redirect('/checklist')
}
