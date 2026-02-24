import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header style={{ backgroundColor: '#25423D', paddingTop: '40px', paddingBottom: '8px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
              <Image
                src="/Logo1.png"
                alt="PD RightsCheck Logo"
                width={48}
                height={48}
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 600, color: '#F0ECE3', letterSpacing: '0.05em', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              PD RightsCheck
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
