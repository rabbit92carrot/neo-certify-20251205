import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center px-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">네오인증서</CardTitle>
            <CardDescription>JAMBER 정품 인증 시스템</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild className="w-full">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/register">회원가입</Link>
            </Button>
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} 주식회사 네오닥터. All rights reserved.
        </p>
      </main>
    </div>
  );
}
