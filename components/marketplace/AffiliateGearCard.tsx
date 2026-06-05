import type { AffiliateGear } from '@/types/marketplace'

interface AffiliateGearCardProps {
  gear: AffiliateGear
}

function badgeClass(platform: string): string {
  switch (platform) {
    case 'AMAZON':
      return 'bg-electric-yellow text-black'
    case 'TEMU':
      return 'bg-electric-red text-white'
    case 'ALIEXPRESS':
      return 'bg-electric-blue text-white'
    default:
      return 'bg-white/10 text-white'
  }
}

export default function AffiliateGearCard({ gear }: AffiliateGearCardProps) {
  const price = (gear.retailPriceCents / 100).toFixed(2)

  return (
    <div className="flex flex-col justify-between border-2 border-white/20 bg-[#111111] p-4 transition-colors duration-150 hover:border-electric-yellow">
      <div>
        <div className="mb-2 flex items-start justify-between">
          <span
            className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${badgeClass(gear.platform)}`}
          >
            {gear.platform} link
          </span>
          <span className="text-sm font-black text-electric-yellow">{price}€</span>
        </div>
        <h3 className="mb-1 line-clamp-1 text-lg font-bold uppercase tracking-tight text-white">
          {gear.title}
        </h3>
        <p className="mb-4 line-clamp-2 text-xs text-slate-400">{gear.description}</p>
      </div>

      <a
        href={gear.affiliateUrl || '#'}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full border-2 border-white py-2 text-center text-xs font-black uppercase text-white transition-all duration-150 hover:border-electric-yellow hover:bg-electric-yellow hover:text-black"
      >
        Comprar herramienta ↗
      </a>
    </div>
  )
}
