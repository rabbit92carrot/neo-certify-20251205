import Link from 'next/link';

export const metadata = {
  title: 'Design System | Neo-Certify',
  description: 'Neo-Certify 화면설계서',
};

/**
 * Design System 레이아웃
 * 인증 불필요, 별도 레이아웃 사용
 */
export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/design-system" className="text-xl font-bold text-gray-900 hover:text-gray-700">
            Neo-Certify Design System
          </Link>
        </div>
      </header>
      <main className="h-[calc(100vh-65px)]">{children}</main>
    </div>
  );
}
