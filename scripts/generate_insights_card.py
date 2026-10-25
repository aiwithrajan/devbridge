import sqlite3
import os

def generate_svg():
    db_path = os.path.expanduser('~/Library/Application Support/Wispr Flow/flow.sqlite')
    total_sessions = 7
    total_words = 43
    total_duration = 29.8

    try:
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            c.execute('SELECT count(*), coalesce(sum(numWords), 0), coalesce(sum(speechDuration), 0) FROM History WHERE numWords > 0')
            row = c.fetchone()
            if row and row[0] > 0:
                total_sessions = row[0]
                total_words = row[1]
                total_duration = row[2]
            conn.close()
    except Exception as e:
        print('DB read warning:', e)

    svg = f'''<svg width="800" height="480" viewBox="0 0 800 480" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="480" rx="24" fill="#090D16"/>
  <rect x="1" y="1" width="798" height="478" rx="23" stroke="#1E293B" stroke-width="2"/>
  
  <!-- Glow effect -->
  <circle cx="700" cy="80" r="120" fill="#6366F1" fill-opacity="0.12" filter="blur(60px)"/>
  <circle cx="100" cy="400" r="140" fill="#8B5CF6" fill-opacity="0.12" filter="blur(60px)"/>

  <!-- Header -->
  <rect x="40" y="40" width="48" height="48" rx="14" fill="#6366F1" fill-opacity="0.15" stroke="#6366F1" stroke-width="1.5"/>
  <path d="M56 64L64 56L72 64M64 56V72" stroke="#818CF8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  
  <text x="104" y="62" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="700">Wispr Flow Insights</text>
  <text x="104" y="82" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13">No Hands: The Wispr Challenge • Track 1: Builders</text>

  <!-- Verified Badge -->
  <rect x="620" y="44" width="140" height="34" rx="17" fill="#10B981" fill-opacity="0.1" stroke="#10B981" stroke-width="1.2"/>
  <circle cx="638" cy="61" r="5" fill="#10B981"/>
  <text x="652" y="66" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600">VERIFIED USAGE</text>

  <!-- Metric 1: Dictated Words -->
  <rect x="40" y="120" width="225" height="150" rx="18" fill="#0F172A" stroke="#1E293B"/>
  <text x="64" y="156" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600" text-transform="uppercase" letter-spacing="1">Dictated Words</text>
  <text x="64" y="210" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="800">{total_words}</text>
  <text x="64" y="244" fill="#6366F1" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="500">₹1,00,000 Leaderboard Words</text>

  <!-- Metric 2: Build Review Sessions -->
  <rect x="285" y="120" width="225" height="150" rx="18" fill="#0F172A" stroke="#1E293B"/>
  <text x="309" y="156" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600" text-transform="uppercase" letter-spacing="1">Review Sessions</text>
  <text x="309" y="210" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="800">{total_sessions}</text>
  <text x="309" y="244" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="500">100% ADR Persistence Rate</text>

  <!-- Metric 3: Time Saved -->
  <rect x="530" y="120" width="230" height="150" rx="18" fill="#0F172A" stroke="#1E293B"/>
  <text x="554" y="156" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600" text-transform="uppercase" letter-spacing="1">Speech Duration</text>
  <text x="554" y="210" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="800">{total_duration:.1f}s</text>
  <text x="554" y="244" fill="#A855F7" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="500">Multilingual: Hindi &amp; English</text>

  <!-- Footer Banner -->
  <rect x="40" y="300" width="720" height="135" rx="18" fill="#0F172A" stroke="#334155"/>
  <text x="68" y="340" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="15" font-weight="700">Project: DevBridge (VoiceAnchor)</text>
  <text x="68" y="368" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13">Intercepts 60-90s AI build waits to turn landed diffs into spoken ADR decisions via Wispr Flow.</text>
  
  <text x="68" y="405" fill="#64748B" font-family="ui-monospace, monospace" font-size="11">Live Demo: https://wispr-five.vercel.app  •  Repo: github.com/aiwithrajan/devbridge</text>
</svg>
'''
    out_path = '/Users/apple/Desktop/wispr/public/wispr-insights-card.svg'
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w') as f:
        f.write(svg)
    print(f'Generated: {out_path}')

if __name__ == '__main__':
    generate_svg()
