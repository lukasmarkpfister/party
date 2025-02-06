import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 